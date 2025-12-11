use std::process::{Command, Child};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::{Duration, Instant};
use tauri::{State, Manager};
use serde::{Deserialize, Serialize};
use tokio::time::sleep;

#[derive(Debug, Serialize, Deserialize)]
pub struct LaunchParams {
    pub profile_id: String,
    pub username: String,
    pub uuid: String,
    pub access_token: String,
    pub game_dir: String,
    pub assets_dir: String,
    pub resolution: Resolution,
    pub full_screen: bool,
    pub java_path: String,
    pub java_version: String,
    pub ram: String,
    pub jvm_args: Vec<String>,
    pub client_args: Vec<String>,
    pub main_class: String,
    pub class_path: Vec<String>,
    pub server_address: Option<String>,
    pub server_port: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Resolution {
    pub width: u32,
    pub height: u32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LaunchResult {
    pub success: bool,
    pub process_id: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProcessStatus {
    pub running: bool,
    pub exit_code: Option<i32>,
    pub stdout: Option<String>,
    pub stderr: Option<String>,
}

// Структура для отслеживания процессов
struct GameProcess {
    child: Child,
    start_time: Instant,
    stdout: Arc<Mutex<Vec<u8>>>,
    stderr: Arc<Mutex<Vec<u8>>>,
}

// Глобальное хранилище процессов
static mut PROCESSES: Option<HashMap<String, Box<GameProcess>>> = None;
static mut NEXT_ID: u64 = 1;

#[tauri::command]
pub async fn launch_game_client(
    launch_params: LaunchParams,
    app_handle: tauri::AppHandle,
) -> Result<LaunchResult, String> {
    unsafe {
        if PROCESSES.is_none() {
            PROCESSES = Some(HashMap::new());
        }
    }

    let process_id = generate_process_id();

    // Подготовка командной строки для Java
    let mut cmd = Command::new(&launch_params.java_path);

    // JVM аргументы
    cmd.arg("-Xmx".to_string() + &launch_params.ram + "m")
       .arg("-Xms".to_string() + &launch_params.ram + "m");

    // Добавляем пользовательские JVM аргументы
    for arg in &launch_params.jvm_args {
        cmd.arg(arg);
    }

    // Основной класс
    cmd.arg(&launch_params.main_class);

    // Аргументы клиента
    let mut args = launch_params.client_args.clone();

    // Добавляем стандартные аргументы
    args.extend(vec![
        "--username".to_string(),
        launch_params.username,
        "--uuid".to_string(),
        launch_params.uuid,
        "--accessToken".to_string(),
        launch_params.access_token,
        "--version".to_string(),
        "1.12.2", // Должно браться из профиля
        "--gameDir".to_string(),
        launch_params.game_dir.clone(),
        "--assetsDir".to_string(),
        launch_params.assets_dir,
        "--assetIndex".to_string(),
        "1.12", // Должно браться из профиля
        "--userType".to_string(),
        "mojang",
        "--versionType".to_string(),
        "release",
    ]);

    // Добавляем аргументы сервера если есть
    if let Some(address) = &launch_params.server_address {
        args.push("--server".to_string());
        args.push(address.clone());

        if let Some(port) = launch_params.server_port {
            args.push("--port".to_string());
            args.push(port.to_string());
        }
    }

    // Добавляем все аргументы в команду
    for arg in args {
        cmd.arg(arg);
    }

    // Установка рабочего каталога
    cmd.current_dir(&launch_params.game_dir);

    // Настройка переменных окружения
    cmd.env("_JAVA_OPTIONS", &launch_params.jvm_args.join(" "));

    // Запуск процесса
    match cmd.spawn() {
        Ok(mut child) => {
            // Создаем буферы для вывода
            let stdout = Arc::new(Mutex::new(Vec::new()));
            let stderr = Arc::new(Mutex::new(Vec::new()));

            let stdout_clone = stdout.clone();
            let stderr_clone = stderr.clone();

            // Поток для чтения stdout
            thread::spawn(move || {
                use std::io::Read;
                if let Some(mut stdout_reader) = child.stdout.take() {
                    let mut buffer = [0; 1024];
                    while let Ok(n) = stdout_reader.read(&mut buffer) {
                        if n == 0 { break; }
                        if let Ok(mut stdout_buf) = stdout_clone.lock() {
                            stdout_buf.extend_from_slice(&buffer[..n]);
                        }
                    }
                }
            });

            // Поток для чтения stderr
            thread::spawn(move || {
                use std::io::Read;
                if let Some(mut stderr_reader) = child.stderr.take() {
                    let mut buffer = [0; 1024];
                    while let Ok(n) = stderr_reader.read(&mut buffer) {
                        if n == 0 { break; }
                        if let Ok(mut stderr_buf) = stderr_clone.lock() {
                            stderr_buf.extend_from_slice(&buffer[..n]);
                        }
                    }
                }
            });

            // Сохраняем процесс
            let game_process = GameProcess {
                child,
                start_time: Instant::now(),
                stdout,
                stderr,
            };

            unsafe {
                if let Some(ref mut processes) = PROCESSES {
                    processes.insert(process_id.clone(), Box::new(game_process));
                }
            }

            // Отправляем уведомление об успешном запуске
            if let Err(e) = app_handle.emit("game-launched", &process_id) {
                eprintln!("Failed to emit game-launched event: {}", e);
            }

            Ok(LaunchResult {
                success: true,
                process_id: Some(process_id),
                error: None,
            })
        }
        Err(e) => {
            let error_msg = format!("Failed to launch game: {}", e);
            eprintln!("{}", error_msg);

            Ok(LaunchResult {
                success: false,
                process_id: None,
                error: Some(error_msg),
            })
        }
    }
}

#[tauri::command]
pub async fn check_game_process(
    process_id: String,
) -> Result<ProcessStatus, String> {
    unsafe {
        if let Some(ref processes) = PROCESSES {
            if let Some(game_process) = processes.get(&process_id) {
                // Проверяем статус процесса
                match game_process.child.try_wait() {
                    Ok(status) => {
                        let exit_code = status.code();
                        let stdout = game_process.stdout.lock()
                            .map(|buf| String::from_utf8_lossy(&buf).to_string())
                            .unwrap_or_default();
                        let stderr = game_process.stderr.lock()
                            .map(|buf| String::from_utf8_lossy(&buf).to_string())
                            .unwrap_or_default();

                        Ok(ProcessStatus {
                            running: false,
                            exit_code,
                            stdout: Some(stdout),
                            stderr: Some(stderr),
                        })
                    }
                    Err(_) => {
                        // Процесс все еще работает
                        Ok(ProcessStatus {
                            running: true,
                            exit_code: None,
                            stdout: None,
                            stderr: None,
                        })
                    }
                }
            } else {
                Err("Process not found".to_string())
            }
        } else {
            Err("Process manager not initialized".to_string())
        }
    }
}

#[tauri::command]
pub async fn kill_game_process(
    process_id: String,
) -> Result<bool, String> {
    unsafe {
        if let Some(ref mut processes) = PROCESSES {
            if let Some(mut game_process) = processes.remove(&process_id) {
                match game_process.child.kill() {
                    Ok(_) => {
                        println!("Process {} killed successfully", process_id);
                        Ok(true)
                    }
                    Err(e) => {
                        let error_msg = format!("Failed to kill process: {}", e);
                        eprintln!("{}", error_msg);
                        Err(error_msg)
                    }
                }
            } else {
                Err("Process not found".to_string())
            }
        } else {
            Err("Process manager not initialized".to_string())
        }
    }
}

// Вспомогательные функции
fn generate_process_id() -> String {
    unsafe {
        let id = NEXT_ID;
        NEXT_ID += 1;
        format!("game_process_{}", id)
    }
}

// Функция очистки мертвых процессов
pub fn cleanup_dead_processes() {
    unsafe {
        if let Some(ref mut processes) = PROCESSES {
            let mut dead_processes = Vec::new();

            for (id, process) in processes.iter() {
                match process.child.try_wait() {
                    Ok(_) => {
                        dead_processes.push(id.clone());
                    }
                    Err(_) => {
                        // Процесс все еще работает
                    }
                }
            }

            for id in dead_processes {
                processes.remove(&id);
                println!("Cleaned up dead process: {}", id);
            }
        }
    }
}
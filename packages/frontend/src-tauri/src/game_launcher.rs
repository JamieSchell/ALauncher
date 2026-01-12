use std::process::{Command, Child};
use std::collections::HashMap;
use std::sync::{Arc, Mutex, OnceLock};
use std::thread;
use std::time::Instant;
use std::path::{Path, PathBuf};
use tauri::Emitter;
use serde::{Deserialize, Serialize};
use walkdir::WalkDir;
use std::fs;

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
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "processId")]
    pub process_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
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
    #[allow(dead_code)]
    start_time: Instant,
    stdout: Arc<Mutex<Vec<u8>>>,
    stderr: Arc<Mutex<Vec<u8>>>,
}

// Глобальное хранилище процессов (безопасное)
static PROCESSES: OnceLock<Mutex<HashMap<String, Box<GameProcess>>>> = OnceLock::new();
static NEXT_ID: Mutex<u64> = Mutex::new(1);

#[tauri::command]
pub async fn launch_game_client(
    launch_params: LaunchParams,
    app_handle: tauri::AppHandle,
) -> Result<LaunchResult, String> {
    // Инициализируем хранилище процессов при первом использовании
    PROCESSES.get_or_init(|| Mutex::new(HashMap::new()));

    let process_id = generate_process_id();

    // Клонируем значения для проверки директорий до их перемещения в args
    let game_dir = launch_params.game_dir.clone();
    let assets_dir = launch_params.assets_dir.clone();

    // Логируем параметры запуска
    eprintln!("=== Game Launch Parameters ===");
    eprintln!("Process ID: {}", process_id);
    eprintln!("Java Path: {}", launch_params.java_path);
    eprintln!("Game Dir: {}", game_dir);
    eprintln!("Assets Dir: {}", assets_dir);
    eprintln!("Main Class: {}", launch_params.main_class);
    eprintln!("RAM: {} MB", launch_params.ram);
    eprintln!("Username: {}", launch_params.username);
    eprintln!("Profile ID: {}", launch_params.profile_id);
    eprintln!("Server: {:?}", launch_params.server_address);
    eprintln!("==============================");

    // 1. Проверяем и извлекаем native библиотеки перед запуском
    eprintln!("[Launcher Backend] Checking and extracting native libraries...");
    match prepare_natives(&game_dir) {
        Ok(_) => {
            eprintln!("[Launcher Backend] ✅ Native libraries prepared successfully");
        }
        Err(e) => {
            eprintln!("[Launcher Backend] ❌ Failed to prepare native libraries: {}", e);
            return Err(format!("Failed to prepare native libraries: {}", e));
        }
    }

    // Подготовка командной строки для Java
    let mut cmd = Command::new(&launch_params.java_path);

    
    // Classpath
    let cp_separator = if cfg!(target_os = "windows") { ";" } else { ":" };
    let mut new_class_path = Vec::new();

    for path_item in &launch_params.class_path {
        if path_item == "libraries" {
            let libraries_dir = std::path::Path::new(&game_dir).join("libraries");
            if libraries_dir.is_dir() {
                // Recursively find all .jar files
                let walker = walkdir::WalkDir::new(libraries_dir);
                for entry in walker.into_iter().filter_map(|e| e.ok()) {
                    if entry.file_type().is_file() && entry.path().extension().and_then(std::ffi::OsStr::to_str) == Some("jar") {
                        new_class_path.push(entry.path().to_string_lossy().to_string());
                    }
                }
            }
        } else {
            new_class_path.push(std::path::Path::new(&game_dir).join(path_item).to_string_lossy().to_string());
        }
    }

    let full_class_path = new_class_path.join(cp_separator);
    cmd.arg("-cp").arg(full_class_path);


    // JVM аргументы
    cmd.arg("-Xmx".to_string() + &launch_params.ram + "m")
       .arg("-Xms".to_string() + &launch_params.ram + "m");

    // Устанавливаем java.library.path
    let natives_dir = std::path::Path::new(&game_dir).join("natives");
    eprintln!("[Launcher Backend] Setting java.library.path to: {}", natives_dir.to_string_lossy());
    cmd.arg(format!("-Djava.library.path={}", natives_dir.to_string_lossy()));
    
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
        launch_params.profile_id.clone(), // Берем из профиля
        "--gameDir".to_string(),
        launch_params.game_dir.clone(),
        "--assetsDir".to_string(),
        launch_params.assets_dir,
        "--assetIndex".to_string(),
        "1.12".to_string(), // TODO: Должно браться из профиля
        "--userType".to_string(),
        "mojang".to_string(),
        "--versionType".to_string(),
        "release".to_string(),
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
    


    // Проверка и создание рабочего каталога
    eprintln!("Checking game directory: {}", game_dir);
    let game_dir_path = std::path::Path::new(&game_dir);
    if !game_dir_path.exists() {
        eprintln!("Game directory does not exist, creating...");
        // Создаем директорию, если она не существует
        std::fs::create_dir_all(game_dir_path)
            .map_err(|e| format!("Failed to create game directory '{}': {}", game_dir, e))?;
        eprintln!("Game directory created successfully");
    }

    // Проверяем, что путь действительно является директорией
    if !game_dir_path.is_dir() {
        return Err(format!("Path '{}' is not a valid directory", game_dir));
    }
    eprintln!("Game directory validated: {}", game_dir);

    // Проверка и создание assets директории
    eprintln!("Checking assets directory: {}", assets_dir);
    let assets_dir_path = std::path::Path::new(&assets_dir);
    if !assets_dir_path.exists() {
        eprintln!("Assets directory does not exist, creating...");
        std::fs::create_dir_all(assets_dir_path)
            .map_err(|e| format!("Failed to create assets directory '{}': {}", assets_dir, e))?;
        eprintln!("Assets directory created successfully");
    }
    eprintln!("Assets directory validated: {}", assets_dir);

    // Установка рабочего каталога
    eprintln!("Setting current directory to: {}", game_dir);
    cmd.current_dir(&game_dir);

    // Настройка переменных окружения
    cmd.env("_JAVA_OPTIONS", &launch_params.jvm_args.join(" "));

    // Логируем полную команду
    eprintln!("=== Launching Java Process ===");
    eprintln!("Command: {:?}", cmd);
    eprintln!("============================");

    // Redirect stdout and stderr to pipes to capture output
    cmd.stdout(std::process::Stdio::piped());
    cmd.stderr(std::process::Stdio::piped());

    // Скрываем консольное окно на Windows
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }

    // Запуск процесса
    match cmd.spawn() {
        Ok(mut child) => {
            // Создаем буферы для вывода
            let stdout = Arc::new(Mutex::new(Vec::new()));
            let stderr = Arc::new(Mutex::new(Vec::new()));

            // Забираем потоки до создания замыканий
            let stdout_reader = child.stdout.take().expect("Failed to open stdout");
            let stderr_reader = child.stderr.take().expect("Failed to open stderr");

            let stdout_clone = stdout.clone();
            let stderr_clone = stderr.clone();

            // Поток для чтения stdout
            thread::spawn(move || {
                use std::io::Read;
                let mut reader = stdout_reader;
                let mut buffer = [0; 1024];
                while let Ok(n) = reader.read(&mut buffer) {
                    if n == 0 { break; }
                    if let Ok(mut stdout_buf) = stdout_clone.lock() {
                        stdout_buf.extend_from_slice(&buffer[..n]);
                    }
                }
            });

            // Поток для чтения stderr
            thread::spawn(move || {
                use std::io::Read;
                let mut reader = stderr_reader;
                let mut buffer = [0; 1024];
                while let Ok(n) = reader.read(&mut buffer) {
                    if n == 0 { break; }
                    if let Ok(mut stderr_buf) = stderr_clone.lock() {
                        stderr_buf.extend_from_slice(&buffer[..n]);
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

            if let Some(processes_lock) = PROCESSES.get() {
                let mut processes = processes_lock.lock().unwrap();
                processes.insert(process_id.clone(), Box::new(game_process));
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
            let error_msg = format!("Failed to launch game: {}. Check if Java is installed and configured correctly.", e);
            eprintln!("[ERROR] {}", error_msg);
            eprintln!("[ERROR] Java path: {}", launch_params.java_path);
            eprintln!("[ERROR] Game directory: {}", game_dir);
            eprintln!("[ERROR] Working directory: {:?}", cmd.get_current_dir());
            eprintln!("[ERROR] Full error: {:?}", e);

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
    if let Some(processes_lock) = PROCESSES.get() {
        let mut processes = processes_lock.lock().unwrap();
        if let Some(game_process) = processes.get_mut(&process_id) {
            // Проверяем статус процесса
            match game_process.child.try_wait() {
                Ok(Some(status)) => {
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
                Ok(None) => {
                    // Процесс все еще работает
                    Ok(ProcessStatus {
                        running: true,
                        exit_code: None,
                        stdout: None,
                        stderr: None,
                    })
                }
                Err(_) => {
                    // Ошибка проверки статуса
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

#[tauri::command]
pub async fn kill_game_process(
    process_id: String,
) -> Result<bool, String> {
    if let Some(processes_lock) = PROCESSES.get() {
        let mut processes = processes_lock.lock().unwrap();
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

// Вспомогательные функции
fn generate_process_id() -> String {
    let mut id = NEXT_ID.lock().unwrap();
    let current_id = *id;
    *id += 1;
    format!("game_process_{}", current_id)
}

/**
 * Локальное извлечение native библиотек из JAR файлов
 * Работает на стороне клиента без обращения к API
 */
fn prepare_natives_local(game_dir: &str) -> Result<(), String> {
    let game_path = Path::new(game_dir);
    let libraries_dir = game_path.join("libraries");
    let natives_dir = game_path.join("natives");

    // Создаем директорию natives, если не существует
    fs::create_dir_all(&natives_dir)
        .map_err(|e| format!("Failed to create natives directory: {}", e))?;

    // Сначала консолидируем нативные библиотеки из всех платформенных папок в корень
    // Это нужно, если библиотеки были извлечены бэкендом в подпапки
    if let Err(e) = consolidate_natives(&natives_dir) {
        eprintln!("[Launcher Backend] ⚠️ Failed to consolidate natives: {}", e);
        // Не прерываем выполнение, может быть библиотеки уже в корне
    }

    // Проверяем, есть ли нативные библиотеки (.dll, .so, .dylib) в корне
    let has_natives = check_natives_exist_in_root(&natives_dir);

    if has_natives {
        eprintln!("[Launcher Backend] ✅ Native libraries already exist in root, skipping extraction");
        return Ok(());
    }

    eprintln!("[Launcher Backend] Extracting native libraries locally...");

    // Определяем текущую платформу
    let platform = if cfg!(target_os = "windows") {
        "windows"
    } else if cfg!(target_os = "macos") {
        "macos"
    } else if cfg!(target_os = "linux") {
        "linux"
    } else {
        "unknown"
    };

    // Находим все JAR файлы с "natives" в имени
    let natives_jars = find_natives_jars(&libraries_dir)?;

    if natives_jars.is_empty() {
        eprintln!("[Launcher Backend] ⚠️ No natives JAR files found");
        return Ok(()); // Не ошибка, просто нет natives
    }

    eprintln!("[Launcher Backend] Found {} natives JAR files", natives_jars.len());

    // Извлекаем natives из каждого JAR файла
    for jar_path in &natives_jars {
        // Проверяем, предназначен ли этот JAR для текущей платформы
        let jar_name = jar_path.to_string_lossy().to_lowercase();
        let platform_specific = jar_name.contains("natives-") &&
            (jar_name.contains(&format!("natives-{}", platform)) ||
             jar_name.contains("natives-windows") && cfg!(target_os = "windows") ||
             jar_name.contains("natives-linux") && cfg!(target_os = "linux") ||
             jar_name.contains("natives-osx") && cfg!(target_os = "macos") ||
             jar_name.contains("natives-macos") && cfg!(target_os = "macos"));

        // Если JAR содержит специфичную для платформы пометку и это не наша платформа, пропускаем
        if jar_name.contains("natives-") && !platform_specific {
            eprintln!("[Launcher Backend] Skipping platform-specific JAR: {}", jar_name);
            continue;
        }

        if let Err(e) = extract_natives_from_jar(jar_path, &natives_dir) {
            eprintln!("[Launcher Backend] ⚠️ Failed to extract {}: {}", jar_name, e);
            // Продолжаем со следующим файлом
        }
    }

    // Проверяем, успешно ли прошло извлечение (проверяем только в корне)
    let has_natives = check_natives_exist_in_root(&natives_dir);
    if has_natives {
        eprintln!("[Launcher Backend] ✅ Native libraries extracted successfully");
        Ok(())
    } else {
        Err("No native libraries were extracted to root directory".to_string())
    }
}

/**
 * Собрать все нативные библиотеки из всех платформенных подпапок в корень natives
 * Это нужно для Java, которая ищет библиотеки только в корне java.library.path
 */
fn consolidate_natives(natives_dir: &PathBuf) -> Result<(), String> {
    eprintln!("[Launcher Backend] Consolidating native libraries to root natives directory...");

    let platform_dirs = ["windows", "linux", "macos", "osx"];
    let mut copied_count = 0;

    for platform in &platform_dirs {
        let platform_dir = natives_dir.join(platform);
        if !platform_dir.exists() {
            continue;
        }

        eprintln!("[Launcher Backend] Processing platform directory: {}", platform);

        // Рекурсивно ищем нативные библиотеки в платформенной папке
        if let Ok(entries) = walkdir::WalkDir::new(&platform_dir)
            .into_iter()
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| format!("Failed to walk directory: {}", e))
        {
            for entry in entries {
                if entry.file_type().is_file() {
                    if let Some(ext) = entry.path().extension() {
                        let ext_lower = ext.to_string_lossy().to_lowercase();
                        if matches!(ext_lower.as_str(), "dll" | "so" | "dylib") {
                            // Копируем файл в корень natives
                            let file_name = entry.file_name();
                            let dest_path = natives_dir.join(file_name);

                            // Пропускаем, если файл уже существует в корне
                            if dest_path.exists() {
                                continue;
                            }

                            fs::copy(entry.path(), &dest_path)
                                .map_err(|e| format!("Failed to copy {:?} to {:?}: {}", entry.path(), dest_path, e))?;

                            eprintln!("[Launcher Backend] Copied: {} -> {}", entry.path().display(), dest_path.display());
                            copied_count += 1;
                        }
                    }
                }
            }
        }
    }

    if copied_count > 0 {
        eprintln!("[Launcher Backend] ✅ Copied {} native libraries to root", copied_count);
    }

    Ok(())
}

/**
 * Проверить, существуют ли нативные библиотеки в корневой директории (не рекурсивно)
 */
fn check_natives_exist_in_root(natives_dir: &PathBuf) -> bool {
    if let Ok(entries) = fs::read_dir(natives_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                let ext = path.extension().and_then(|s| s.to_str());
                if matches!(ext, Some("dll") | Some("so") | Some("dylib")) {
                    return true;
                }
            }
        }
    }
    false
}

/**
 * Найти все JAR файлы с "natives" в названии
 */
fn find_natives_jars(libraries_dir: &PathBuf) -> Result<Vec<PathBuf>, String> {
    let mut natives_jars = Vec::new();

    if !libraries_dir.exists() {
        return Ok(natives_jars);
    }

    for entry in WalkDir::new(libraries_dir)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let path = entry.path();
        if path.is_file() {
            if let Some(ext) = path.extension() {
                if ext == "jar" {
                    let file_name = path.file_name()
                        .and_then(|n| n.to_str())
                        .unwrap_or("")
                        .to_lowercase();
                    if file_name.contains("natives") {
                        natives_jars.push(path.to_path_buf());
                    }
                }
            }
        }
    }

    Ok(natives_jars)
}

/**
 * Извлечь нативные библиотеки из JAR файла в директорию natives
 */
fn extract_natives_from_jar(jar_path: &PathBuf, natives_dir: &PathBuf) -> Result<(), String> {
    use zip::ZipArchive;

    // Открываем JAR файл как ZIP архив
    let file = fs::File::open(jar_path)
        .map_err(|e| format!("Failed to open JAR file: {}", e))?;

    let mut archive = ZipArchive::new(file)
        .map_err(|e| format!("Failed to read ZIP archive: {}", e))?;

    // Извлекаем только нативные библиотеки (.dll, .so, .dylib)
    for i in 0..archive.len() {
        let mut file = archive.by_index(i)
            .map_err(|e| format!("Failed to get file {}: {}", i, e))?;

        let file_name = file.name().to_string();
        let path = PathBuf::from(&file_name);

        // Проверяем расширение файла
        if let Some(ext) = path.extension() {
            let ext_lower = ext.to_string_lossy().to_lowercase();
            if matches!(ext_lower.as_str(), "dll" | "so" | "dylib") {
                // Извлекаем файл
                let file_name_only = path.file_name()
                    .and_then(|n| n.to_str())
                    .ok_or_else(|| format!("Invalid file name: {}", file_name))?;

                let file_path = natives_dir.join(file_name_only);
                let mut output = fs::File::create(&file_path)
                    .map_err(|e| format!("Failed to create file {:?}: {}", file_path, e))?;

                std::io::copy(&mut file, &mut output)
                    .map_err(|e| format!("Failed to write file {:?}: {}", file_path, e))?;

                eprintln!("[Launcher Backend] Extracted: {}", file_name);
            }
        }
    }

    Ok(())
}

/**
 * Подготовка native библиотек перед запуском игры (обертка)
 * Вызывает локальную функцию извлечения
 */
fn prepare_natives(game_dir: &str) -> Result<(), String> {
    prepare_natives_local(game_dir)
}

// Функция очистки мертвых процессов
#[allow(dead_code)]
pub fn cleanup_dead_processes() {
    if let Some(processes_lock) = PROCESSES.get() {
        let mut processes = processes_lock.lock().unwrap();
        let mut dead_processes = Vec::new();

        for (id, process) in processes.iter_mut() {
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
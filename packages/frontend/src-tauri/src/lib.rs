#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs::{self, File};
use std::path::Path;
use tauri::Manager;
use sha2::{Sha256, Digest};
use std::io::Read;

#[cfg(not(debug_assertions))]
use tauri::{menu::{Menu, MenuItem}, tray::{TrayIconBuilder, TrayIconEvent}};

mod game_launcher;
mod java_locator;

#[tauri::command]
fn find_java_installations() -> Vec<java_locator::JavaInstallation> {
    java_locator::find_java_installations()
}

// ===== FILE OPERATIONS COMMANDS =====

#[tauri::command]
async fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[tauri::command]
async fn get_platform() -> String {
    std::env::consts::OS.to_string()
}

#[tauri::command]
async fn get_arch() -> String {
    std::env::consts::ARCH.to_string()
}

#[tauri::command]
async fn file_exists(path: String) -> Result<bool, String> {
    Ok(std::path::Path::new(&path).exists())
}

#[tauri::command]
async fn read_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read file: {}", e))
}

#[tauri::command]
async fn write_file(path: String, content: String) -> Result<(), String> {
    fs::write(&path, content)
        .map_err(|e| format!("Failed to write file: {}", e))
}

#[tauri::command]
async fn calculate_file_hash(path: String, algorithm: String) -> Result<String, String> {
    if algorithm != "sha256" {
        return Err(format!("Unsupported hash algorithm: {}. Only sha256 is supported.", algorithm));
    }

    let mut file = File::open(&path)
        .map_err(|e| format!("Failed to open file for hashing: {}", e))?;

    let mut hasher = Sha256::new();
    let mut buffer = [0u8; 8192];

    loop {
        let n = file.read(&mut buffer)
            .map_err(|e| format!("Failed to read file for hashing: {}", e))?;
        if n == 0 {
            break;
        }
        hasher.update(&buffer[..n]);
    }

    Ok(hex::encode(hasher.finalize()))
}

#[tauri::command]
async fn get_file_info(path: String) -> Result<FileInfo, String> {
    let metadata = fs::metadata(&path)
        .map_err(|e| format!("Failed to get file metadata: {}", e))?;

    Ok(FileInfo {
        size: metadata.len(),
        is_file: metadata.is_file(),
        is_dir: metadata.is_dir(),
        modified: metadata.modified()
            .ok()
            .map(|t| t.duration_since(std::time::UNIX_EPOCH).unwrap().as_millis() as i64),
    })
}

#[derive(serde::Serialize)]
struct FileInfo {
    size: u64,
    is_file: bool,
    is_dir: bool,
    modified: Option<i64>,
}

#[tauri::command]
async fn ensure_dir(path: String) -> Result<(), String> {
    fs::create_dir_all(&path)
        .map_err(|e| format!("Failed to create directory: {}", e))
}

#[tauri::command]
async fn get_updates_dir() -> Result<String, String> {
    let base_dir = if cfg!(target_os = "windows") {
        dirs::data_local_dir()
    } else if cfg!(target_os = "macos") {
        dirs::data_dir()
    } else {
        dirs::data_local_dir()
    };

    match base_dir {
        Some(dir) => Ok(dir.join("ALauncher").to_string_lossy().to_string()),
        None => Err("Failed to determine updates directory".to_string()),
    }
}

#[tauri::command]
async fn download_file(
    url: String,
    dest_path: String,
    _on_progress: bool,
    access_token: Option<String>,
    _app: tauri::AppHandle,
) -> Result<(), String> {
    use reqwest::header;

    let client = reqwest::Client::new();
    let mut request = client.get(&url);

    if let Some(token) = access_token {
        request = request.header(header::AUTHORIZATION, format!("Bearer {}", token));
    }

    let response = request.send()
        .await
        .map_err(|e| format!("Failed to initiate download: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Download failed with status: {}", response.status()));
    }

    let _total_bytes = response.content_length().unwrap_or(0);

    if let Some(parent) = Path::new(&dest_path).parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create destination directory: {}", e))?;
    }

    let mut file = File::create(&dest_path)
        .map_err(|e| format!("Failed to create destination file: {}", e))?;

    use std::io::Write;
    let body = response.bytes().await.map_err(|e| format!("Failed to get response body: {}", e))?;

    // Write the entire body at once
    file.write_all(&body)
        .map_err(|e| format!("Failed to write downloaded content: {}", e))?;

    Ok(())
}

// ===== WINDOW MANAGEMENT COMMANDS =====

#[tauri::command]
async fn window_minimize(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.minimize().map_err(|e| e.to_string())
    } else {
        Err("Window not found".to_string())
    }
}

#[tauri::command]
async fn window_maximize(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.maximize().map_err(|e| e.to_string())
    } else {
        Err("Window not found".to_string())
    }
}

#[tauri::command]
async fn window_toggle_maximize(app: tauri::AppHandle) -> Result<bool, String> {
    if let Some(window) = app.get_webview_window("main") {
        let is_maximized = window.is_maximized().map_err(|e| e.to_string())?;
        if is_maximized {
            window.unmaximize().map_err(|e| e.to_string())?;
        } else {
            window.maximize().map_err(|e| e.to_string())?;
        }
        Ok(!is_maximized)
    } else {
        Err("Window not found".to_string())
    }
}

#[tauri::command]
async fn window_close(app: tauri::AppHandle) -> Result<(), String> {
    #[cfg(not(debug_assertions))]
    {
        app.exit(0);
    }
    #[cfg(debug_assertions)]
    {
        if let Some(window) = app.get_webview_window("main") {
            window.close().map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

#[tauri::command]
async fn window_hide(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.hide().map_err(|e| e.to_string())
    } else {
        Err("Window not found".to_string())
    }
}

#[tauri::command]
async fn open_devtools(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.open_devtools();
        Ok(())
    } else {
        Err("Window not found".to_string())
    }
}

// ===== MAIN APPLICATION =====

pub fn run() {
    let result = std::panic::catch_unwind(|| {
        tauri::Builder::default()
            // Updater plugin for automatic updates
            .plugin(tauri_plugin_updater::Builder::new().build())
            // Store plugin for persistent data storage
            .plugin(tauri_plugin_store::Builder::new().build())
            // БЕЗ ДРУГИХ ПЛАГИНОВ - они вызывали краш на Windows
            // .plugin(tauri_plugin_process::init())
            // .plugin(tauri_plugin_devtools::init())
            // .plugin(tauri_plugin_shell::init())
            // .plugin(tauri_plugin_dialog::init())
            .invoke_handler(tauri::generate_handler![
                // File operations
                get_app_version,
                get_platform,
                get_arch,
                file_exists,
                read_file,
                write_file,
                calculate_file_hash,
                get_file_info,
                ensure_dir,
                get_updates_dir,
                download_file,
                find_java_installations,
                // Window management
                window_minimize,
                window_maximize,
                window_toggle_maximize,
                window_close,
                window_hide,
                open_devtools,
                // Game launcher
                game_launcher::launch_game_client,
                game_launcher::check_game_process,
                game_launcher::kill_game_process
            ])
            .setup(|app| {
                // Создаем системный трей (только в продакшн)
                #[cfg(not(debug_assertions))]
                {
                    if let Ok(show_item) = MenuItem::with_id(app, "show", "Показать", true, None::<&str>) {
                        if let Ok(quit_item) = MenuItem::with_id(app, "quit", "Выход", true, None::<&str>) {
                            if let Ok(menu) = Menu::with_items(app, &[&show_item, &quit_item]) {
                                let _tray = TrayIconBuilder::new()
                                    .menu(&menu)
                                    .tooltip("ALauncher")
                                    .on_menu_event(|app, event| {
                                        match event.id.as_ref() {
                                            "show" => {
                                                if let Some(window) = app.get_webview_window("main") {
                                                    let _ = window.show();
                                                    let _ = window.set_focus();
                                                }
                                            }
                                            "quit" => {
                                                app.exit(0);
                                            }
                                            _ => {}
                                        }
                                    })
                                    .on_tray_icon_event(|tray, event| {
                                        if let TrayIconEvent::Click { button, .. } = event {
                                            if button == tauri::tray::MouseButton::Left {
                                                let app = tray.app_handle();
                                                if let Some(window) = app.get_webview_window("main") {
                                                    let _ = window.show();
                                                    let _ = window.set_focus();
                                                }
                                            }
                                        }
                                    })
                                    .build(app);
                            }
                        }
                    }
                }

                if let Some(window) = app.get_webview_window("main") {
                    #[cfg(not(debug_assertions))]
                    let window_clone = window.clone();
                    let _ = window.on_window_event(move |event| {
                        #[cfg(not(debug_assertions))]
                        if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                            api.prevent_close();
                            let _ = window_clone.hide();
                        }
                        #[cfg(debug_assertions)]
                        if let tauri::WindowEvent::CloseRequested { .. } = event {
                            // В debug режиме просто закрываем
                        }
                    });
                    let _ = window.show();
                }
                Ok(())
            })
            .run(tauri::generate_context!())
    });

    #[cfg(debug_assertions)]
    match result {
        Ok(Ok(_)) => {
            println!("ALauncher exited normally");
        },
        Ok(Err(e)) => {
            eprintln!("ALauncher ERROR: {}", e);
            std::process::exit(1);
        },
        Err(_) => {
            eprintln!("ALauncher PANIC: Application panicked!");
            std::process::exit(1);
        }
    }

    #[cfg(not(debug_assertions))]
    let _ = result;
}

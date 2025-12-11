// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use tauri::Manager;

mod game_launcher;

#[derive(Debug, Serialize, Deserialize)]
struct FileInfo {
    path: String,
    size: u64,
    modified: u64,
}

#[derive(Debug, Serialize, Deserialize)]
struct ApiResponse<T> {
    success: bool,
    data: Option<T>,
    error: Option<String>,
}

// Tauri commands to replace Electron IPC
#[tauri::command]
async fn get_app_version() -> Result<String, String> {
    Ok(env!("CARGO_PKG_VERSION").to_string())
}

#[tauri::command]
async fn get_platform() -> Result<String, String> {
    Ok(std::env::consts::OS.to_string())
}

#[tauri::command]
async fn get_arch() -> Result<String, String> {
    Ok(std::env::consts::ARCH.to_string())
}

#[tauri::command]
async fn read_file(path: String) -> Result<String, String> {
    match fs::read_to_string(&path) {
        Ok(content) => Ok(content),
        Err(e) => Err(format!("Failed to read file: {}", e)),
    }
}

#[tauri::command]
async fn write_file(path: String, content: String) -> Result<(), String> {
    match fs::write(&path, content) {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Failed to write file: {}", e)),
    }
}

#[tauri::command]
async fn get_file_info(path: String) -> Result<FileInfo, String> {
    let metadata = match fs::metadata(&path) {
        Ok(meta) => meta,
        Err(e) => return Err(format!("Failed to get file metadata: {}", e)),
    };

    let modified = metadata.modified()
        .and_then(|t| Ok(t.duration_since(std::time::UNIX_EPOCH).unwrap().as_secs()))
        .unwrap_or(0);

    Ok(FileInfo {
        path,
        size: metadata.len(),
        modified,
    })
}

#[tauri::command]
async fn create_directory(path: String) -> Result<(), String> {
    match fs::create_dir_all(&path) {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Failed to create directory: {}", e)),
    }
}

#[tauri::command]
async fn delete_file(path: String) -> Result<(), String> {
    if Path::new(&path).exists() {
        match fs::remove_file(&path) {
            Ok(_) => Ok(()),
            Err(e) => Err(format!("Failed to delete file: {}", e)),
        }
    } else {
        Err("File does not exist".to_string())
    }
}

#[tauri::command]
async fn open_url(url: String) -> Result<(), String> {
    match open::that(&url) {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Failed to open URL: {}", e)),
    }
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            get_app_version,
            get_platform,
            get_arch,
            read_file,
            write_file,
            get_file_info,
            create_directory,
            delete_file,
            open_url,
            game_launcher::launch_game_client,
            game_launcher::check_game_process,
            game_launcher::kill_game_process
        ])
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
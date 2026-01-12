use std::fs::OpenOptions;
use std::io::Write;
use std::path::PathBuf;
use std::sync::Mutex;
use chrono::Utc;

pub struct FileLogger {
    #[allow(dead_code)]
    file: Mutex<Option<std::fs::File>>,
    log_path: Mutex<Option<PathBuf>>,
}

impl FileLogger {
    #[allow(dead_code)]
    pub fn new() -> Self {
        let logger = FileLogger {
            file: Mutex::new(None),
            log_path: Mutex::new(None),
        };

        // Инициализация лог-файла
        if let Err(e) = logger.init_log_file() {
            eprintln!("[ALauncher] Failed to initialize log file: {}", e);
        }

        logger
    }

    #[allow(dead_code)]
    fn init_log_file(&self) -> Result<(), Box<dyn std::error::Error>> {
        // Используем пользовательскую директорию для логов (доступна для записи)
        let log_dir = if cfg!(target_os = "windows") {
            // На Windows: C:\Users\Username\AppData\Local\ALauncher\logs
            dirs::data_local_dir()
                .map(|d| d.join("ALauncher").join("logs"))
                .ok_or("Failed to get data local dir")?
        } else if cfg!(target_os = "macos") {
            // На macOS: ~/Library/Application Support/ALauncher/logs
            dirs::data_dir()
                .map(|d| d.join("ALauncher").join("logs"))
                .ok_or("Failed to get data dir")?
        } else {
            // На Linux: ~/.local/share/ALauncher/logs
            dirs::data_local_dir()
                .map(|d| d.join("ALauncher").join("logs"))
                .ok_or("Failed to get data local dir")?
        };

        // Создаем директорию для логов
        std::fs::create_dir_all(&log_dir)?;

        // Создаем имя файла с датой и временем
        let now = Utc::now();
        let timestamp = now.format("%Y-%m-%d_%H-%M-%S");
        let log_file_path = log_dir.join(format!("alauncher_{}.log", timestamp));

        // Открываем файл для записи
        let file = OpenOptions::new()
            .create(true)
            .append(true)
            .open(&log_file_path)?;

        // Сохраняем путь к лог-файлу
        if let Ok(mut log_path_guard) = self.log_path.lock() {
            *log_path_guard = Some(log_file_path.clone());
        }

        // Сохраняем файл в mutex
        if let Ok(mut file_guard) = self.file.lock() {
            *file_guard = Some(file);
        }

        // Записываем путь к лог-файлу для удобства
        let latest_log_path = log_dir.join("latest.log");
        std::fs::write(&latest_log_path, log_file_path.to_string_lossy().as_bytes())?;

        // Записываем заголовок лога
        self.write_log(&format!(
            "=== ALauncher Log Started at {} ===\n",
            now.format("%Y-%m-%d %H:%M:%S UTC")
        ));

        // Записываем информацию о системе
        self.write_log(&format!("OS: {}", std::env::consts::OS));
        self.write_log(&format!("Arch: {}", std::env::consts::ARCH));
        self.write_log(&format!("Version: {}", env!("CARGO_PKG_VERSION")));
        self.write_log(&format!("Executable: {}", std::env::current_exe().unwrap_or_else(|_| PathBuf::from("unknown")).display()));
        self.write_log(&format!("Working Directory: {}", std::env::current_dir().unwrap_or_else(|_| PathBuf::from("unknown")).display()));
        self.write_log(&format!("Log file: {}", log_file_path.display()));
        self.write_log("=== System Info End ===\n");

        Ok(())
    }

    #[allow(dead_code)]
    pub fn write_log(&self, message: &str) {
        if let Ok(mut file_guard) = self.file.lock() {
            if let Some(ref mut file) = *file_guard {
                let timestamp = Utc::now().format("%Y-%m-%d %H:%M:%S UTC");
                let log_line = format!("[{}] {}\n", timestamp, message);

                // Пишем в файл
                let _ = file.write_all(log_line.as_bytes());
                let _ = file.flush();
            }
        }

        // Также выводим в stderr (попадает в консоль)
        eprintln!("[ALauncher] {}", message);
    }

    #[allow(dead_code)]
    pub fn write_error(&self, error: &str) {
        self.write_log(&format!("ERROR: {}", error));
    }

    #[allow(dead_code)]
    pub fn write_panic(&self, panic_info: &str) {
        self.write_log(&format!("!!! PANIC !!!: {}", panic_info));
    }

    #[allow(dead_code)]
    pub fn get_log_file_path() -> Option<PathBuf> {
        let log_dir = if cfg!(target_os = "windows") {
            dirs::data_local_dir()?.join("ALauncher").join("logs")
        } else if cfg!(target_os = "macos") {
            dirs::data_dir()?.join("ALauncher").join("logs")
        } else {
            dirs::data_local_dir()?.join("ALauncher").join("logs")
        };

        let latest_log_path = log_dir.join("latest.log");

        if latest_log_path.exists() {
            if let Ok(log_content) = std::fs::read_to_string(&latest_log_path) {
                return Some(PathBuf::from(log_content.trim()));
            }
        }

        None
    }
}

// Глобальный логгер
#[allow(dead_code)]
static mut LOGGER: Option<FileLogger> = None;
#[allow(dead_code)]
static INIT: std::sync::Once = std::sync::Once::new();

#[allow(dead_code)]
pub fn init_logger() {
    INIT.call_once(|| {
        eprintln!("[ALauncher] Initializing logger...");

        unsafe {
            LOGGER = Some(FileLogger::new());
        }

        eprintln!("[ALauncher] Logger initialized");

        // Устанавливаем panic hook
        std::panic::set_hook(Box::new(|panic_info| {
            let location = panic_info.location().unwrap_or_else(|| std::panic::Location::caller());
            let msg = match panic_info.payload().downcast_ref::<&str>() {
                Some(s) => *s,
                None => match panic_info.payload().downcast_ref::<String>() {
                    Some(s) => &s[..],
                    None => "Box<Any>",
                },
            };

            let panic_details = format!("{} at {}:{}:{}", msg, location.file(), location.line(), location.column());

            unsafe {
                if let Some(ref logger) = LOGGER {
                    logger.write_panic(&panic_details);
                }
            }

            eprintln!("[ALauncher PANIC] {}", panic_details);
        }));
    });
}

#[allow(dead_code)]
pub fn log_message(message: &str) {
    unsafe {
        if let Some(ref logger) = LOGGER {
            logger.write_log(message);
        }
    }
}

#[allow(dead_code)]
pub fn log_error(error: &str) {
    unsafe {
        if let Some(ref logger) = LOGGER {
            logger.write_error(error);
        }
    }
}

#[allow(dead_code)]
pub fn get_latest_log_path() -> Option<PathBuf> {
    FileLogger::get_log_file_path()
}

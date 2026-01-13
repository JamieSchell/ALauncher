use std::env;
use std::path::{Path, PathBuf};

/// Represents a Java installation
#[derive(Debug, Clone, serde::Serialize)]
pub struct JavaInstallation {
    pub path: PathBuf,
    pub version: String,
    pub is_64_bit: bool,
}

/// Find Java installations on the system
pub fn find_java_installations() -> Vec<JavaInstallation> {
    let mut installations = Vec::new();

    // Common Java installation paths by platform
    let search_paths = get_java_search_paths();

    for path in search_paths {
        if path.exists() {
            // Try to determine version
            let version = detect_java_version(&path);

            installations.push(JavaInstallation {
                path: path.clone(),
                version,
                is_64_bit: true, // Assume 64-bit for modern systems
            });
        }
    }

    // Also check JAVA_HOME environment variable
    if let Ok(java_home) = env::var("JAVA_HOME") {
        let java_path = PathBuf::from(java_home);
        if java_path.exists() && !installations.iter().any(|j| j.path == java_path) {
            installations.push(JavaInstallation {
                path: java_path,
                version: "JAVA_HOME".to_string(),
                is_64_bit: true,
            });
        }
    }

    installations
}

fn get_java_search_paths() -> Vec<PathBuf> {
    let os = env::consts::OS;
    let mut paths = Vec::new();

    match os {
        "linux" => {
            // Common Linux Java paths
            paths.extend(vec![
                PathBuf::from("/usr/lib/jvm/default-java"),
                PathBuf::from("/usr/lib/jvm/java-17-openjdk"),
                PathBuf::from("/usr/lib/jvm/java-21-openjdk"),
                PathBuf::from("/usr/lib/jvm/java-11-openjdk"),
                PathBuf::from("/usr/java/default"),
                PathBuf::from("/opt/java"),
            ]);
        }
        "macos" => {
            // macOS Java paths
            paths.extend(vec![
                PathBuf::from("/Library/Java/JavaVirtualMachines"),
                PathBuf::from("/System/Library/Java"),
            ]);
        }
        "windows" => {
            // Windows Java paths (using environment variables)
            if let Ok(program_files) = env::var("ProgramFiles") {
                paths.push(PathBuf::from(program_files).join("Java"));
            }
            if let Ok(program_files_x86) = env::var("ProgramFiles(x86)") {
                paths.push(PathBuf::from(program_files_x86).join("Java"));
            }
            paths.push(PathBuf::from("C:\\Program Files\\Java"));
            paths.push(PathBuf::from("C:\\Program Files (x86)\\Java"));
        }
        _ => {}
    }

    paths
}

fn detect_java_version(java_path: &Path) -> String {
    // Try to run java -version
    if let Some(java_bin) = find_java_executable(java_path) {
        use std::process::Command;

        if let Ok(output) = Command::new(&java_bin).arg("-version").output() {
            if let Ok(version_str) = String::from_utf8(output.stderr) {
                // Parse version from output
                // Format: "openjdk version \"17.0.1\" ..."
                if let Some(start) = version_str.find('"') {
                    if let Some(end) = version_str[start + 1..].find('"') {
                        return version_str[start + 1..start + 1 + end].to_string();
                    }
                }

                // Fallback: extract version number
                for line in version_str.lines() {
                    if line.contains("version") {
                        return line.trim().to_string();
                    }
                }
            }
        }
    }

    "Unknown".to_string()
}

fn find_java_executable(java_path: &Path) -> Option<PathBuf> {
    let bin_name = if env::consts::OS == "windows" {
        "java.exe"
    } else {
        "java"
    };

    // Check common locations
    let candidates = vec![
        java_path.join("bin").join(bin_name),
        java_path.join(bin_name),
    ];

    for candidate in candidates {
        if candidate.exists() {
            return Some(candidate);
        }
    }

    None
}

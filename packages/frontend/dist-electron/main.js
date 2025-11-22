"use strict";
const electron = require("electron");
const path = require("path");
const fs = require("fs");
const fsPromises = require("fs/promises");
const crypto = require("crypto");
const child_process = require("child_process");
const https = require("https");
const http = require("http");
let mainWindow = null;
let tray = null;
const activeDownloads = /* @__PURE__ */ new Map();
const isDevelopment = process.env.NODE_ENV === "development";
function stopAllDownloads() {
  console.log(`Stopping ${activeDownloads.size} active downloads...`);
  activeDownloads.forEach((download, id) => {
    try {
      download.request.destroy();
      download.writer.destroy();
      if (fs.existsSync(download.destPath)) {
        fs.unlinkSync(download.destPath);
      }
    } catch (error) {
      console.error(`Error stopping download ${id}:`, error);
    }
  });
  activeDownloads.clear();
}
function createTray() {
  try {
    const appDir = getAppDir();
    const possibleIconPaths = [
      path.join(appDir, "assets", "icon.png"),
      path.join(appDir, "icon.png"),
      path.join(process.cwd(), "assets", "icon.png"),
      path.join(process.cwd(), "icon.png")
    ];
    let iconPath = null;
    for (const possiblePath of possibleIconPaths) {
      if (fs.existsSync(possiblePath)) {
        iconPath = possiblePath;
        break;
      }
    }
    if (iconPath) {
      tray = new electron.Tray(iconPath);
    } else {
      const size = 16;
      const buffer = Buffer.alloc(size * size * 4);
      for (let i = 0; i < buffer.length; i += 4) {
        buffer[i] = 20;
        buffer[i + 1] = 20;
        buffer[i + 2] = 20;
        buffer[i + 3] = 255;
      }
      const drawPixel = (x, y) => {
        if (x >= 0 && x < size && y >= 0 && y < size) {
          const idx = (y * size + x) * 4;
          buffer[idx] = 255;
          buffer[idx + 1] = 255;
          buffer[idx + 2] = 255;
        }
      };
      for (let y = 4; y < 12; y++) {
        drawPixel(3, y);
        drawPixel(12, y);
        if (y < 8) {
          drawPixel(3 + (y - 4), y);
          drawPixel(12 - (y - 4), y);
        }
      }
      const img = electron.nativeImage.createFromBuffer(buffer, { width: size, height: size });
      tray = new electron.Tray(img);
    }
    const contextMenu = electron.Menu.buildFromTemplate([
      {
        label: "Show Launcher",
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          } else {
            createWindow();
          }
        }
      },
      {
        label: "Quit",
        click: () => {
          stopAllDownloads();
          electron.app.quit();
        }
      }
    ]);
    tray.setToolTip("Modern Launcher");
    tray.setContextMenu(contextMenu);
    tray.on("click", () => {
      if (mainWindow) {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
          mainWindow.focus();
        }
      } else {
        createWindow();
      }
    });
  } catch (error) {
    console.error("Failed to create tray:", error);
  }
}
function getAppDir() {
  if (isDevelopment) {
    return process.cwd();
  } else {
    return electron.app.getAppPath();
  }
}
function createWindow() {
  const appDir = getAppDir();
  const preloadPath = isDevelopment ? path.join(appDir, "dist-electron", "preload.js") : path.join(appDir, "preload.js");
  mainWindow = new electron.BrowserWindow({
    width: 1200,
    height: 750,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    transparent: false,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  if (isDevelopment) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    const indexPath = path.join(appDir, "dist", "index.html");
    mainWindow.loadFile(indexPath);
  }
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
  mainWindow.on("close", (event) => {
    if (tray && process.platform !== "darwin") {
      event.preventDefault();
      mainWindow == null ? void 0 : mainWindow.hide();
    } else {
      stopAllDownloads();
      if (mainWindow) {
        mainWindow.destroy();
        mainWindow = null;
      }
    }
  });
  mainWindow.on("minimize", () => {
  });
}
electron.app.whenReady().then(() => {
  createWindow();
  createTray();
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
electron.app.on("window-all-closed", () => {
  if (tray) {
    return;
  }
  if (process.platform !== "darwin") {
    stopAllDownloads();
    electron.app.quit();
  }
});
electron.app.on("before-quit", () => {
  stopAllDownloads();
});
electron.ipcMain.on("window:minimize", () => {
  mainWindow == null ? void 0 : mainWindow.minimize();
});
electron.ipcMain.on("window:maximize", () => {
  if (mainWindow == null ? void 0 : mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow == null ? void 0 : mainWindow.maximize();
  }
});
electron.ipcMain.on("window:close", () => {
  stopAllDownloads();
  mainWindow == null ? void 0 : mainWindow.close();
});
electron.ipcMain.on("window:minimizeToTray", () => {
  if (mainWindow) {
    mainWindow.hide();
  }
});
function findJarFiles(dir) {
  const jars = [];
  try {
    if (!fs.existsSync(dir)) {
      return jars;
    }
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        jars.push(...findJarFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith(".jar")) {
        jars.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
  }
  return jars;
}
function findNativeLibDirs(librariesDir) {
  const nativeDirs = [];
  const visited = /* @__PURE__ */ new Set();
  function searchDir(dir) {
    if (visited.has(dir) || !fs.existsSync(dir)) {
      return;
    }
    visited.add(dir);
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name === "natives") {
            nativeDirs.push(fullPath);
            continue;
          }
          searchDir(fullPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (ext === ".dll" || ext === ".so" || ext === ".dylib") {
            if (!nativeDirs.includes(dir)) {
              nativeDirs.push(dir);
            }
          }
        }
      }
    } catch (error) {
    }
  }
  searchDir(librariesDir);
  return Array.from(new Set(nativeDirs));
}
function findUpdatesDir() {
  const cwdUpdates = path.resolve(process.cwd(), "updates");
  if (fs.existsSync(cwdUpdates)) {
    console.log("Found updates in process.cwd():", cwdUpdates);
    return cwdUpdates;
  }
  const backendUpdates = path.resolve(process.cwd(), "packages", "backend", "updates");
  if (fs.existsSync(backendUpdates)) {
    console.log("Found updates in packages/backend/updates:", backendUpdates);
    return backendUpdates;
  }
  const appDir = getAppDir();
  let currentDir = appDir;
  const maxDepth = 10;
  let depth = 0;
  while (depth < maxDepth && currentDir !== path.dirname(currentDir)) {
    const packagesDir = path.join(currentDir, "packages");
    const updatesPath = path.join(currentDir, "updates");
    if (fs.existsSync(packagesDir) && fs.existsSync(updatesPath)) {
      console.log("Found updates in project root:", updatesPath);
      return path.resolve(updatesPath);
    }
    currentDir = path.dirname(currentDir);
    depth++;
  }
  try {
    const appPath = electron.app.getAppPath();
    let appDir2 = path.dirname(appPath);
    for (let i = 0; i < 5; i++) {
      const appUpdates = path.join(appDir2, "updates");
      if (fs.existsSync(appUpdates)) {
        console.log("Found updates relative to app path:", appUpdates);
        return path.resolve(appUpdates);
      }
      appDir2 = path.dirname(appDir2);
    }
  } catch (error) {
    console.warn("Could not get app path:", error);
  }
  const defaultPath = path.resolve(process.cwd(), "updates");
  console.log("Using default updates path:", defaultPath);
  return defaultPath;
}
electron.ipcMain.handle("launcher:launch", async (event, args) => {
  var _a, _b;
  const { javaPath, jvmArgs, mainClass, classPath, gameArgs, workingDir, version } = args;
  try {
    const updatesDir = findUpdatesDir();
    console.log("Updates directory:", updatesDir);
    const resolvedWorkingDir = path.isAbsolute(workingDir) ? workingDir : path.resolve(process.cwd(), workingDir);
    const resolvedClassPath = [];
    for (const cp of classPath) {
      if (cp === "client.jar") {
        let clientJar = path.join(updatesDir, version, "client.jar");
        if (!fs.existsSync(clientJar)) {
          clientJar = path.join(resolvedWorkingDir, version, "client.jar");
        }
        if (!fs.existsSync(clientJar)) {
          return {
            success: false,
            error: `Client JAR not found. Searched in:
- ${path.join(updatesDir, version, "client.jar")}
- ${path.join(resolvedWorkingDir, version, "client.jar")}

Please download Minecraft files first using: npm run download-minecraft ${version}`
          };
        }
        resolvedClassPath.push(clientJar);
      } else if (cp === "libraries") {
        let librariesDir2 = path.join(updatesDir, version, "libraries");
        if (!fs.existsSync(librariesDir2)) {
          librariesDir2 = path.join(resolvedWorkingDir, version, "libraries");
        }
        const jarFiles = findJarFiles(librariesDir2);
        if (jarFiles.length === 0) {
          console.warn(`No JAR files found in ${librariesDir2}`);
        }
        resolvedClassPath.push(...jarFiles);
        const nativeDirs = findNativeLibDirs(librariesDir2);
        if (nativeDirs.length > 0) {
          console.log(`Found ${nativeDirs.length} native library directories`);
        }
      } else {
        let resolved = path.isAbsolute(cp) ? cp : path.join(updatesDir, version, cp);
        if (!fs.existsSync(resolved)) {
          resolved = path.join(resolvedWorkingDir, version, cp);
        }
        if (fs.existsSync(resolved)) {
          resolvedClassPath.push(resolved);
        } else {
          console.warn(`ClassPath entry not found: ${resolved}`);
        }
      }
    }
    if (resolvedClassPath.length === 0) {
      return {
        success: false,
        error: "No valid classpath entries found. Please ensure Minecraft files are downloaded."
      };
    }
    if (!fs.existsSync(resolvedWorkingDir)) {
      console.log(`Creating working directory: ${resolvedWorkingDir}`);
      fs.mkdirSync(resolvedWorkingDir, { recursive: true });
    }
    const librariesDir = path.join(updatesDir, version, "libraries");
    const nativeLibDirs = fs.existsSync(librariesDir) ? findNativeLibDirs(librariesDir) : [];
    console.log(`Searching for native libraries in: ${librariesDir}`);
    console.log(`Found ${nativeLibDirs.length} native library directories:`);
    nativeLibDirs.forEach((dir) => console.log(`  - ${dir}`));
    const fullArgs = [
      ...jvmArgs
    ];
    if (nativeLibDirs.length > 0) {
      const nativePath = nativeLibDirs.join(path.delimiter);
      fullArgs.push(`-Djava.library.path=${nativePath}`);
      console.log(`Added native library path: ${nativePath}`);
    } else {
      console.warn(`⚠️  No native libraries found! This may cause UnsatisfiedLinkError.`);
      console.warn(`   Please re-download Minecraft files: npm run download-minecraft ${version}`);
    }
    fullArgs.push(
      "-cp",
      resolvedClassPath.join(path.delimiter),
      mainClass,
      ...gameArgs
    );
    console.log("Launching Minecraft with:", {
      javaPath,
      workingDir: resolvedWorkingDir,
      classPathCount: resolvedClassPath.length,
      mainClass,
      jvmArgsCount: jvmArgs.length,
      gameArgsCount: gameArgs.length
    });
    console.log("Full command:", `${javaPath} ${fullArgs.join(" ")}`);
    if (javaPath !== "java" && !fs.existsSync(javaPath)) {
      return {
        success: false,
        error: `Java executable not found: ${javaPath}. Please check the Java path in settings.`
      };
    }
    if (javaPath === "java") {
      try {
        child_process.execSync(`${javaPath} -version`, { timeout: 5e3, stdio: "pipe" });
      } catch (error) {
        return {
          success: false,
          error: `Java is not available or not in PATH. Error: ${error.message}. Please install Java 17 or higher, or specify the full path to Java in settings.`
        };
      }
    }
    let processError = null;
    let processExited = false;
    let exitCode = null;
    const gameProcess = child_process.spawn(javaPath, fullArgs, {
      cwd: resolvedWorkingDir,
      stdio: "pipe",
      shell: false
    });
    gameProcess.on("error", (error) => {
      processError = error;
      console.error("Process spawn error:", error);
      mainWindow == null ? void 0 : mainWindow.webContents.send("game:error", `Process error: ${error.message}`);
    });
    let stderrBuffer = "";
    (_a = gameProcess.stderr) == null ? void 0 : _a.on("data", (data) => {
      const message = data.toString();
      stderrBuffer += message;
      console.error("Game stderr:", message);
      mainWindow == null ? void 0 : mainWindow.webContents.send("game:error", message);
    });
    (_b = gameProcess.stdout) == null ? void 0 : _b.on("data", (data) => {
      const message = data.toString();
      console.log("Game stdout:", message);
      mainWindow == null ? void 0 : mainWindow.webContents.send("game:log", message);
    });
    gameProcess.on("exit", (code, signal) => {
      processExited = true;
      exitCode = code;
      console.log(`Game process exited with code ${code}, signal ${signal}`);
      mainWindow == null ? void 0 : mainWindow.webContents.send("game:exit", code || 0);
      if (code !== 0 && code !== null) {
        const errorMsg = stderrBuffer || `Game exited with code ${code}`;
        console.error("Game failed:", errorMsg);
        mainWindow == null ? void 0 : mainWindow.webContents.send("game:error", errorMsg);
      }
    });
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (processError) {
      return {
        success: false,
        error: `Failed to start Java process: ${processError.message}`
      };
    }
    if (processExited && exitCode !== 0) {
      return {
        success: false,
        error: `Game process exited immediately with code ${exitCode}. Check the error messages above.`
      };
    }
    if (!gameProcess.pid) {
      return {
        success: false,
        error: "Failed to start game process (no PID). Check Java installation and arguments."
      };
    }
    console.log(`Game process started successfully with PID: ${gameProcess.pid}`);
    return { success: true, pid: gameProcess.pid };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
electron.ipcMain.handle("file:ensureDir", async (event, dirPath) => {
  try {
    await fsPromises.mkdir(dirPath, { recursive: true });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
electron.ipcMain.handle("file:writeFile", async (event, filePath, data) => {
  try {
    const dir = path.dirname(filePath);
    await fsPromises.mkdir(dir, { recursive: true });
    await fsPromises.writeFile(filePath, Buffer.from(data));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
electron.ipcMain.handle("file:deleteFile", async (event, filePath) => {
  try {
    await fsPromises.unlink(filePath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
electron.ipcMain.handle("file:calculateHash", async (event, filePath, algorithm) => {
  try {
    const content = await fsPromises.readFile(filePath);
    const hash = crypto.createHash(algorithm).update(content).digest("hex");
    return hash;
  } catch (error) {
    throw new Error(`Failed to calculate hash: ${error.message}`);
  }
});
electron.ipcMain.handle("file:exists", async (event, filePath) => {
  try {
    await fsPromises.access(filePath);
    return true;
  } catch {
    return false;
  }
});
electron.ipcMain.on("file:download", async (event, url, destPath) => {
  const downloadId = `${url}-${destPath}`;
  try {
    const dir = path.dirname(destPath);
    await fsPromises.mkdir(dir, { recursive: true });
    const client = url.startsWith("https:") ? https : http;
    const request = client.get(url, (response) => {
      if (response.statusCode !== 200) {
        activeDownloads.delete(downloadId);
        event.reply("file:download:error", `HTTP ${response.statusCode}`);
        return;
      }
      const totalBytes = parseInt(response.headers["content-length"] || "0", 10);
      const writer = fs.createWriteStream(destPath);
      let downloadedBytes = 0;
      activeDownloads.set(downloadId, { request, writer, destPath });
      response.on("data", (chunk) => {
        downloadedBytes += chunk.length;
        const progress = totalBytes > 0 ? downloadedBytes / totalBytes * 100 : 0;
        event.reply("file:download:progress", progress);
      });
      response.on("end", () => {
        activeDownloads.delete(downloadId);
        writer.end();
        event.reply("file:download:complete");
      });
      response.on("error", (error) => {
        activeDownloads.delete(downloadId);
        writer.destroy();
        fs.unlink(destPath, () => {
        });
        event.reply("file:download:error", error.message);
      });
      response.pipe(writer);
      writer.on("error", (error) => {
        activeDownloads.delete(downloadId);
        response.destroy();
        event.reply("file:download:error", error.message);
      });
      writer.on("finish", () => {
        activeDownloads.delete(downloadId);
      });
    });
    request.on("error", (error) => {
      activeDownloads.delete(downloadId);
      event.reply("file:download:error", error.message);
    });
  } catch (error) {
    activeDownloads.delete(downloadId);
    event.reply("file:download:error", error.message);
  }
});
electron.ipcMain.handle("app:version", () => {
  return electron.app.getVersion();
});
electron.ipcMain.handle("app:paths", () => {
  return {
    userData: electron.app.getPath("userData"),
    appData: electron.app.getPath("appData"),
    temp: electron.app.getPath("temp")
  };
});

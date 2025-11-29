"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electronAPI", {
  // Window controls
  minimizeWindow: () => electron.ipcRenderer.send("window:minimize"),
  maximizeWindow: () => electron.ipcRenderer.send("window:maximize"),
  minimizeToTray: () => electron.ipcRenderer.send("window:minimizeToTray"),
  closeWindow: () => electron.ipcRenderer.send("window:close"),
  // Launcher
  launchGame: (args) => electron.ipcRenderer.invoke("launcher:launch", args),
  // App info
  getAppVersion: () => electron.ipcRenderer.invoke("app:version"),
  getAppPaths: () => electron.ipcRenderer.invoke("app:paths"),
  getUpdatesDir: () => electron.ipcRenderer.invoke("app:updatesDir"),
  // Java operations
  findJavaInstallations: () => electron.ipcRenderer.invoke("java:findInstallations"),
  checkJavaVersion: (javaPath, requiredVersion) => electron.ipcRenderer.invoke("java:checkVersion", javaPath, requiredVersion),
  getJavaVersion: (javaPath) => electron.ipcRenderer.invoke("java:getVersion", javaPath),
  // Dialog operations
  selectJavaFile: () => electron.ipcRenderer.invoke("dialog:selectJavaFile"),
  // Listeners
  onGameLog: (callback) => {
    electron.ipcRenderer.on("game:log", (_, log) => callback(log));
  },
  onGameError: (callback) => {
    electron.ipcRenderer.on("game:error", (_, error) => callback(error));
  },
  onGameExit: (callback) => {
    electron.ipcRenderer.on("game:exit", (_, code) => callback(code));
  },
  onGameCrash: (callback) => {
    electron.ipcRenderer.on("game:crash", (_, data) => callback(data));
  },
  onGameConnectionIssue: (callback) => {
    electron.ipcRenderer.on("game:connection-issue", (_, data) => callback(data));
  },
  // File operations
  ensureDir: (dirPath) => electron.ipcRenderer.invoke("file:ensureDir", dirPath),
  writeFile: (filePath, data) => electron.ipcRenderer.invoke("file:writeFile", filePath, data),
  deleteFile: (filePath) => electron.ipcRenderer.invoke("file:deleteFile", filePath),
  readFile: (filePath) => electron.ipcRenderer.invoke("file:readFile", filePath),
  calculateFileHash: (filePath, algorithm) => electron.ipcRenderer.invoke("file:calculateHash", filePath, algorithm),
  downloadFile: (url, destPath, onProgress, authToken) => {
    return new Promise((resolve, reject) => {
      const progressListener = (_, progress) => {
        if (onProgress) onProgress(progress);
      };
      const completeListener = () => {
        electron.ipcRenderer.removeListener("file:download:progress", progressListener);
        electron.ipcRenderer.removeListener("file:download:complete", completeListener);
        electron.ipcRenderer.removeListener("file:download:error", errorListener);
        resolve();
      };
      const errorListener = (_, error) => {
        electron.ipcRenderer.removeListener("file:download:progress", progressListener);
        electron.ipcRenderer.removeListener("file:download:complete", completeListener);
        electron.ipcRenderer.removeListener("file:download:error", errorListener);
        reject(new Error(error));
      };
      electron.ipcRenderer.once("file:download:progress", progressListener);
      electron.ipcRenderer.once("file:download:complete", completeListener);
      electron.ipcRenderer.once("file:download:error", errorListener);
      electron.ipcRenderer.send("file:download", url, destPath, authToken);
    });
  },
  fileExists: (filePath) => electron.ipcRenderer.invoke("file:exists", filePath),
  // Notifications
  showNotification: (title, body, options) => electron.ipcRenderer.invoke("notification:show", title, body, options),
  // HTTP requests (proxy through main process to bypass file:// restrictions)
  httpRequest: (options) => electron.ipcRenderer.invoke("http:request", options),
  // Launcher updates
  checkLauncherUpdate: (currentVersion, apiUrl, authToken) => electron.ipcRenderer.invoke("launcher:checkUpdate", currentVersion, apiUrl, authToken),
  downloadLauncherUpdate: (updateInfo, apiUrl) => {
    electron.ipcRenderer.send("launcher:downloadUpdate", updateInfo, apiUrl);
  },
  cancelLauncherUpdate: () => {
    electron.ipcRenderer.send("launcher:cancelUpdate");
  },
  installLauncherUpdate: (installerPath, newVersion) => electron.ipcRenderer.invoke("launcher:installUpdate", installerPath, newVersion),
  restartLauncher: () => {
    electron.ipcRenderer.send("launcher:restart");
  },
  onLauncherUpdateProgress: (callback) => {
    electron.ipcRenderer.on("launcher:update:progress", (_, progress) => callback(progress));
  },
  onLauncherUpdateComplete: (callback) => {
    electron.ipcRenderer.on("launcher:update:complete", (_, path) => callback(path));
  },
  onLauncherUpdateError: (callback) => {
    electron.ipcRenderer.on("launcher:update:error", (_, error) => callback(error));
  }
});

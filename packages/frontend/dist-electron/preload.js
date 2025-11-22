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
  // File operations
  ensureDir: (dirPath) => electron.ipcRenderer.invoke("file:ensureDir", dirPath),
  writeFile: (filePath, data) => electron.ipcRenderer.invoke("file:writeFile", filePath, data),
  deleteFile: (filePath) => electron.ipcRenderer.invoke("file:deleteFile", filePath),
  calculateFileHash: (filePath, algorithm) => electron.ipcRenderer.invoke("file:calculateHash", filePath, algorithm),
  downloadFile: (url, destPath, onProgress) => {
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
      electron.ipcRenderer.send("file:download", url, destPath);
    });
  },
  fileExists: (filePath) => electron.ipcRenderer.invoke("file:exists", filePath)
});

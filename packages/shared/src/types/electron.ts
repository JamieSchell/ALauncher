/**
 * Electron IPC Channel Types
 * Типизированные контракты для общения между Electron main и renderer процессами
 */

// ============= Window Controls =============
export type WindowControlChannel = 
  | 'window:minimize'
  | 'window:maximize'
  | 'window:minimizeToTray'
  | 'window:close';

// ============= Launcher =============
export interface LaunchGameArgs {
  javaPath: string;
  jvmArgs: string[];
  mainClass: string;
  classPath: string[];
  gameArgs: string[];
  workingDir: string;
  version: string;
  clientDirectory?: string;
  jvmVersion?: string;
  profileId?: string;
  serverAddress?: string;
  serverPort?: number;
  userId?: string;
  username?: string;
}

export interface LaunchGameResponse {
  success: boolean;
  pid?: number;
  error?: string;
}

export type LauncherChannel = 'launcher:launch';

// ============= App Info =============
export interface AppPaths {
  userData: string;
  appData: string;
  temp: string;
}

export type AppInfoChannel = 
  | 'app:version'
  | 'app:paths'
  | 'app:updatesDir';

// ============= Java Operations =============
export interface JavaInstallation {
  path: string;
  version: string;
  major: number;
  full: string;
}

export interface FindJavaInstallationsResponse {
  success: boolean;
  installations: JavaInstallation[];
  error?: string;
}

export interface CheckJavaVersionResponse {
  success: boolean;
  valid: boolean;
  currentVersion?: string;
  requiredVersion: string;
  error?: string;
}

export interface GetJavaVersionResponse {
  success: boolean;
  version?: string;
  major?: number;
  full?: string;
  error?: string;
}

export type JavaChannel = 
  | 'java:findInstallations'
  | 'java:checkVersion'
  | 'java:getVersion';

// ============= Dialog Operations =============
export interface SelectJavaFileResponse {
  success: boolean;
  path?: string;
  version?: string;
  major?: number;
  canceled?: boolean;
  error?: string;
}

export type DialogChannel = 'dialog:selectJavaFile';

// ============= Game Events =============
export interface GameCrashData {
  exitCode: number;
  errorMessage?: string;
  stderrOutput?: string;
  stdoutOutput?: string;
  profileId?: string;
  profileVersion?: string;
  serverAddress?: string;
  serverPort?: number;
  javaVersion?: string;
  javaPath?: string;
  os?: string;
  osVersion?: string;
  userId?: string;
  username?: string;
}

export interface GameConnectionIssueData {
  message: string;
  type: string;
}

export type GameEventChannel = 
  | 'game:log'
  | 'game:error'
  | 'game:exit'
  | 'game:crash'
  | 'game:connection-issue';

// ============= File Operations =============
export type FileHashAlgorithm = 'sha256' | 'sha1';

export type FileChannel = 
  | 'file:ensureDir'
  | 'file:writeFile'
  | 'file:deleteFile'
  | 'file:readFile'
  | 'file:calculateHash'
  | 'file:exists'
  | 'file:download'
  | 'file:download:progress'
  | 'file:download:complete'
  | 'file:download:error';

// ============= HTTP Request =============
export interface HttpRequestOptions {
  method: string;
  url: string;
  headers?: Record<string, string>;
  data?: any;
  timeout?: number;
}

export interface HttpResponse {
  status: number;
  statusText: string;
  headers: Record<string, string | string[]>;
  data: any;
}

export type HttpChannel = 'http:request';

// ============= Notifications =============
export interface NotificationOptions {
  icon?: string;
  sound?: boolean;
}

export type NotificationChannel = 'notification:show';

// ============= Launcher Updates =============
export interface UpdateInfo {
  version: string;
  downloadUrl: string;
  fileHash?: string;
  fileSize?: bigint;
  releaseNotes?: string;
  isRequired: boolean;
}

export interface CheckLauncherUpdateResponse {
  success: boolean;
  hasUpdate?: boolean;
  updateInfo?: UpdateInfo;
  isRequired?: boolean;
  error?: string;
}

export interface InstallLauncherUpdateResponse {
  success: boolean;
  error?: string;
  message?: string;
}

export type LauncherUpdateChannel = 
  | 'launcher:checkUpdate'
  | 'launcher:downloadUpdate'
  | 'launcher:cancelUpdate'
  | 'launcher:installUpdate'
  | 'launcher:restart'
  | 'launcher:update:progress'
  | 'launcher:update:complete'
  | 'launcher:update:error';

// ============= Electron API Interface =============
/**
 * Полный интерфейс electronAPI, доступный в renderer процессе
 */
export interface ElectronAPI {
  // Window controls
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  minimizeToTray: () => void;
  closeWindow: () => void;

  // Launcher
  launchGame: (args: LaunchGameArgs) => Promise<LaunchGameResponse>;

  // App info
  getAppVersion: () => Promise<string>;
  getAppPaths: () => Promise<AppPaths>;
  getUpdatesDir: () => Promise<string>;

  // Java operations
  findJavaInstallations: () => Promise<FindJavaInstallationsResponse>;
  checkJavaVersion: (javaPath: string, requiredVersion: string) => Promise<CheckJavaVersionResponse>;
  getJavaVersion: (javaPath: string) => Promise<GetJavaVersionResponse>;

  // Dialog operations
  selectJavaFile: () => Promise<SelectJavaFileResponse>;

  // Game event listeners
  onGameLog: (callback: (log: string) => void) => void;
  onGameError: (callback: (error: string) => void) => void;
  onGameExit: (callback: (code: number) => void) => void;
  onGameCrash: (callback: (data: GameCrashData) => void) => void;
  onGameConnectionIssue: (callback: (data: GameConnectionIssueData) => void) => void;

  // File operations
  ensureDir: (dirPath: string) => Promise<void>;
  writeFile: (filePath: string, data: Uint8Array) => Promise<void>;
  deleteFile: (filePath: string) => Promise<void>;
  readFile: (filePath: string) => Promise<string>;
  calculateFileHash: (filePath: string, algorithm: FileHashAlgorithm) => Promise<string>;
  downloadFile: (url: string, destPath: string, onProgress?: (progress: number) => void, authToken?: string) => Promise<void>;
  fileExists: (filePath: string) => Promise<boolean>;

  // Notifications
  showNotification: (title: string, body: string, options?: NotificationOptions) => Promise<void>;

  // HTTP requests
  httpRequest: (options: HttpRequestOptions) => Promise<HttpResponse>;

  // Launcher updates
  checkLauncherUpdate: (currentVersion: string, apiUrl: string, authToken?: string) => Promise<CheckLauncherUpdateResponse>;
  downloadLauncherUpdate: (updateInfo: UpdateInfo, apiUrl: string) => void;
  cancelLauncherUpdate: () => void;
  installLauncherUpdate: (installerPath: string, newVersion: string) => Promise<InstallLauncherUpdateResponse>;
  restartLauncher: () => void;
  onLauncherUpdateProgress: (callback: (progress: number) => void) => void;
  onLauncherUpdateComplete: (callback: (installerPath: string) => void) => void;
  onLauncherUpdateError: (callback: (error: string) => void) => void;
}


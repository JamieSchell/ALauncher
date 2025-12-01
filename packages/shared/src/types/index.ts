/**
 * Shared types for Modern Minecraft Launcher
 */

// ============= Player Profile =============
export interface PlayerTexture {
  url: string;
  digest: string;
}

export interface PlayerProfile {
  uuid: string;
  username: string;
  skin?: PlayerTexture;
  cloak?: PlayerTexture;
}

// ============= Client Profile =============
export type EconomyFilterOperator = '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE';

export interface EconomyLeaderboardFilter {
  column: string;
  operator?: EconomyFilterOperator;
  value: string | number;
}

export interface EconomyLeaderboardConfig {
  enabled?: boolean;
  table: string;
  usernameColumn: string;
  balanceColumn: string;
  order?: 'asc' | 'desc';
  limit?: number;
  currencySymbol?: string;
  precision?: number;
  filters?: EconomyLeaderboardFilter[];
}

export interface EconomyLeaderboardEntry {
  username: string;
  balance: number;
  rank: number;
}

export interface EconomyLeaderboardPayload {
  players: EconomyLeaderboardEntry[];
  currencySymbol?: string;
  precision: number;
  limit: number;
  lastUpdated: string;
}

export interface ClientProfile {
  id: string;
  version: string;
  assetIndex: string;
  
  // Client params
  sortIndex: number;
  title: string;
  description?: string;
  tags?: string[]; // Пометки: ["NEW", "TOP", "WIP", "HARD", etc.]
  serverAddress: string;
  serverPort: number;
  jvmVersion?: string;
  economyConfig?: EconomyLeaderboardConfig | null;
  
  // Updater
  updateFastCheck: boolean;
  update: string[];
  updateVerify: string[];
  updateExclusions: string[];
  
  // Launcher params
  mainClass: string;
  classPath: string[];
  jvmArgs: string[];
  clientArgs: string[];
}

// ============= Auth =============
export interface AuthRequest {
  login: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  playerProfile?: PlayerProfile;
  accessToken?: string;
  error?: string;
}

export interface JoinServerRequest {
  accessToken: string;
  serverId: string;
  playerProfile: PlayerProfile;
}

export interface CheckServerRequest {
  username: string;
  serverId: string;
}

// ============= Update =============
export interface HashedFile {
  type: 'file';
  path: string;
  size: number;
  hash: string;
}

export interface HashedDir {
  type: 'dir';
  path: string;
  entries: Record<string, HashedFile | HashedDir>;
}

export interface UpdateRequest {
  profileId: string;
  dirType: 'client' | 'asset' | 'jvm';
}

export interface UpdateResponse {
  hashedDir: HashedDir;
  signature: string;
}

export interface UpdateListResponse {
  profiles: ClientProfile[];
}

// ============= Server Status =============
export interface ServerStatus {
  online: boolean;
  players: {
    online: number;
    max: number;
  };
  version: string;
  motd: string;
  ping: number;
}

// ============= API v1 =============
export enum ErrorCodeV1 {
  UNKNOWN = 'UNKNOWN',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMITED = 'RATE_LIMITED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export interface ApiErrorV1 {
  code: ErrorCodeV1;
  message: string;
  details?: unknown;
}

export interface ApiResponseV1<T = any> {
  success: boolean;
  data?: T;
  error?: ApiErrorV1;
  message?: string;
}

// Backwards-compatible generic API response
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  /**
   * Optional machine-readable error code (v1 format) for clients
   * Prefer использовать его вместо парсинга текстового сообщения.
   */
  errorCode?: ErrorCodeV1;
}

// ============= WebSocket Events =============
export enum WSEvent {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  AUTH = 'auth',
  UPDATE_PROGRESS = 'update_progress',
  LAUNCH_STATUS = 'launch_status',
  SERVER_STATUS = 'server_status',
  DOWNLOAD_CLIENT = 'download_client',
  LAUNCHER_UPDATE_AVAILABLE = 'launcher_update_available',
  CLIENT_FILES_UPDATED = 'client_files_updated',
}

export interface UpdateProgress {
  profileId: string;
  stage: 'downloading' | 'verifying' | 'extracting' | 'complete';
  progress: number;
  currentFile?: string;
  totalFiles: number;
  downloadedFiles: number;
}

export interface LaunchStatus {
  status: 'preparing' | 'launching' | 'running' | 'crashed' | 'closed';
  message?: string;
  error?: string;
}

export interface ClientFilesUpdate {
  version: string;
  versionId: string;
  action: 'sync' | 'file_added' | 'file_updated' | 'file_deleted' | 'integrity_check';
  files?: Array<{
    filePath: string;
    fileHash: string;
    fileSize: string | number;
    fileType: string;
    verified?: boolean;
    integrityCheckFailed?: boolean;
  }>;
  stats?: {
    totalFiles: number;
    verifiedFiles: number;
    failedFiles: number;
  };
}

// ============= Notifications =============
export type NotificationTypeDTO =
  | 'CLIENT_UPDATE_AVAILABLE'
  | 'SERVER_STATUS_CHANGE'
  | 'LAUNCHER_UPDATE_AVAILABLE'
  | 'GAME_CRASH'
  | 'CONNECTION_ISSUE'
  | 'LAUNCHER_ERROR'
  | 'SYSTEM_MESSAGE'
  | 'ADMIN_ALERT';

export interface NotificationDTO {
  id: string;
  userId: string;
  type: NotificationTypeDTO;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  readAt?: string;
  createdAt: string;
}

export interface GetNotificationsParamsDTO {
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
  type?: NotificationTypeDTO;
}

export interface CreateNotificationRequestDTO {
  type: NotificationTypeDTO;
  title: string;
  message: string;
  userId?: string;
  data?: any;
}

// ============= Electron IPC =============
export * from './electron';

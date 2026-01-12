/**
 * Shared types for Modern Minecraft Launcher
 */

// ============= Player Profile =============
/**
 * Текстура игрока (скин или плащ)
 */
export interface PlayerTexture {
  /** URL текстуры */
  url: string;
  /** Хэш текстуры для проверки целостности */
  digest: string;
}

/**
 * Профиль игрока Minecraft
 */
export interface PlayerProfile {
  /** UUID игрока */
  uuid: string;
  /** Имя пользователя (никнейм) */
  username: string;
  /** Текстура кожи */
  skin?: PlayerTexture;
  /** Текстура плаща */
  cloak?: PlayerTexture;
}

// ============= Client Profile =============
/**
 * Операторы фильтрации для экономики
 */
export type EconomyFilterOperator = '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE';

/**
 * Фильтр для таблицы лидеров экономики
 */
export interface EconomyLeaderboardFilter {
  /** Имя колонки для фильтрации */
  column: string;
  /** Оператор сравнения */
  operator?: EconomyFilterOperator;
  /** Значение для сравнения */
  value: string | number;
}

/**
 * Конфигурация таблицы лидеров экономики
 */
export interface EconomyLeaderboardConfig {
  /** Включена ли таблица лидеров */
  enabled?: boolean;
  /** Имя таблицы в базе данных */
  table: string;
  /** Имя колонки с именем пользователя */
  usernameColumn: string;
  /** Имя колонки с балансом */
  balanceColumn: string;
  /** Порядок сортировки */
  order?: 'asc' | 'desc';
  /** Максимум записей */
  limit?: number;
  /** Символ валюты */
  currencySymbol?: string;
  /** Количество знаков после запятой */
  precision?: number;
  /** Дополнительные фильтры */
  filters?: EconomyLeaderboardFilter[];
}

/**
 * Запись в таблице лидеров
 */
export interface EconomyLeaderboardEntry {
  /** Имя пользователя */
  username: string;
  /** Баланс */
  balance: number;
  /** Ранг в таблице */
  rank: number;
}

/**
 * Payload с данными таблицы лидеров
 */
export interface EconomyLeaderboardPayload {
  /** Список игроков */
  players: EconomyLeaderboardEntry[];
  /** Символ валюты */
  currencySymbol?: string;
  /** Количество знаков после запятой */
  precision: number;
  /** Максимум записей */
  limit: number;
  /** Время последнего обновления (ISO 8601) */
  lastUpdated: string;
}

/**
 * Профиль клиента Minecraft
 */
export interface ClientProfile {
  /** Уникальный идентификатор профиля */
  id: string;
  /** Версия клиента */
  version: string;
  /** Индекс ассетов */
  assetIndex: string;

  // Client params
  /** Индекс сортировки */
  sortIndex: number;
  /** Отображаемое название */
  title: string;
  /** Описание клиента */
  description?: string;
  /** Пометки: ["NEW", "TOP", "WIP", "HARD", etc.] */
  tags?: string[];
  /** Адрес сервера */
  serverAddress: string;
  /** Порт сервера */
  serverPort: number;
  /** Версия JVM (опционально) */
  jvmVersion?: string;
  /** Конфигурация таблицы лидеров экономики */
  economyConfig?: EconomyLeaderboardConfig | null;

  // Updater
  /** Быстрая проверка обновлений */
  updateFastCheck: boolean;
  /** Список файлов для обновления */
  update: string[];
  /** Список файлов для верификации */
  updateVerify: string[];
  /** Список исключений из обновления */
  updateExclusions: string[];

  // Launcher params
  /** Главный класс для запуска */
  mainClass: string;
  /** Classpath */
  classPath: string[];
  /** Аргументы JVM */
  jvmArgs: string[];
  /** Аргументы клиента */
  clientArgs: string[];
}

// ============= Auth =============
/**
 * Запрос на аутентификацию
 */
export interface AuthRequest {
  /** Логин или email */
  login: string;
  /** Пароль */
  password: string;
}

/**
 * Успешный ответ аутентификации
 */
export interface AuthSuccess {
  success: true;
  playerProfile: PlayerProfile;
  accessToken: string;
}

/**
 * Неуспешный ответ аутентификации
 */
export interface AuthFailure {
  success: false;
  error: string;
}

/**
 * Discriminated union для ответа аутентификации
 * Позволяет TypeScript правильно определять типы на основе поля success
 */
export type AuthResponse = AuthSuccess | AuthFailure;

/**
 * Type guard для успешного ответа аутентификации
 */
export function isAuthSuccess(response: AuthResponse): response is AuthSuccess {
  return response.success === true;
}

/**
 * Type guard для неуспешного ответа аутентификации
 */
export function isAuthFailure(response: AuthResponse): response is AuthFailure {
  return response.success === false;
}

/**
 * Запрос на присоединение к серверу
 */
export interface JoinServerRequest {
  /** Токен доступа */
  accessToken: string;
  /** ID сервера */
  serverId: string;
  /** Профиль игрока */
  playerProfile: PlayerProfile;
}

/**
 * Запрос на проверку сервера
 */
export interface CheckServerRequest {
  /** Имя пользователя */
  username: string;
  /** ID сервера */
  serverId: string;
}

// ============= Update =============
/**
 * Хешированный файл
 */
export interface HashedFile {
  /** Тип записи */
  type: 'file';
  /** Путь к файлу */
  path: string;
  /** Размер в байтах */
  size: number;
  /** Хэш файла (SHA-256) */
  hash: string;
}

/**
 * Хешированная директория
 */
export interface HashedDir {
  /** Тип записи */
  type: 'dir';
  /** Путь к директории */
  path: string;
  /** Записи внутри директории */
  entries: Record<string, HashedFile | HashedDir>;
}

/**
 * Discriminated union для хешированных записей
 */
export type HashedEntry = HashedFile | HashedDir;

/**
 * Type guard для HashedFile
 */
export function isHashedFile(entry: HashedEntry): entry is HashedFile {
  return entry.type === 'file';
}

/**
 * Type guard для HashedDir
 */
export function isHashedDir(entry: HashedEntry): entry is HashedDir {
  return entry.type === 'dir';
}

/**
 * Запрос на обновление
 */
export interface UpdateRequest {
  /** ID профиля клиента */
  profileId: string;
  /** Тип директории */
  dirType: 'client' | 'asset' | 'jvm';
}

/**
 * Ответ на запрос обновления
 */
export interface UpdateResponse {
  /** Хешированная директория */
  hashedDir: HashedDir;
  /** Подпись для проверки целостности */
  signature: string;
}

/**
 * Ответ со списком доступных профилей
 */
export interface UpdateListResponse {
  /** Список профилей клиентов */
  profiles: ClientProfile[];
}

// ============= Server Status =============
/**
 * Статус сервера Minecraft
 */
export interface ServerStatus {
  /** Онлайн ли сервер */
  online: boolean;
  /** Информация о игроках */
  players: {
    /** Текущее количество игроков */
    online: number;
    /** Максимум игроков */
    max: number;
  };
  /** Версия сервера */
  version: string;
  /** MOTD (Message of the Day) */
  motd: string;
  /** Пинг в мс */
  ping: number;
}

// ============= API v1 =============
/**
 * Коды ошибок API v1
 */
export enum ErrorCodeV1 {
  /** Неизвестная ошибка */
  UNKNOWN = 'UNKNOWN',
  /** Ошибка валидации */
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  /** Требуется аутентификация */
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  /** Доступ запрещен */
  FORBIDDEN = 'FORBIDDEN',
  /** Ресурс не найден */
  NOT_FOUND = 'NOT_FOUND',
  /** Превышен лимит запросов */
  RATE_LIMITED = 'RATE_LIMITED',
  /** Внутренняя ошибка сервера */
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

/**
 * Ошибка API v1
 */
export interface ApiErrorV1 {
  /** Код ошибки */
  code: ErrorCodeV1;
  /** Сообщение об ошибке */
  message: string;
  /** Дополнительные детали */
  details?: unknown;
}

/**
 * Успешный API ответ (v1 формат)
 */
export interface ApiSuccessV1<T = any> {
  success: true;
  data: T;
  error?: undefined;
  message?: string;
}

/**
 * Неуспешный API ответ (v1 формат)
 */
export interface ApiFailureV1 {
  success: false;
  data?: undefined;
  error: ApiErrorV1;
  message?: string;
}

/**
 * Discriminated union для API ответов v1
 */
export type ApiResponseV1<T = any> = ApiSuccessV1<T> | ApiFailureV1;

/**
 * Type guard для успешного API ответа v1
 */
export function isApiSuccessV1<T>(response: ApiResponseV1<T>): response is ApiSuccessV1<T> {
  return response.success === true;
}

/**
 * Type guard для неуспешного API ответа v1
 */
export function isApiFailureV1(response: ApiResponseV1): response is ApiFailureV1 {
  return response.success === false;
}

// Backwards-compatible generic API response
/**
 * Успешный API ответ (backwards-compatible формат)
 */
export interface ApiSuccess<T = any> {
  success: true;
  data: T;
  error?: undefined;
  message?: string;
  errorCode?: undefined;
}

/**
 * Неуспешный API ответ (backwards-compatible формат)
 */
export interface ApiFailure {
  success: false;
  data?: undefined;
  error: string;
  message?: string;
  errorCode?: ErrorCodeV1;
}

/**
 * Discriminated union для API ответов (backwards-compatible)
 */
export type ApiResponse<T = any> = ApiSuccess<T> | ApiFailure;

/**
 * Type guard для успешного API ответа
 */
export function isApiSuccess<T>(response: ApiResponse<T>): response is ApiSuccess<T> {
  return response.success === true;
}

/**
 * Type guard для неуспешного API ответа
 */
export function isApiFailure(response: ApiResponse): response is ApiFailure {
  return response.success === false;
}

// ============= WebSocket Events =============
/**
 * События WebSocket
 */
export enum WSEvent {
  /** Подключение */
  CONNECT = 'connect',
  /** Отключение */
  DISCONNECT = 'disconnect',
  /** Аутентификация */
  AUTH = 'auth',
  /** Прогресс обновления */
  UPDATE_PROGRESS = 'update_progress',
  /** Статус запуска */
  LAUNCH_STATUS = 'launch_status',
  /** Статус сервера */
  SERVER_STATUS = 'server_status',
  /** Загрузка клиента */
  DOWNLOAD_CLIENT = 'download_client',
  /** Доступно обновление лаунчера */
  LAUNCHER_UPDATE_AVAILABLE = 'launcher_update_available',
  /** Файлы клиента обновлены */
  CLIENT_FILES_UPDATED = 'client_files_updated',
}

/**
 * Прогресс обновления
 */
export interface UpdateProgress {
  /** ID профиля */
  profileId: string;
  /** Этап обновления */
  stage: 'downloading' | 'verifying' | 'extracting' | 'complete';
  /** Прогресс (0-100) */
  progress: number;
  /** Текущий файл */
  currentFile?: string;
  /** Всего файлов */
  totalFiles: number;
  /** Скачано файлов */
  downloadedFiles: number;
}

/**
 * Статус запуска игры
 */
export interface LaunchStatus {
  /** Статус запуска */
  status: 'preparing' | 'launching' | 'running' | 'crashed' | 'closed';
  /** Сообщение */
  message?: string;
  /** Ошибка */
  error?: string;
}

/**
 * Обновление файлов клиента
 */
export interface ClientFilesUpdate {
  /** Версия */
  version: string;
  /** ID версии */
  versionId: string;
  /** Действие */
  action: 'sync' | 'file_added' | 'file_updated' | 'file_deleted' | 'integrity_check';
  /** Список файлов */
  files?: Array<{
    /** Путь к файлу */
    filePath: string;
    /** Хэш файла */
    fileHash: string;
    /** Размер файла */
    fileSize: string | number;
    /** Тип файла */
    fileType: string;
    /** Верифицирован ли файл */
    verified?: boolean;
    /** Не прошла ли проверка целостности */
    integrityCheckFailed?: boolean;
  }>;
  /** Статистика */
  stats?: {
    /** Всего файлов */
    totalFiles: number;
    /** Верифицировано файлов */
    verifiedFiles: number;
    /** Файлов с ошибками */
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

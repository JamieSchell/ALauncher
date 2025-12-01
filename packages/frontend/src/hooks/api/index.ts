/**
 * API Hooks Module
 *
 * Централизованный экспорт всех custom hooks для работы с API через React Query.
 * Все hooks используют единую конфигурацию QueryClient и типизированные query keys.
 *
 * @module hooks/api
 */

// Profiles hooks
export * from './useProfiles';
export { profileKeys } from './useProfiles';

// Users hooks
export * from './useUsers';
export { userKeys } from './useUsers';

// Statistics hooks
export * from './useStatistics';
export { statisticsKeys } from './useStatistics';

// Notifications hooks
export * from './useNotifications';
export { notificationKeys } from './useNotifications';

// Servers hooks
export * from './useServers';
export { serverKeys } from './useServers';

// Crashes hooks
export * from './useCrashes';
export { crashKeys } from './useCrashes';


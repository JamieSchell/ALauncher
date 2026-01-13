/**
 * Repositories Module
 *
 * Exports all repository classes and singleton instances.
 * Use singleton instances for easy access throughout the application.
 *
 * @example
 * ```ts
 * import { userRepository, profileRepository } from './repositories';
 *
 * // Find user by email
 * const user = await userRepository.findByEmail('user@example.com');
 *
 * // Get all enabled profiles
 * const profiles = await profileRepository.findEnabled();
 * ```
 */

// Base repository
export { BaseRepository } from './BaseRepository';
export type {
  FindManyParams,
  PaginationParams,
  PaginatedResult,
} from './BaseRepository';

// User repository
export { UserRepository, userRepository } from './UserRepository';
export type {
  CreateUserParams,
  UpdateUserParams,
} from './UserRepository';

// Profile repository
export { ProfileRepository, profileRepository } from './ProfileRepository';
export type {
  CreateProfileParams,
  UpdateProfileParams,
} from './ProfileRepository';

// Note: Profile uses 'title' instead of 'name'
// profileRepository.findByTitle() - find by title
// profileRepository.findEnabled() - get all enabled profiles

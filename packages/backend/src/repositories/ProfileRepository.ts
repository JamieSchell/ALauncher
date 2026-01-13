/**
 * Profile Repository
 *
 * Repository for ClientProfile entity providing all profile-related database operations.
 * Extends BaseRepository with profile-specific methods.
 *
 * @example
 * ```ts
 * import { profileRepository } from './repositories/ProfileRepository';
 *
 * // Get all enabled profiles
 * const profiles = await profileRepository.findEnabled();
 *
 * // Get profile by name
 * const profile = await profileRepository.findByName('Vanilla 1.20.1');
 *
 * // Toggle profile enabled state
 * const updated = await profileRepository.toggleEnabled('123');
 * ```
 */

import { BaseRepository, FindManyParams } from './BaseRepository';
import { ClientProfile } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

export type CreateProfileParams = {
  title: string;
  version: string;
  mainClass: string;
  classPath: string[];
  jvmArgs?: string[];
  clientArgs?: string[];
  enabled?: boolean;
  sortIndex?: number;
  assetIndex: string;
  serverAddress: string;
  serverPort?: number;
  update: string[];
  updateVerify: object;
  updateExclusions: object[];
  updateFastCheck?: boolean;
  clientDirectory?: string;
  description?: string;
  tags?: string[];
  economyConfig?: object;
  jvmVersion?: string;
};

export type UpdateProfileParams = {
  title?: string;
  version?: string;
  mainClass?: string;
  classPath?: string[];
  jvmArgs?: string[];
  clientArgs?: string[];
  enabled?: boolean;
  sortIndex?: number;
  assetIndex?: string;
  serverAddress?: string;
  serverPort?: number;
  update?: string[];
  updateVerify?: object;
  updateExclusions?: object[];
  updateFastCheck?: boolean;
  clientDirectory?: string;
  description?: string;
  tags?: string[];
  economyConfig?: object;
  jvmVersion?: string;
};

/**
 * Repository for ClientProfile entity
 */
export class ProfileRepository extends BaseRepository<ClientProfile> {
  constructor() {
    super('clientProfile');
  }

  /**
   * Find a profile by title
   *
   * @param title - Profile title
   * @returns Profile or null if not found
   *
   * @example
   * ```ts
   * const profile = await profileRepository.findByTitle('Vanilla 1.20.1');
   * ```
   */
  async findByTitle(title: string): Promise<ClientProfile | null> {
    return this.model.findFirst({
      where: { title },
    });
  }

  /**
   * Get all enabled profiles, sorted by sortIndex
   *
   * @returns Array of enabled profiles
   *
   * @example
   * ```ts
   * const profiles = await profileRepository.findEnabled();
   * // Sorted by sortIndex ascending
   * ```
   */
  async findEnabled(): Promise<ClientProfile[]> {
    return this.model.findMany({
      where: { enabled: true },
      orderBy: { sortIndex: 'asc' },
    });
  }

  /**
   * Create a new profile
   *
   * @param params - Profile creation parameters
   * @returns Created profile
   * @throws {AppError} If profile with title already exists
   *
   * @example
   * ```ts
   * const profile = await profileRepository.create({
   *   title: 'Vanilla 1.20.1',
   *   version: '1.20.1',
   *   mainClass: 'net.minecraft.client.main.Main',
   *   enabled: true,
   *   sortIndex: 1,
   *   assetIndex: '1.20.1',
   *   serverAddress: 'mc.hypixel.net',
   *   update: ['.*'],
   *   updateVerify: {},
   *   updateExclusions: [],
   *   classPath: [],
   * });
   * ```
   */
  async create(params: CreateProfileParams): Promise<ClientProfile> {
    // Check if profile with title already exists
    const existing = await this.findByTitle(params.title);
    if (existing) {
      throw new AppError(400, 'Profile with this title already exists');
    }

    return this.model.create({
      data: {
        ...params,
        enabled: params.enabled !== undefined ? params.enabled : true,
        sortIndex: params.sortIndex ?? await this.getNextSortIndex(),
      },
    });
  }

  /**
   * Update a profile
   *
   * @param id - Profile ID
   * @param params - Update parameters
   * @returns Updated profile
   * @throws {AppError} If profile not found or title conflict
   *
   * @example
   * ```ts
   * const profile = await profileRepository.update('123', {
   *   title: 'Updated Title',
   *   enabled: false,
   * });
   * ```
   */
  async update(id: string, params: UpdateProfileParams): Promise<ClientProfile> {
    // Check if profile exists
    const current = await this.findById(id);
    if (!current) {
      throw new AppError(404, 'Profile not found');
    }

    // Check title uniqueness if updating title
    if (params.title && params.title !== current!.title) {
      const existingTitle = await this.findByTitle(params.title);
      if (existingTitle) {
        throw new AppError(400, 'Profile with this title already exists');
      }
    }

    return this.model.update({
      where: { id },
      data: params,
    });
  }

  /**
   * Toggle profile enabled state
   *
   * @param id - Profile ID
   * @returns Updated profile
   * @throws {AppError} If profile not found
   *
   * @example
   * ```ts
   * const profile = await profileRepository.toggleEnabled('123');
   * // If was enabled -> now disabled
   * // If was disabled -> now enabled
   * ```
   */
  async toggleEnabled(id: string): Promise<ClientProfile> {
    const profile = await this.findById(id);
    if (!profile) {
      throw new AppError(404, 'Profile not found');
    }

    return this.model.update({
      where: { id },
      data: { enabled: !profile.enabled },
    });
  }

  /**
   * Enable a profile
   *
   * @param id - Profile ID
   * @returns Updated profile
   *
   * @example
   * ```ts
   * const profile = await profileRepository.enable('123');
   * ```
   */
  async enable(id: string): Promise<ClientProfile> {
    return this.model.update({
      where: { id },
      data: { enabled: true },
    });
  }

  /**
   * Disable a profile
   *
   * @param id - Profile ID
   * @returns Updated profile
   *
   * @example
   * ```ts
   * const profile = await profileRepository.disable('123');
   * ```
   */
  async disable(id: string): Promise<ClientProfile> {
    return this.model.update({
      where: { id },
      data: { enabled: false },
    });
  }

  /**
   * Get the next sort index for new profiles
   *
   * @returns Next available sort index
   *
   * @example
   * ```ts
   * const nextIndex = await profileRepository.getNextSortIndex();
   * // Returns current max sortIndex + 1, or 0 if no profiles exist
   * ```
   */
  async getNextSortIndex(): Promise<number> {
    const profile = await this.model.findFirst({
      where: { enabled: true },
      orderBy: { sortIndex: 'desc' },
    });

    return (profile?.sortIndex ?? -1) + 1;
  }

  /**
   * Reorder profiles by updating their sort indices
   *
   * @param profileIds - Array of profile IDs in desired order
   * @returns Updated profiles
   *
   * @example
   * ```ts
   * const profiles = await profileRepository.reorder(['id3', 'id1', 'id2']);
   * // Profile with id3 gets sortIndex 0, id1 gets 1, id2 gets 2
   * ```
   */
  async reorder(profileIds: string[]): Promise<ClientProfile[]> {
    const updatePromises = profileIds.map((id, index) =>
      this.model.update({
        where: { id },
        data: { sortIndex: index },
      })
    );

    return Promise.all(updatePromises);
  }

  /**
   * Get profile statistics
   *
   * @returns Object with profile counts
   *
   * @example
   * ```ts
   * const stats = await profileRepository.getStats();
   * // { total, enabled, disabled }
   * ```
   */
  async getStats(): Promise<{
    total: number;
    enabled: number;
    disabled: number;
  }> {
    const [total, enabled] = await Promise.all([
      this.count(),
      this.count({ enabled: true } as Partial<ClientProfile>),
    ]);

    return {
      total,
      enabled,
      disabled: total - enabled,
    };
  }

  /**
   * Search profiles by title
   *
   * @param query - Search query
   * @param params - Optional query parameters
   * @returns Array of matching profiles
   *
   * @example
   * ```ts
   * const profiles = await profileRepository.search('vanilla');
   * // Returns profiles with title containing 'vanilla'
   * ```
   */
  async search(query: string, params?: FindManyParams<ClientProfile>): Promise<ClientProfile[]> {
    return this.model.findMany({
      where: {
        title: {
          contains: query,
          mode: 'insensitive' as const,
        },
      },
      ...(params?.orderBy && { orderBy: params.orderBy }),
      ...(params?.take !== undefined && { take: params.take }),
      ...(params?.skip !== undefined && { skip: params.skip }),
    });
  }
}

// Export singleton instance
export const profileRepository = new ProfileRepository();

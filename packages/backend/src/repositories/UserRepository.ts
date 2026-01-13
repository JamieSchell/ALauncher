/**
 * User Repository
 *
 * Repository for User entity providing all user-related database operations.
 * Extends BaseRepository with user-specific methods.
 *
 * @example
 * ```ts
 * import { UserRepository } from './repositories/UserRepository';
 *
 * const userRepo = new UserRepository();
 *
 * // Find by email
 * const user = await userRepo.findByEmail('user@example.com');
 *
 * // Find by username
 * const user = await userRepo.findByUsername('username');
 *
 * // Get user with sessions
 * const userWithSessions = await userRepo.findById('123', { sessions: true });
 * ```
 */

import { BaseRepository, FindManyParams } from './BaseRepository';
import { User, UserRole, Prisma } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

export type CreateUserParams = {
  username: string;
  email: string;
  passwordHash: string;
  role?: UserRole;
  banned?: boolean;
  banReason?: string;
};

export type UpdateUserParams = {
  username?: string;
  email?: string;
  passwordHash?: string;
  role?: UserRole;
  banned?: boolean;
  banReason?: string;
};

/**
 * Repository for User entity
 */
export class UserRepository extends BaseRepository<User> {
  constructor() {
    super('user');
  }

  /**
   * Find a user by email
   *
   * @param email - User email
   * @returns User or null if not found
   *
   * @example
   * ```ts
   * const user = await userRepo.findByEmail('user@example.com');
   * if (user) {
   *   console.log(user.id, user.username);
   * }
   * ```
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.model.findUnique({
      where: { email },
    });
  }

  /**
   * Find a user by username
   *
   * @param username - Username
   * @returns User or null if not found
   *
   * @example
   * ```ts
   * const user = await userRepo.findByUsername('player123');
   * ```
   */
  async findByUsername(username: string): Promise<User | null> {
    return this.model.findFirst({
      where: { username },
    });
  }

  /**
   * Find a user by email OR username
   *
   * Useful for login where user can provide either email or username.
   *
   * @param identifier - Email or username
   * @returns User or null if not found
   *
   * @example
   * ```ts
   * const user = await userRepo.findByEmailOrUsername('player123');
   * // Works with both email and username
   * ```
   */
  async findByEmailOrUsername(identifier: string): Promise<User | null> {
    return this.model.findFirst({
      where: {
        OR: [
          { email: identifier },
          { username: identifier },
        ],
      },
    });
  }

  /**
   * Create a new user
   *
   * @param params - User creation parameters
   * @returns Created user
   * @throws {AppError} If user with email or username already exists
   *
   * @example
   * ```ts
   * const user = await userRepo.create({
   *   username: 'player123',
   *   email: 'player@example.com',
   *   passwordHash: 'hashedPassword',
   *   role: 'USER',
   * });
   * ```
   */
  async create(params: CreateUserParams): Promise<User> {
    // Check if email already exists
    const existingEmail = await this.findByEmail(params.email);
    if (existingEmail) {
      throw new AppError(400, 'User with this email already exists');
    }

    // Check if username already exists
    const existingUsername = await this.findByUsername(params.username);
    if (existingUsername) {
      throw new AppError(400, 'User with this username already exists');
    }

    return this.model.create({
      data: {
        ...params,
        role: params.role || 'USER',
      },
    });
  }

  /**
   * Update a user
   *
   * @param id - User ID
   * @param params - Update parameters
   * @returns Updated user
   * @throws {AppError} If user not found
   *
   * @example
   * ```ts
   * const user = await userRepo.update('123', {
   *   username: 'newUsername',
   *   role: 'ADMIN',
   * });
   * ```
   */
  async update(id: string, params: UpdateUserParams): Promise<User> {
    // Check if user exists
    const existing = await this.findById(id);
    if (!existing) {
      throw new AppError(404, 'User not found');
    }

    // Check email uniqueness if updating email
    if (params.email && params.email !== existing.email) {
      const existingEmail = await this.findByEmail(params.email);
      if (existingEmail) {
        throw new AppError(400, 'User with this email already exists');
      }
    }

    // Check username uniqueness if updating username
    if (params.username && params.username !== existing.username) {
      const existingUsername = await this.findByUsername(params.username);
      if (existingUsername) {
        throw new AppError(400, 'User with this username already exists');
      }
    }

    return this.model.update({
      where: { id },
      data: params,
    });
  }

  /**
   * Ban a user
   *
   * @param id - User ID
   * @param reason - Ban reason
   * @returns Updated user
   *
   * @example
   * ```ts
   * const user = await userRepo.ban('123', 'Violating terms of service');
   * ```
   */
  async ban(id: string, reason: string): Promise<User> {
    return this.model.update({
      where: { id },
      data: {
        banned: true,
        banReason: reason,
      },
    });
  }

  /**
   * Unban a user
   *
   * @param id - User ID
   * @returns Updated user
   *
   * @example
   * ```ts
   * const user = await userRepo.unban('123');
   * ```
   */
  async unban(id: string): Promise<User> {
    return this.model.update({
      where: { id },
      data: {
        banned: false,
        banReason: null,
      },
    });
  }

  /**
   * Get all banned users
   *
   * @param params - Optional query parameters
   * @returns Array of banned users
   *
   * @example
   * ```ts
   * const banned = await userRepo.findBanned();
   * ```
   */
  async findBanned(params?: FindManyParams<User>): Promise<User[]> {
    return this.model.findMany({
      where: { banned: true },
      ...(params?.orderBy && { orderBy: params.orderBy }),
      ...(params?.take !== undefined && { take: params.take }),
      ...(params?.skip !== undefined && { skip: params.skip }),
    });
  }

  /**
   * Get users by role
   *
   * @param role - User role
   * @param params - Optional query parameters
   * @returns Array of users with the specified role
   *
   * @example
   * ```ts
   * const admins = await userRepo.findByRole('ADMIN');
   * ```
   */
  async findByRole(role: UserRole, params?: FindManyParams<User>): Promise<User[]> {
    return this.model.findMany({
      where: { role },
      ...(params?.orderBy && { orderBy: params.orderBy }),
      ...(params?.take !== undefined && { take: params.take }),
      ...(params?.skip !== undefined && { skip: params.skip }),
    });
  }

  /**
   * Search users by username or email
   *
   * @param query - Search query
   * @param params - Optional query parameters
   * @returns Array of matching users
   *
   * @example
   * ```ts
   * const users = await userRepo.search('player');
   * // Returns users with username/email containing 'player'
   * ```
   */
  async search(query: string, params?: FindManyParams<User>): Promise<User[]> {
    return this.model.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: 'insensitive' as const } },
          { email: { contains: query, mode: 'insensitive' as const } },
        ],
      },
      ...(params?.orderBy && { orderBy: params.orderBy }),
      ...(params?.take !== undefined && { take: params.take }),
      ...(params?.skip !== undefined && { skip: params.skip }),
    });
  }

  /**
   * Get user statistics
   *
   * @returns Object with user counts
   *
   * @example
   * ```ts
   * const stats = await userRepo.getStats();
   * // { total, banned, admins, users }
   * ```
   */
  async getStats(): Promise<{
    total: number;
    banned: number;
    admins: number;
    users: number;
  }> {
    const [total, banned, admins] = await Promise.all([
      this.count(),
      this.count({ banned: true } as Partial<User>),
      this.count({ role: 'ADMIN' } as Partial<User>),
    ]);

    return {
      total,
      banned,
      admins,
      users: total - admins,
    };
  }
}

// Export singleton instance
export const userRepository = new UserRepository();

/**
 * Base Repository
 *
 * Abstract base class for all repositories providing common CRUD operations
 * and database interaction utilities.
 *
 * @example
 * ```ts
 * import { BaseRepository } from './repositories/BaseRepository';
 * import { User } from '@prisma/client';
 *
 * class UserRepository extends BaseRepository<User> {
 *   constructor() {
 *     super('user'); // Prisma model name
 *   }
 *
 *   async findByEmail(email: string) {
 *     return this.prisma.user.findUnique({ where: { email } });
 *   }
 * }
 * ```
 */

import { PrismaClient } from '@prisma/client';
import { prisma } from '../services/database';

export type FindManyParams<T> = {
  where?: Partial<T>;
  orderBy?: Record<string, 'asc' | 'desc'>;
  take?: number;
  skip?: number;
  include?: Record<string, boolean>;
};

export type PaginationParams = {
  page?: number;
  limit?: number;
};

export type PaginatedResult<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

/**
 * Abstract base repository class
 *
 * Provides common CRUD operations and pagination for all entities.
 * Subclasses should extend this and add entity-specific methods.
 *
 * @template T - The Prisma model type (e.g., User, Profile, etc.)
 */
export abstract class BaseRepository<T> {
  protected readonly prisma: PrismaClient = prisma;
  protected readonly modelName: string;

  /**
   * @param modelName - The Prisma model name (e.g., 'user', 'profile')
   */
  constructor(modelName: string) {
    this.modelName = modelName;
  }

  /**
   * Get the Prisma model for this repository
   */
  protected get model(): any {
    return (this.prisma as any)[this.modelName];
  }

  /**
   * Find a single record by ID
   *
   * @param id - Record ID
   * @param include - Optional relations to include
   * @returns The record or null if not found
   *
   * @example
   * ```ts
   * const user = await userRepo.findById('123');
   * const userWithPosts = await userRepo.findById('123', { posts: true });
   * ```
   */
  async findById(id: string, include?: Record<string, boolean>): Promise<T | null> {
    return this.model.findUnique({
      where: { id },
      ...(include && { include }),
    });
  }

  /**
   * Find a single record by where clause
   *
   * @param where - Where clause
   * @returns The first matching record or null
   *
   * @example
   * ```ts
   * const user = await userRepo.findOne({ email: 'test@example.com' });
   * ```
   */
  async findOne(where: Partial<T>): Promise<T | null> {
    return this.model.findFirst({ where });
  }

  /**
   * Find many records with optional filtering and pagination
   *
   * @param params - Query parameters
   * @returns Array of records
   *
   * @example
   * ```ts
   * const users = await userRepo.findMany({
   *   where: { banned: false },
   *   orderBy: { createdAt: 'desc' },
   *   take: 10,
   * });
   * ```
   */
  async findMany(params?: FindManyParams<T>): Promise<T[]> {
    return this.model.findMany({
      ...(params?.where && { where: params.where }),
      ...(params?.orderBy && { orderBy: params.orderBy }),
      ...(params?.take !== undefined && { take: params.take }),
      ...(params?.skip !== undefined && { skip: params.skip }),
      ...(params?.include && { include: params.include }),
    });
  }

  /**
   * Find many records with pagination
   *
   * @param params - Query parameters
   * @param pagination - Pagination parameters
   * @returns Paginated result with metadata
   *
   * @example
   * ```ts
   * const result = await userRepo.findPaginated(
   *   { where: { banned: false } },
   *   { page: 1, limit: 20 }
   * );
   * // { data: [...], total: 100, page: 1, limit: 20, totalPages: 5 }
   * ```
   */
  async findPaginated(
    params?: FindManyParams<T>,
    pagination?: PaginationParams
  ): Promise<PaginatedResult<T>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.model.findMany({
        ...(params?.where && { where: params.where }),
        ...(params?.orderBy && { orderBy: params.orderBy }),
        ...(params?.include && { include: params.include }),
        take: limit,
        skip,
      }),
      this.model.count({ where: params?.where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Create a new record
   *
   * @param data - Record data
   * @returns Created record
   *
   * @example
   * ```ts
   * const user = await userRepo.create({
   *   username: 'test',
   *   email: 'test@example.com',
   *   passwordHash: 'hash',
   * });
   * ```
   */
  async create(data: Partial<T>): Promise<T> {
    return this.model.create({ data });
  }

  /**
   * Update a record by ID
   *
   * @param id - Record ID
   * @param data - Data to update
   * @returns Updated record
   *
   * @example
   * ```ts
   * const user = await userRepo.update('123', { banned: true });
   * ```
   */
  async update(id: string, data: Partial<T>): Promise<T> {
    return this.model.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a record by ID
   *
   * @param id - Record ID
   * @returns Deleted record
   *
   * @example
   * ```ts
   * await userRepo.delete('123');
   * ```
   */
  async delete(id: string): Promise<T> {
    return this.model.delete({
      where: { id },
    });
  }

  /**
   * Count records matching the where clause
   *
   * @param where - Optional where clause
   * @returns Count of matching records
   *
   * @example
   * ```ts
   * const count = await userRepo.count({ banned: true });
   * ```
   */
  async count(where?: Partial<T>): Promise<number> {
    return this.model.count({
      ...(where && { where }),
    });
  }

  /**
   * Check if a record exists
   *
   * @param where - Where clause
   * @returns true if record exists, false otherwise
   *
   * @example
   * ```ts
   * const exists = await userRepo.exists({ email: 'test@example.com' });
   * ```
   */
  async exists(where: Partial<T>): Promise<boolean> {
    const count = await this.model.count({ where });
    return count > 0;
  }

  /**
   * Update multiple records
   *
   * @param where - Where clause to match records
   * @param data - Data to update
   * @returns Count of updated records
   *
   * @example
   * ```ts
   * const count = await userRepo.updateMany(
   *   { banned: false },
   *   { role: 'USER' }
   * );
   * ```
   */
  async updateMany(where: Partial<T>, data: Partial<T>): Promise<number> {
    const result = await this.model.updateMany({
      where,
      data,
    });
    return result.count;
  }

  /**
   * Delete multiple records
   *
   * @param where - Where clause to match records
   * @returns Count of deleted records
   *
   * @example
   * ```ts
   * const count = await userRepo.deleteMany({ banned: true });
   * ```
   */
  async deleteMany(where: Partial<T>): Promise<number> {
    const result = await this.model.deleteMany({ where });
    return result.count;
  }
}

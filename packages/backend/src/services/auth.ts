/**
 * Authentication service
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { prisma } from './database';
import { config } from '../config';
import { PlayerProfile } from '@modern-launcher/shared';
import { UUIDHelper } from '@modern-launcher/shared';
import { logger } from '../utils/logger';

const SALT_ROUNDS = 10;

/**
 * Calculate SHA-256 digest for a texture URL
 */
async function calculateTextureDigest(url: string): Promise<string> {
  try {
    // If texture is stored locally (uploaded skin/cloak), read it directly from disk
    if (url.startsWith('/uploads/textures/')) {
      const relativePath = url.replace(/^\//, ''); // remove leading slash
      const filePath = path.join(process.cwd(), relativePath);
      const buffer = await fs.readFile(filePath);
      return crypto.createHash('sha256').update(buffer).digest('hex');
    }

    // If URL is relative (starts with /), convert to absolute URL
    let absoluteUrl = url;
    if (url.startsWith('/')) {
      // Use 127.0.0.1 for relative paths (textures are served by this server)
      // 127.0.0.1 works even when server listens on 0.0.0.0
      const baseUrl = `http://127.0.0.1:${config.server.port}`;
      absoluteUrl = `${baseUrl}${url}`;
    }
    
    const response = await axios.get(absoluteUrl, { 
      responseType: 'arraybuffer',
      timeout: 10000, // 10 second timeout
    });
    const buffer = Buffer.from(response.data);
    return crypto.createHash('sha256').update(buffer).digest('hex');
  } catch (error) {
    logger.warn(`Failed to calculate digest for texture ${url}:`, error);
    // Return empty string if download fails (texture might be unavailable)
    return '';
  }
}

export interface JWTPayload {
  userId: string;
  username: string;
  uuid: string;
  role: 'USER' | 'ADMIN';
}

export class AuthService {
  /**
   * Hash password using bcrypt with configured salt rounds
   * 
   * Pure function: no side effects, deterministic output for same input.
   * 
   * @param password - Plain text password to hash
   * @returns Hashed password string (bcrypt format)
   * 
   * @example
   * ```ts
   * const hash = await AuthService.hashPassword('myPassword123');
   * // Store hash in database
   * ```
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  /**
   * Verify password against stored hash
   * 
   * Pure function: no side effects, compares password with bcrypt hash.
   * 
   * @param password - Plain text password to verify
   * @param hash - Stored bcrypt hash to compare against
   * @returns `true` if password matches hash, `false` otherwise
   * 
   * @example
   * ```ts
   * const isValid = await AuthService.verifyPassword('myPassword123', storedHash);
   * if (isValid) {
   *   // Allow login
   * }
   * ```
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT access token for authenticated user
   * 
   * Pure function: no side effects, generates token from payload.
   * Token expiration is controlled by `config.jwt.expiry`.
   * 
   * @param payload - User data to encode in token (userId, username, uuid, role)
   * @returns Signed JWT token string
   * 
   * @example
   * ```ts
   * const token = AuthService.generateToken({
   *   userId: '123',
   *   username: 'player1',
   *   uuid: 'uuid-here',
   *   role: 'USER'
   * });
   * ```
   */
  static generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: String(config.jwt.expiry),
    } as jwt.SignOptions);
  }

  /**
   * Verify and decode JWT token
   * 
   * Pure function: no side effects, validates token signature and expiration.
   * 
   * @param token - JWT token string to verify
   * @returns Decoded payload if token is valid, `null` if invalid or expired
   * 
   * @example
   * ```ts
   * const payload = AuthService.verifyToken(token);
   * if (payload) {
   *   // Token is valid, use payload.userId
   * }
   * ```
   */
  static verifyToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, config.jwt.secret) as JWTPayload;
    } catch {
      return null;
    }
  }

  /**
   * Authenticate user with username/password and create session
   * 
   * Side effects:
   * - Records authentication attempt (for rate limiting)
   * - Updates user's last login timestamp
   * - Deletes old sessions for user
   * - Creates new session in database
   * - Calculates texture digests for player profile
   * 
   * @param login - Username or email to authenticate
   * @param password - Plain text password
   * @param ipAddress - Optional IP address for rate limiting and audit logging
   * @returns Authentication result with player profile and access token on success
   * 
   * @example
   * ```ts
   * const result = await AuthService.authenticate('player1', 'password123', '192.168.1.1');
   * if (result.success) {
   *   // Use result.accessToken and result.playerProfile
   * }
   * ```
   */
  static async authenticate(login: string, password: string, ipAddress?: string): Promise<{
    success: boolean;
    playerProfile?: PlayerProfile;
    accessToken?: string;
    error?: string;
  }> {
    try {
      // Find user
      const user = await prisma.user.findUnique({
        where: { username: login },
      });

      if (!user) {
        // Record failed attempt
        await this.recordAuthAttempt(login, ipAddress, false);
        return { success: false, error: 'Invalid credentials' };
      }

      // Check if user is banned
      if (user.banned) {
        await this.recordAuthAttempt(login, ipAddress, false);
        return { success: false, error: 'Account is banned' };
      }

      // Verify password
      const isValid = await this.verifyPassword(password, user.password);
      
      if (!isValid) {
        await this.recordAuthAttempt(login, ipAddress, false);
        return { success: false, error: 'Invalid credentials' };
      }

      // Record successful attempt
      await this.recordAuthAttempt(login, ipAddress, true);

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      // Generate token
      const payload: JWTPayload = {
        userId: user.id,
        username: user.username,
        uuid: user.uuid,
        role: user.role,
      };
      const accessToken = this.generateToken(payload);

      // Delete old sessions for this user (optional - or update existing)
      const deletedCount = await prisma.session.deleteMany({
        where: {
          userId: user.id,
        },
      });
      console.log('[Auth] Deleted', deletedCount.count, 'old sessions for user:', user.username);

      // Create new session
      const session = await prisma.session.create({
        data: {
          userId: user.id,
          accessToken,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          ipAddress,
        },
      });

      // Build player profile with texture digests
      const [skinDigest, cloakDigest] = await Promise.all([
        user.skinUrl ? calculateTextureDigest(user.skinUrl) : Promise.resolve(''),
        user.cloakUrl ? calculateTextureDigest(user.cloakUrl) : Promise.resolve(''),
      ]);

      const playerProfile: PlayerProfile = {
        uuid: user.uuid,
        username: user.username,
        skin: user.skinUrl ? {
          url: user.skinUrl,
          digest: skinDigest,
        } : undefined,
        cloak: user.cloakUrl ? {
          url: user.cloakUrl,
          digest: cloakDigest,
        } : undefined,
      };

      return {
        success: true,
        playerProfile,
        accessToken,
      };
    } catch (error: any) {
      console.error('Authentication error:', error);
      return {
        success: false,
        error: error.message || 'Authentication failed',
      };
    }
  }

  /**
   * Register new user account
   * 
   * Side effects:
   * - Creates new user record in database
   * - Generates offline UUID for user
   * - Hashes password before storage
   * 
   * @param username - Unique username (3-16 chars, alphanumeric + underscore)
   * @param password - Plain text password (min 6 characters)
   * @param email - Optional email address
   * @returns Registration result with userId on success
   * 
   * @example
   * ```ts
   * const result = await AuthService.register('newplayer', 'securePass123', 'email@example.com');
   * if (result.success) {
   *   // User created with result.userId
   * }
   * ```
   */
  static async register(username: string, password: string, email?: string): Promise<{
    success: boolean;
    userId?: string;
    error?: string;
  }> {
    try {
      // Check if user exists
      const existing = await prisma.user.findUnique({
        where: { username },
      });

      if (existing) {
        return { success: false, error: 'Username already exists' };
      }

      // Hash password
      const hashedPassword = await this.hashPassword(password);

      // Generate UUID
      const uuid = UUIDHelper.generateOffline(username);

      // Create user
      const user = await prisma.user.create({
        data: {
          username,
          password: hashedPassword,
          uuid,
          email,
        },
      });

      return { success: true, userId: user.id };
    } catch (error) {
      return { success: false, error: 'Registration failed' };
    }
  }

  /**
   * Record authentication attempt for rate limiting
   */
  private static async recordAuthAttempt(username: string, ipAddress: string | undefined, success: boolean) {
    if (!ipAddress) return;

    await prisma.authAttempt.create({
      data: {
        username,
        ipAddress,
        success,
      },
    });

    // Clean up old attempts (older than 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    await prisma.authAttempt.deleteMany({
      where: {
        timestamp: {
          lt: oneHourAgo,
        },
      },
    });
  }

  /**
   * Check if IP address is rate limited based on failed authentication attempts
   * 
   * Pure query: reads from database, no side effects.
   * Rate limiting is controlled by `config.rateLimit` settings.
   * 
   * @param ipAddress - IP address to check
   * @returns `true` if IP is rate limited, `false` otherwise
   * 
   * @example
   * ```ts
   * const isLimited = await AuthService.checkRateLimit('192.168.1.1');
   * if (isLimited) {
   *   // Reject request
   * }
   * ```
   */
  static async checkRateLimit(ipAddress: string): Promise<boolean> {
    if (!config.rateLimit.enabled) return false;

    const since = new Date(Date.now() - config.rateLimit.windowMs);
    
    const attempts = await prisma.authAttempt.count({
      where: {
        ipAddress,
        success: false,
        timestamp: {
          gte: since,
        },
      },
    });

    return attempts >= config.rateLimit.maxAttempts;
  }

  /**
   * Validate session token and check session in database
   * 
   * Side effects:
   * - Updates session's lastUsedAt timestamp
   * - Deletes session if user is banned
   * 
   * Validates both JWT signature/expiration and database session record.
   * Handles database connection errors gracefully (returns null instead of throwing).
   * 
   * @param token - JWT access token to validate
   * @returns Decoded payload if session is valid, `null` if invalid/expired/banned
   * 
   * @example
   * ```ts
   * const payload = await AuthService.validateSession(token);
   * if (payload) {
   *   // Session is valid, user is authenticated
   * }
   * ```
   */
  static async validateSession(token: string): Promise<JWTPayload | null> {
    const payload = this.verifyToken(token);
    if (!payload) {
      console.log('[Auth] Token verification failed - invalid JWT');
      return null;
    }

    // Check if session exists and is valid
    let session;
    try {
      session = await prisma.session.findUnique({
        where: { accessToken: token },
        include: { user: true },
      });
    } catch (dbError: any) {
      // Database connection error - treat as invalid session
      if (dbError.message.includes("Can't reach database") || dbError.message.includes("database server")) {
        console.warn(`[Auth] Database unavailable during session validation: ${dbError.message}`);
        return null; // Return null to indicate invalid session, but don't crash
      }
      // Other database errors should be thrown
      throw dbError;
    }

    if (!session) {
      return null;
    }

    if (session.expiresAt < new Date()) {
      return null;
    }

    // Check if user is banned
    if (session.user.banned) {
      console.log('[Auth] User is banned:', session.user.username);
      // Delete session for banned user (only if DB is available)
      try {
        await prisma.session.delete({
          where: { id: session.id },
        });
      } catch (deleteError: any) {
        // Database might be unavailable, that's okay
        if (!deleteError.message.includes("Can't reach database") && !deleteError.message.includes("database server")) {
          console.warn('[Auth] Failed to delete banned user session:', deleteError);
        }
      }
      return null;
    }

    // Update last used - use updateMany to avoid error if session was deleted
    // This can happen if session was deleted between findUnique and update
    try {
      await prisma.session.updateMany({
        where: { id: session.id },
        data: { lastUsedAt: new Date() },
      });
    } catch (error: any) {
      // Session might have been deleted or DB unavailable - that's okay, just log and continue
      if (!error.message.includes("Can't reach database") && !error.message.includes("database server")) {
        console.warn('[Auth] Failed to update session lastUsedAt (session may have been deleted):', error.message);
      }
    }

    return payload;
  }

  /**
   * Revoke session by deleting it from database
   * 
   * Side effects:
   * - Deletes session record from database
   * 
   * @param token - Access token of session to revoke
   * 
   * @example
   * ```ts
   * await AuthService.revokeSession(token);
   * // Session is now invalid, user must re-authenticate
   * ```
   */
  static async revokeSession(token: string): Promise<void> {
    await prisma.session.delete({
      where: { accessToken: token },
    });
  }
}

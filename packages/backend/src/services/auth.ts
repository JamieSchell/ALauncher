/**
 * Authentication service
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import crypto from 'crypto';
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
    // If URL is relative (starts with /), convert to absolute URL
    let absoluteUrl = url;
    if (url.startsWith('/')) {
      // Use localhost for relative paths (textures are served by this server)
      const baseUrl = `http://localhost:${config.server.port}`;
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
   * Hash password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  /**
   * Verify password
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT token
   */
  static generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: String(config.jwt.expiry),
    } as jwt.SignOptions);
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, config.jwt.secret) as JWTPayload;
    } catch {
      return null;
    }
  }

  /**
   * Authenticate user
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
   * Register new user
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
   * Check if IP is rate limited
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
   * Validate session token
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
   * Revoke session
   */
  static async revokeSession(token: string): Promise<void> {
    await prisma.session.delete({
      where: { accessToken: token },
    });
  }
}

/**
 * Authentication service
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from './database';
import { config } from '../config';
import { PlayerProfile } from '@modern-launcher/shared';
import { UUIDHelper } from '@modern-launcher/shared';

const SALT_ROUNDS = 10;

export interface JWTPayload {
  userId: string;
  username: string;
  uuid: string;
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
      expiresIn: config.jwt.expiry,
    });
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
      };
      const accessToken = this.generateToken(payload);

      // Create session
      await prisma.session.create({
        data: {
          userId: user.id,
          accessToken,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          ipAddress,
        },
      });

      // Build player profile
      const playerProfile: PlayerProfile = {
        uuid: user.uuid,
        username: user.username,
        skin: user.skinUrl ? {
          url: user.skinUrl,
          digest: '', // TODO: calculate digest
        } : undefined,
        cloak: user.cloakUrl ? {
          url: user.cloakUrl,
          digest: '', // TODO: calculate digest
        } : undefined,
      };

      return {
        success: true,
        playerProfile,
        accessToken,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Authentication failed',
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
    if (!payload) return null;

    // Check if session exists and is valid
    const session = await prisma.session.findUnique({
      where: { accessToken: token },
    });

    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    // Update last used
    await prisma.session.update({
      where: { id: session.id },
      data: { lastUsedAt: new Date() },
    });

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

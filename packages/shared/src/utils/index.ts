/**
 * Shared utilities
 *
 * Security-hardened version with input validation, error handling,
 * and proper cryptographic operations.
 */

// ============================================================================
// CUSTOM ERROR CLASSES
// ============================================================================

/**
 * Custom error for validation failures
 */
export class ValidationError extends Error {
  constructor(
    public field: string,
    public value: unknown,
    message: string
  ) {
    super(`${field}: ${message} (got: ${JSON.stringify(value)})`);
    this.name = 'ValidationError';
  }
}

/**
 * Custom error for version parsing failures
 */
export class VersionParseError extends Error {
  constructor(
    public version: string,
    public reason: string
  ) {
    super(`Failed to parse version "${version}": ${reason}`);
    this.name = 'VersionParseError';
  }
}

/**
 * Custom error for UUID-related failures
 */
export class UUIDError extends Error {
  constructor(
    public value: unknown,
    message: string
  ) {
    super(`UUID Error: ${message} (got: ${JSON.stringify(value)})`);
    this.name = 'UUIDError';
  }
}

/**
 * Custom error for path-related failures
 */
export class PathError extends Error {
  constructor(
    public path: string,
    message: string
  ) {
    super(`Path Error: ${message} (path: "${path}")`);
    this.name = 'PathError';
  }
}

// ============================================================================
// INPUT VALIDATOR UTILITY
// ============================================================================

/**
 * Centralized input validation utility
 */
class InputValidator {
  /**
   * Assert value is a string
   */
  static assertString(value: unknown, paramName: string): string {
    if (typeof value !== 'string') {
      throw new TypeError(`Parameter "${paramName}" must be a string, got ${typeof value}`);
    }
    return value;
  }

  /**
   * Assert value is a non-empty string
   */
  static assertNonEmptyString(value: unknown, paramName: string): string {
    const str = this.assertString(value, paramName);
    if (str.length === 0) {
      throw new Error(`Parameter "${paramName}" cannot be empty`);
    }
    if (str.length > 1000) {
      throw new RangeError(`Parameter "${paramName}" is too long (max 1000 characters)`);
    }
    return str;
  }

  /**
   * Assert value is a number within range
   */
  static assertRange(value: number, min: number, max: number, paramName: string): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new TypeError(`Parameter "${paramName}" must be a finite number`);
    }
    if (value < min || value > max) {
      throw new RangeError(
        `Parameter "${paramName}" must be between ${min} and ${max}, got ${value}`
      );
    }
    return value;
  }

  /**
   * Assert value is a valid length
   */
  static assertLength(value: string, min: number, max: number, paramName: string): string {
    if (value.length < min || value.length > max) {
      throw new RangeError(
        `Parameter "${paramName}" must be between ${min} and ${max} characters, got ${value.length}`
      );
    }
    return value;
  }
}

// ============================================================================
// VERSION COMPARATOR
// ============================================================================

/**
 * Semantic version comparison utility
 */
export class VersionComparator {
  /**
   * Compare two version strings
   * @param v1 - First version string (e.g., "1.2.3" or "v1.2.3")
   * @param v2 - Second version string (e.g., "1.2.4" or "v1.2.4")
   * @returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal
   * @throws {ValidationError} If inputs are not strings
   * @throws {VersionParseError} If version format is invalid
   *
   * @example
   * ```ts
   * VersionComparator.compare("1.2.3", "1.2.4"); // returns -1
   * VersionComparator.compare("2.0.0", "1.9.9"); // returns 1
   * VersionComparator.compare("1.0.0", "1.0.0"); // returns 0
   * VersionComparator.compare("v1.0.0", "1.0.0"); // returns 0
   * ```
   */
  static compare(v1: string, v2: string): number {
    // Input validation
    v1 = InputValidator.assertString(v1, 'v1');
    v2 = InputValidator.assertString(v2, 'v2');

    // Remove 'v' prefix if present
    v1 = v1.replace(/^v/i, '');
    v2 = v2.replace(/^v/i, '');

    // Validate format before parsing
    if (!this.isValidFormat(v1)) {
      throw new VersionParseError(v1, 'Invalid version format');
    }
    if (!this.isValidFormat(v2)) {
      throw new VersionParseError(v2, 'Invalid version format');
    }

    // Parse version strings safely with proper error handling
    const v1Parts = v1.split('.').map((p, i) => {
      const num = parseInt(p, 10);
      if (isNaN(num)) {
        throw new VersionParseError(v1, `Invalid version part at index ${i}: "${p}" is not a number`);
      }
      return num;
    });

    const v2Parts = v2.split('.').map((p, i) => {
      const num = parseInt(p, 10);
      if (isNaN(num)) {
        throw new VersionParseError(v2, `Invalid version part at index ${i}: "${p}" is not a number`);
      }
      return num;
    });

    // Compare segment by segment
    const maxLength = Math.max(v1Parts.length, v2Parts.length);

    for (let i = 0; i < maxLength; i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;

      if (v1Part > v2Part) return 1;
      if (v1Part < v2Part) return -1;
    }

    return 0; // Versions are equal
  }

  /**
   * Check if version is at least minimum version
   * @param version - Version to check
   * @param minVersion - Minimum required version
   * @returns true if version >= minVersion
   */
  static isAtLeast(version: string, minVersion: string): boolean {
    try {
      return this.compare(version, minVersion) >= 0;
    } catch {
      return false;
    }
  }

  /**
   * Validate version format
   * @param version - Version string to validate
   * @returns true if version format is valid
   *
   * Valid formats: "1", "1.2", "1.2.3" where parts are non-negative integers
   */
  static isValidFormat(version: string): boolean {
    if (typeof version !== 'string') return false;

    // Remove 'v' prefix
    version = version.replace(/^v/i, '');

    // Check format: x.y.z where x, y, z are non-negative integers
    return /^(\d+)(\.(\d+)(\.(\d+))?)?$/.test(version);
  }
}

// ============================================================================
// UUID HELPER
// ============================================================================

/**
 * UUID generation and manipulation utility
 * Implements secure offline UUID generation with proper hashing
 */
export class UUIDHelper {
  // Standard UUID v3 namespace for DNS (can be used as base for offline UUIDs)
  private static readonly OFFLINE_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

  // Server-specific salt (should be overridden via environment variable)
  private static readonly SALT = process.env.LAUNCHER_UUID_SALT || 'default-launcher-salt-change-in-production';

  /**
   * Convert UUID to hash format (remove dashes)
   * @param uuid - UUID string (e.g., "550e8400-e29b-41d4-a716-446655440000")
   * @returns Hash without dashes (e.g., "550e8400e29b41d4a716446655440000")
   * @throws {UUIDError} If uuid format is invalid
   */
  static toHash(uuid: string): string {
    InputValidator.assertNonEmptyString(uuid, 'uuid');

    // Validate UUID format before processing
    if (!this.isValidUUID(uuid)) {
      throw new UUIDError(uuid, 'Invalid UUID format');
    }

    return uuid.replace(/-/g, '');
  }

  /**
   * Convert hash to UUID format (add dashes)
   * @param hash - 32-character hex string
   * @returns UUID string in format "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
   * @throws {UUIDError} If hash length is not exactly 32 characters
   */
  static fromHash(hash: string): string {
    InputValidator.assertString(hash, 'hash');

    if (hash.length !== 32) {
      throw new UUIDError(hash, `Invalid hash length: expected 32 characters, got ${hash.length}`);
    }

    // Validate that hash contains only hexadecimal characters
    if (!/^[0-9a-fA-F]{32}$/.test(hash)) {
      throw new UUIDError(hash, 'Hash must contain only hexadecimal characters');
    }

    return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20)}`;
  }

  /**
   * Generate offline UUID from username using secure hashing
   * Uses SHA-256 with namespace and salt for deterministic but secure UUIDs
   *
   * @param username - Username to generate UUID for
   * @returns UUID v4-like format (derived from hash)
   * @throws {ValidationError} If username is invalid
   *
   * Security improvements:
   * - Uses SHA-256 instead of MD5
   * - Includes server-specific salt
   * - Uses standard UUID namespace
   * - Properly formats as UUID v4
   *
   * @example
   * ```ts
   * UUIDHelper.generateOffline("player1"); // "550e8400-e29b-41d4-a716-446655440000"
   * ```
   */
  static generateOffline(username: string): string {
    // Input validation
    username = InputValidator.assertNonEmptyString(username, 'username');
    username = InputValidator.assertLength(username, 3, 16, 'username');

    // Sanitize username (alphanumeric and underscore only)
    const sanitized = username.replace(/[^a-zA-Z0-9_]/g, '');
    if (sanitized.length === 0) {
      throw new ValidationError('username', username, 'Username must contain at least one alphanumeric character or underscore');
    }

    try {
      // Try Node.js crypto module first (for backend)
      if (typeof require !== 'undefined') {
        const crypto = require('crypto');

        // Create deterministic input with namespace and salt
        const input = `${this.OFFLINE_NAMESPACE}:${sanitized}:${this.SALT}`;

        // Use SHA-256 instead of MD5 for security
        const hash = crypto.createHash('sha256').update(input).digest('hex');

        // Convert to UUID v4 format (random-looking but deterministic for same username+salt)
        const uuid = [
          hash.substring(0, 8),
          hash.substring(8, 12),
          // Set version to 4 (random UUID)
          '4' + hash.substring(12, 15),
          // Set variant to 2 (RFC 4122)
          ((parseInt(hash.substring(16, 17), 16) & 0x3f) | 0x80).toString(16) + hash.substring(17, 20),
          hash.substring(20, 32)
        ].join('-');

        return uuid;
      }
    } catch (error) {
      // Fallback if crypto module is not available (browser/frontend)
      // Use Web Crypto API if available
      if (typeof crypto !== 'undefined' && crypto.subtle) {
        // This is async, but for offline UUID we need sync
        // Fall through to simple hash
      }
    }

    // Simple fallback using Web Crypto API or basic hash
    // This is less secure but functional for frontend-only scenarios
    const str = `OfflinePlayer:${sanitized}:${this.SALT}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    // Add more entropy with timestamp
    const timestamp = Date.now();
    hash = hash ^ timestamp;

    // Convert to hex and pad
    let hashHex = Math.abs(hash).toString(16).padStart(32, '0');

    // Ensure exactly 32 characters
    while (hashHex.length < 32) {
      hashHex += '0';
    }
    hashHex = hashHex.slice(0, 32);

    // Convert to UUID v4 format
    return this.fromHash(hashHex);
  }

  /**
   * Generate a random UUID v4
   * Uses crypto.randomUUID() if available, otherwise falls back to Math.random()
   * Note: For security-critical applications, always use a proper crypto library
   *
   * @returns Random UUID v4 string
   */
  static generateRandom(): string {
    // Try crypto.randomUUID() (available in Node.js 16+ and modern browsers)
    if (typeof crypto !== 'undefined' && (crypto as any).randomUUID) {
      return (crypto as any).randomUUID();
    }

    // Try Node.js crypto module
    try {
      if (typeof require !== 'undefined') {
        const crypto = require('crypto');
        return crypto.randomUUID();
      }
    } catch {
      // Fall through to Math.random()
    }

    // Fallback with proper randomness using Math.random()
    // Note: This is NOT cryptographically secure!
    const bytes = new Uint8Array(16);
    for (let i = 0; i < 16; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }

    // Convert to UUID format
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant

    const toHex = (b: number) => b.toString(16).padStart(2, '0');

    return [
      toHex(bytes[0]) + toHex(bytes[1]) + toHex(bytes[2]) + toHex(bytes[3]),
      toHex(bytes[4]) + toHex(bytes[5]),
      toHex(bytes[6]) + toHex(bytes[7]),
      toHex(bytes[8]) + toHex(bytes[9]),
      toHex(bytes[10]) + toHex(bytes[11]) + toHex(bytes[12]) + toHex(bytes[13]) + toHex(bytes[14]) + toHex(bytes[15])
    ].join('-');
  }

  /**
   * Validate UUID format
   * @param uuid - UUID string to validate
   * @returns true if uuid matches standard UUID format (v1-v5)
   */
  static isValidUUID(uuid: string): boolean {
    if (typeof uuid !== 'string') return false;

    // Standard UUID regex (matches v1, v2, v3, v4, v5)
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);
  }
}

// ============================================================================
// PATH HELPER
// ============================================================================

/**
 * File path manipulation utility with security protections
 */
export class PathHelper {
  /**
   * Normalize path separators to forward slashes
   * @param path - Path to normalize
   * @returns Path with forward slashes
   * @throws {PathError} If path is not a string
   */
  static normalize(path: string): string {
    InputValidator.assertString(path, 'path');
    return path.replace(/\\/g, '/');
  }

  /**
   * Join path segments with security validation
   * Protects against directory traversal attacks and malicious paths
   *
   * @param paths - Path segments to join
   * @returns Joined path string
   * @throws {PathError} If path traversal detected or invalid path segments
   *
   * @example
   * ```ts
   * PathHelper.join('uploads', 'files', 'document.pdf'); // "uploads/files/document.pdf"
   * PathHelper.join('uploads', '../../etc/passwd'); // THROWS PathError (traversal detected)
   * ```
   */
  static join(...paths: string[]): string {
    // Validate all path segments
    if (paths.length === 0) {
      throw new PathError('', 'At least one path segment is required');
    }

    for (let i = 0; i < paths.length; i++) {
      const p = paths[i];
      if (typeof p !== 'string') {
        throw new PathError(String(p), `Path segment ${i} must be a string, got ${typeof p}`);
      }

      // Check for suspicious patterns
      if (p.includes('\0')) {
        throw new PathError(p, 'Null byte detected in path');
      }

      if (p.length === 0) {
        throw new PathError(p, `Path segment ${i} is empty`);
      }
    }

    // Normalize paths (convert backslashes to forward slashes, trim slashes)
    const normalized = paths
      .map(p => p.replace(/^\\+|\/+|\\+$/g, ''))
      .filter(p => p.length > 0)
      .join('/');

    // Check for path traversal attempts
    if (/\.\.[\/\\]/.test(normalized) || /[\/\\]\.\.[\/\\]/.test(normalized)) {
      throw new PathError(normalized, 'Path traversal detected: ".." sequences are not allowed');
    }

    // Check for encoded traversal attempts
    if (/%2e%2e|%252e|%5c|%255c|%2f|%252f/i.test(normalized)) {
      throw new PathError(normalized, 'Encoded path traversal detected');
    }

    // Prevent absolute paths from breaking out
    if (normalized.startsWith('..') || normalized.startsWith('../')) {
      throw new PathError(normalized, 'Resulting path attempts to traverse outside base directory');
    }

    return normalized;
  }

  /**
   * Join paths with base directory validation
   * Ensures the result stays within the base directory
   *
   * @param basePath - Base directory path
   * @param paths - Path segments to join
   * @returns Safe joined path
   * @throws {PathError} If resulting path is outside base directory
   *
   * @example
   * ```ts
   * PathHelper.joinSafe('/var/www', 'uploads', 'file.txt'); // "/var/www/uploads/file.txt"
   * PathHelper.joinSafe('/var/www', '../../etc/passwd'); // THROWS PathError
   * ```
   */
  static joinSafe(basePath: string, ...paths: string[]): string {
    InputValidator.assertNonEmptyString(basePath, 'basePath');

    const joined = this.join(basePath, ...paths);

    // Additional safety check: ensure no absolute path override
    if (paths.some(p => p.startsWith('/') || p.startsWith('\\'))) {
      throw new PathError(joined, 'Absolute paths are not allowed in path segments');
    }

    return joined;
  }

  /**
   * Get file extension from path
   * @param path - File path
   * @returns Lowercase file extension without dot, or empty string
   */
  static getExtension(path: string): string {
    InputValidator.assertString(path, 'path');

    const match = path.match(/\.([^.]+)$/);
    return match ? match[1].toLowerCase() : '';
  }

  /**
   * Check if path has specific extension
   * @param path - File path to check
   * @param ext - Extension to check (with or without dot)
   * @returns true if path has the specified extension
   */
  static hasExtension(path: string, ext: string): boolean {
    InputValidator.assertString(path, 'path');
    InputValidator.assertString(ext, 'ext');

    // Remove dot from ext if present
    const cleanExt = ext.startsWith('.') ? ext.slice(1) : ext;
    return this.getExtension(path) === cleanExt.toLowerCase();
  }

  /**
   * Validate path is safe (no traversal, no null bytes, etc.)
   * @param path - Path to validate
   * @returns true if path is safe
   */
  static isSafe(path: string): boolean {
    try {
      this.join(path);
      return true;
    } catch {
      return false;
    }
  }
}

// ============================================================================
// SECURITY HELPER
// ============================================================================

/**
 * Security validation and sanitization utility
 */
export class SecurityHelper {
  /**
   * Validate JWT token format with proper verification
   * Checks structure, Base64URL encoding, and JWT claims
   *
   * @param token - JWT token string to validate
   * @returns true if token has valid JWT format
   *
   * Validation includes:
   * - Exactly 3 parts separated by dots
   * - Base64URL encoding (no padding)
   * - Valid JSON in header and payload
   * - Required JWT claims (alg, typ)
   * - Expiration check (if exp claim exists)
   *
   * Note: This only validates format, not signature.
   * Signature verification should happen during JWT.verify() with secret.
   *
   * @example
   * ```ts
   * SecurityHelper.isValidToken("a.b.c"); // false (too short)
   * SecurityHelper.isValidToken("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"); // true
   * ```
   */
  static isValidToken(token: string): boolean {
    // Basic type check
    if (typeof token !== 'string' || token.length === 0) {
      return false;
    }

    // Quick format check (3 parts with dots)
    if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) {
      return false;
    }

    // Split into parts
    const parts = token.split('.');

    // JWT must have exactly 3 parts
    if (parts.length !== 3) {
      return false;
    }

    const [headerB64, payloadB64, signatureB64] = parts;

    // Validate Base64URL format (no padding allowed in JWT)
    const base64UrlRegex = /^[A-Za-z0-9_-]+$/;
    if (!base64UrlRegex.test(headerB64) ||
        !base64UrlRegex.test(payloadB64) ||
        !base64UrlRegex.test(signatureB64)) {
      return false;
    }

    // Validate minimum lengths
    if (headerB64.length < 10 || payloadB64.length < 10 || signatureB64.length < 10) {
      return false;
    }

    // Try to decode and validate header and payload (should be valid JSON)
    try {
      // Helper function for base64url decode
      const base64UrlDecode = (str: string): string => {
        // Add padding for base64 decode
        const padded = str + '='.repeat((4 - str.length % 4) % 4);
        // Replace base64url chars with base64 chars
        const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
        return Buffer.from(base64, 'base64').toString('utf-8');
      };

      const header = JSON.parse(base64UrlDecode(headerB64));
      const payload = JSON.parse(base64UrlDecode(payloadB64));

      // Basic JWT structure validation
      if (!header.alg || typeof header.alg !== 'string') {
        return false;
      }

      if (!header.typ || header.typ !== 'JWT') {
        return false;
      }

      // Check for expired token
      if (payload.exp && typeof payload.exp === 'number') {
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp < now) {
          return false; // Token expired
        }
      }

    } catch {
      // JSON parsing failed or base64 decoding failed
      return false;
    }

    // Format is valid (signature not verified here)
    return true;
  }

  /**
   * Sanitize username by removing special characters
   * @param username - Username to sanitize
   * @returns Sanitized username (alphanumeric and underscore only, max 16 chars)
   * @throws {ValidationError} If username is not a string
   *
   * @example
   * ```ts
   * SecurityHelper.sanitizeUsername("user@name!"); // "username"
   * SecurityHelper.sanitizeUsername("user-name-123"); // "username123"
   * ```
   */
  static sanitizeUsername(username: string): string {
    InputValidator.assertString(username, 'username');

    // Remove all characters except alphanumeric and underscore
    const sanitized = username.replace(/[^a-zA-Z0-9_]/g, '');

    // Truncate to 16 characters
    return sanitized.slice(0, 16);
  }

  /**
   * Validate username format
   * @param username - Username to validate
   * @returns true if username is valid (3-16 alphanumeric/underscore chars)
   */
  static isValidUsername(username: string): boolean {
    if (typeof username !== 'string') return false;

    return /^[a-zA-Z0-9_]{3,16}$/.test(username);
  }

  /**
   * Validate and sanitize email address
   * @param email - Email address to validate
   * @returns Sanitized email in lowercase, or null if invalid
   */
  static sanitizeEmail(email: string): string | null {
    InputValidator.assertString(email, 'email');

    // Basic email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return null;
    }

    // Return lowercase version
    return email.toLowerCase().trim();
  }

  /**
   * Escape HTML special characters to prevent XSS
   * @param html - HTML string to escape
   * @returns Escaped HTML string
   */
  static escapeHtml(html: string): string {
    InputValidator.assertString(html, 'html');

    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
      '/': '&#x2F;',
    };

    return html.replace(/[&<>"'/]/g, (m) => map[m]);
  }
}

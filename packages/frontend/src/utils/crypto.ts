/**
 * Cryptographic utilities for securing sensitive data
 *
 * Provides encryption/decryption for storing sensitive data like auth tokens.
 * Uses AES-256 encryption with a configurable secret key.
 */

import CryptoJS from 'crypto-js';

/**
 * Get encryption key from environment or use a default
 *
 * WARNING: In production, ALWAYS use a strong, unique key from environment variables.
 * The default key should ONLY be used for local development.
 */
const getEncryptionKey = (): string => {
  // Try to get key from environment (Vite env variables)
  let envKey: string | undefined;

  // Try Vite env (works in browser/Vite context)
  if (typeof import.meta !== 'undefined' && import.meta && import.meta.env) {
    envKey = import.meta.env.VITE_ENCRYPTION_KEY;
  }

  // Try process.env (works in Node.js/test context)
  if (!envKey && typeof process !== 'undefined' && process && process.env) {
    envKey = process.env.VITE_ENCRYPTION_KEY;
  }

  if (envKey && envKey.length >= 32) {
    return envKey;
  }

  // Fallback: generate a device-specific key
  // This is better than a hardcoded key, but still not ideal for production
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'node';
  const language = typeof navigator !== 'undefined' ? navigator.language : 'en';
  const deviceKey = `alauncher-${userAgent}-${language}`;

  // In development, warn about using fallback key
  const isDev = typeof import.meta !== 'undefined' && import.meta && import.meta.env && import.meta.env.DEV;
  const isDevNode = typeof process !== 'undefined' && process && process.env && process.env.NODE_ENV === 'development';

  if (isDev || isDevNode) {
    console.warn(
      '[crypto] Using fallback encryption key. Set VITE_ENCRYPTION_KEY env var for production!'
    );
  }

  return deviceKey;
};

/**
 * Encrypt data using AES-256
 *
 * @param data - String data to encrypt
 * @returns Encrypted string (Base64 encoded)
 *
 * @example
 * ```ts
 * const encrypted = encrypt('my-secret-token');
 * // Returns: "U2FsdGVkX1..." (AES encrypted Base64)
 * ```
 */
export const encrypt = (data: string): string => {
  try {
    const key = getEncryptionKey();
    const encrypted = CryptoJS.AES.encrypt(data, key).toString();
    return encrypted;
  } catch (error) {
    console.error('[crypto] Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypt data using AES-256
 *
 * @param encryptedData - Encrypted string (Base64 encoded)
 * @returns Decrypted string
 * @throws Error if decryption fails
 *
 * @example
 * ```ts
 * const decrypted = decrypt('U2FsdGVkX1...');
 * // Returns: "my-secret-token"
 * ```
 */
export const decrypt = (encryptedData: string): string => {
  try {
    const key = getEncryptionKey();
    const bytes = CryptoJS.AES.decrypt(encryptedData, key);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);

    if (!decrypted) {
      throw new Error('Decryption failed: invalid data or key');
    }

    return decrypted;
  } catch (error) {
    console.error('[crypto] Decryption failed:', error);
    throw new Error('Failed to decrypt data');
  }
};

/**
 * Hash data using SHA-256 (one-way, for verification)
 *
 * @param data - String data to hash
 * @returns Hex-encoded hash string
 *
 * @example
 * ```ts
 * const hash = hashData('user-password');
 * // Returns: "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd..."
 * ```
 */
export const hashData = (data: string): string => {
  return CryptoJS.SHA256(data).toString();
};

/**
 * Generate a random string for tokens, nonces, etc.
 *
 * @param length - Length of random string (default: 32)
 * @returns Random hexadecimal string
 *
 * @example
 * ```ts
 * const token = generateRandomToken(16);
 * // Returns: "a1b2c3d4e5f6g7h8"
 * ```
 */
export const generateRandomToken = (length: number = 32): string => {
  return CryptoJS.lib.WordArray.random(length / 2).toString();
};

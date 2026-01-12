/**
 * UUID Helper Tests
 * Tests for secure UUID generation and validation
 */

import { UUIDHelper, UUIDError } from '../../index';

describe('UUIDHelper', () => {
  describe('toHash', () => {
    it('should convert UUID to hash (remove dashes)', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const hash = UUIDHelper.toHash(uuid);
      expect(hash).toBe('550e8400e29b41d4a716446655440000');
    });

    it('should throw error for invalid UUID format', () => {
      expect(() => UUIDHelper.toHash('invalid-uuid')).toThrow(UUIDError);
    });

    it('should throw error for empty string', () => {
      expect(() => UUIDHelper.toHash('')).toThrow();
    });

    it('should throw error for non-string input', () => {
      expect(() => UUIDHelper.toHash(null as any)).toThrow();
      expect(() => UUIDHelper.toHash(undefined as any)).toThrow();
      expect(() => UUIDHelper.toHash(123 as any)).toThrow();
    });
  });

  describe('fromHash', () => {
    it('should convert hash to UUID format', () => {
      const hash = '550e8400e29b41d4a716446655440000';
      const uuid = UUIDHelper.fromHash(hash);
      expect(uuid).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should throw error for invalid hash length', () => {
      expect(() => UUIDHelper.fromHash('tooshort')).toThrow(UUIDError);
      expect(() => UUIDHelper.fromHash('waytoolonghash12345678901234567890')).toThrow(UUIDError);
    });

    it('should throw error for non-hexadecimal characters', () => {
      expect(() => UUIDHelper.fromHash('ffffffffffffffffffffffffffffffffzz')).toThrow(UUIDError);
    });

    it('should throw error for empty string', () => {
      expect(() => UUIDHelper.fromHash('')).toThrow(UUIDError);
    });
  });

  describe('generateOffline', () => {
    it('should generate deterministic UUID for same username', () => {
      const uuid1 = UUIDHelper.generateOffline('player1');
      const uuid2 = UUIDHelper.generateOffline('player1');
      expect(uuid1).toBe(uuid2);
    });

    it('should generate different UUIDs for different usernames', () => {
      const uuid1 = UUIDHelper.generateOffline('player1');
      const uuid2 = UUIDHelper.generateOffline('player2');
      expect(uuid1).not.toBe(uuid2);
    });

    it('should throw error for empty username', () => {
      expect(() => UUIDHelper.generateOffline('')).toThrow();
    });

    it('should throw error for username shorter than 3 characters', () => {
      expect(() => UUIDHelper.generateOffline('ab')).toThrow();
    });

    it('should throw error for username longer than 16 characters', () => {
      expect(() => UUIDHelper.generateOffline('verylongusernamethatexceeds')).toThrow();
    });

    it('should throw error for username with only special characters', () => {
      expect(() => UUIDHelper.generateOffline('!!!')).toThrow();
    });

    it('should sanitize username (remove special chars)', () => {
      const uuid1 = UUIDHelper.generateOffline('player@name!');
      const uuid2 = UUIDHelper.generateOffline('playername');
      expect(uuid1).toBe(uuid2);
    });

    it('should generate valid UUID format', () => {
      const uuid = UUIDHelper.generateOffline('testuser');
      expect(UUIDHelper.isValidUUID(uuid)).toBe(true);
    });
  });

  describe('generateRandom', () => {
    it('should generate unique UUIDs', () => {
      const uuid1 = UUIDHelper.generateRandom();
      const uuid2 = UUIDHelper.generateRandom();
      expect(uuid1).not.toBe(uuid2);
    });

    it('should generate valid UUID format', () => {
      const uuid = UUIDHelper.generateRandom();
      expect(UUIDHelper.isValidUUID(uuid)).toBe(true);
    });

    it('should generate UUID v4 format (version starts with 4)', () => {
      const uuid = UUIDHelper.generateRandom();
      expect(uuid.split('-')[2]).toMatch(/^4/);
    });
  });

  describe('isValidUUID', () => {
    it('should return true for valid UUID v4', () => {
      expect(UUIDHelper.isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(UUIDHelper.isValidUUID('00000000-0000-4000-8000-000000000000')).toBe(true);
    });

    it('should return true for valid UUID v1-v5', () => {
      expect(UUIDHelper.isValidUUID('00000000-0000-1000-8000-000000000000')).toBe(true); // v1
      expect(UUIDHelper.isValidUUID('00000000-0000-2000-8000-000000000000')).toBe(true); // v2
      expect(UUIDHelper.isValidUUID('00000000-0000-3000-8000-000000000000')).toBe(true); // v3
      expect(UUIDHelper.isValidUUID('00000000-0000-5000-8000-000000000000')).toBe(true); // v5
    });

    it('should return false for invalid formats', () => {
      expect(UUIDHelper.isValidUUID('not-a-uuid')).toBe(false);
      expect(UUIDHelper.isValidUUID('550e8400-e29b-41d4-a716-44665544000')).toBe(false); // Missing digit
      expect(UUIDHelper.isValidUUID('')).toBe(false);
      expect(UUIDHelper.isValidUUID('g50e8400-e29b-41d4-a716-446655440000')).toBe(false); // Invalid hex
    });

    it('should return false for non-string input', () => {
      expect(UUIDHelper.isValidUUID(null as any)).toBe(false);
      expect(UUIDHelper.isValidUUID(undefined as any)).toBe(false);
      expect(UUIDHelper.isValidUUID(123 as any)).toBe(false);
    });
  });
});

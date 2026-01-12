/**
 * Version Comparator Tests
 * Tests for semantic version comparison with validation
 */

import { VersionComparator, VersionParseError } from '../../index';

describe('VersionComparator', () => {
  describe('compare', () => {
    it('should return 1 when v1 > v2', () => {
      expect(VersionComparator.compare('2.0.0', '1.0.0')).toBe(1);
      expect(VersionComparator.compare('1.10.0', '1.9.0')).toBe(1);
      expect(VersionComparator.compare('1.0.1', '1.0.0')).toBe(1);
    });

    it('should return -1 when v1 < v2', () => {
      expect(VersionComparator.compare('1.0.0', '2.0.0')).toBe(-1);
      expect(VersionComparator.compare('1.9.0', '1.10.0')).toBe(-1);
      expect(VersionComparator.compare('1.0.0', '1.0.1')).toBe(-1);
    });

    it('should return 0 for equal versions', () => {
      expect(VersionComparator.compare('1.0.0', '1.0.0')).toBe(0);
      expect(VersionComparator.compare('2.5.10', '2.5.10')).toBe(0);
    });

    it('should handle versions with different lengths', () => {
      expect(VersionComparator.compare('1.0', '1.0.0')).toBe(0);
      expect(VersionComparator.compare('1', '1.0.0')).toBe(0);
      expect(VersionComparator.compare('1.0', '1.0.1')).toBe(-1);
      expect(VersionComparator.compare('1.0.1', '1.0')).toBe(1);
    });

    it('should handle v prefix', () => {
      expect(VersionComparator.compare('v1.0.0', '1.0.0')).toBe(0);
      expect(VersionComparator.compare('V2.0.0', 'v1.0.0')).toBe(1);
      expect(VersionComparator.compare('1.0.0', 'v2.0.0')).toBe(-1);
    });

    it('should throw error for invalid version format', () => {
      expect(() => VersionComparator.compare('invalid', '1.0.0')).toThrow(VersionParseError);
      expect(() => VersionComparator.compare('1.0.0', 'invalid')).toThrow(VersionParseError);
      expect(() => VersionComparator.compare('1.x.0', '1.0.0')).toThrow(VersionParseError);
      expect(() => VersionComparator.compare('1.0.x', '1.0.0')).toThrow(VersionParseError);
    });

    it('should throw error for non-string input', () => {
      expect(() => VersionComparator.compare(null as any, '1.0.0')).toThrow();
      expect(() => VersionComparator.compare('1.0.0', undefined as any)).toThrow();
      expect(() => VersionComparator.compare(123 as any, '1.0.0')).toThrow();
    });

    it('should throw error for empty string', () => {
      expect(() => VersionComparator.compare('', '1.0.0')).toThrow();
      expect(() => VersionComparator.compare('1.0.0', '')).toThrow();
    });
  });

  describe('isAtLeast', () => {
    it('should return true for equal versions', () => {
      expect(VersionComparator.isAtLeast('1.0.0', '1.0.0')).toBe(true);
    });

    it('should return true for greater versions', () => {
      expect(VersionComparator.isAtLeast('2.0.0', '1.0.0')).toBe(true);
      expect(VersionComparator.isAtLeast('1.10.0', '1.9.0')).toBe(true);
      expect(VersionComparator.isAtLeast('1.0.1', '1.0.0')).toBe(true);
    });

    it('should return false for lesser versions', () => {
      expect(VersionComparator.isAtLeast('1.0.0', '2.0.0')).toBe(false);
      expect(VersionComparator.isAtLeast('1.9.0', '1.10.0')).toBe(false);
    });

    it('should return false for invalid versions', () => {
      expect(VersionComparator.isAtLeast('invalid', '1.0.0')).toBe(false);
      expect(VersionComparator.isAtLeast('1.0.0', 'invalid')).toBe(false);
    });
  });

  describe('isValidFormat', () => {
    it('should return true for valid formats', () => {
      expect(VersionComparator.isValidFormat('1')).toBe(true);
      expect(VersionComparator.isValidFormat('1.2')).toBe(true);
      expect(VersionComparator.isValidFormat('1.2.3')).toBe(true);
      expect(VersionComparator.isValidFormat('10.20.30')).toBe(true);
    });

    it('should return true for v prefix', () => {
      expect(VersionComparator.isValidFormat('v1.0.0')).toBe(true);
      expect(VersionComparator.isValidFormat('V2.5.10')).toBe(true);
    });

    it('should return false for invalid formats', () => {
      expect(VersionComparator.isValidFormat('1.2.3.4')).toBe(false);
      expect(VersionComparator.isValidFormat('invalid')).toBe(false);
      expect(VersionComparator.isValidFormat('1.x')).toBe(false);
      expect(VersionComparator.isValidFormat('')).toBe(false);
    });

    it('should return false for non-string input', () => {
      expect(VersionComparator.isValidFormat(null as any)).toBe(false);
      expect(VersionComparator.isValidFormat(undefined as any)).toBe(false);
      expect(VersionComparator.isValidFormat(123 as any)).toBe(false);
    });
  });
});

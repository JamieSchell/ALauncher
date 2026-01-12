/**
 * Security Helper Tests
 * Tests for JWT validation, username sanitization, and XSS prevention
 */

import { SecurityHelper } from '../../index';

describe('SecurityHelper', () => {
  describe('isValidToken', () => {
    // Valid JWT for testing (header.payload.signature format)
    const validJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
                     'eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.' +
                     'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

    it('should return true for valid JWT format', () => {
      expect(SecurityHelper.isValidToken(validJWT)).toBe(true);
    });

    it('should return false for tokens with wrong number of parts', () => {
      expect(SecurityHelper.isValidToken('a.b')).toBe(false);
      expect(SecurityHelper.isValidToken('a.b.c.d')).toBe(false);
      expect(SecurityHelper.isValidToken('single')).toBe(false);
    });

    it('should return false for tokens with invalid base64', () => {
      expect(SecurityHelper.isValidToken('a!@b.c@d')).toBe(false);
      expect(SecurityHelper.isValidToken('a b.c')).toBe(false);
    });

    it('should return false for tokens that are too short', () => {
      expect(SecurityHelper.isValidToken('a.bc')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(SecurityHelper.isValidToken('')).toBe(false);
    });

    it('should return false for non-string input', () => {
      expect(SecurityHelper.isValidToken(null as any)).toBe(false);
      expect(SecurityHelper.isValidToken(undefined as any)).toBe(false);
      expect(SecurityHelper.isValidToken(123 as any)).toBe(false);
    });

    it('should return false for expired tokens', () => {
      // JWT with exp claim in the past
      const expiredJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
                        'eyJleHAiOjEwMDAwMDAwMDB9.' +
                        'invalid-signature';
      expect(SecurityHelper.isValidToken(expiredJWT)).toBe(false);
    });
  });

  describe('sanitizeUsername', () => {
    it('should remove special characters', () => {
      expect(SecurityHelper.sanitizeUsername('user@name!')).toBe('username');
      expect(SecurityHelper.sanitizeUsername('user-name-123')).toBe('username123');
      expect(SecurityHelper.sanitizeUsername('user.name')).toBe('username');
    });

    it('should keep only alphanumeric and underscore', () => {
      expect(SecurityHelper.sanitizeUsername('user_name123')).toBe('user_name123');
      expect(SecurityHelper.sanitizeUsername('USER_NAME')).toBe('USER_NAME');
    });

    it('should truncate to 16 characters', () => {
      expect(SecurityHelper.sanitizeUsername('verylongusernamethatexceeds')).toBe('verylongusername');
    });

    it('should return empty string for only special characters', () => {
      expect(SecurityHelper.sanitizeUsername('!!!')).toBe('');
    });

    it('should throw error for non-string input', () => {
      expect(() => SecurityHelper.sanitizeUsername(null as any)).toThrow();
      expect(() => SecurityHelper.sanitizeUsername(undefined as any)).toThrow();
    });
  });

  describe('isValidUsername', () => {
    it('should return true for valid usernames', () => {
      expect(SecurityHelper.isValidUsername('user')).toBe(true);
      expect(SecurityHelper.isValidUsername('user123')).toBe(true);
      expect(SecurityHelper.isValidUsername('user_name')).toBe(true);
      expect(SecurityHelper.isValidUsername('UserName')).toBe(true);
      expect(SecurityHelper.isValidUsername('123')).toBe(true);
    });

    it('should return true for 16 character username', () => {
      expect(SecurityHelper.isValidUsername('user123456789012')).toBe(true);
    });

    it('should return true for 3 character username', () => {
      expect(SecurityHelper.isValidUsername('usr')).toBe(true);
    });

    it('should return false for too short usernames', () => {
      expect(SecurityHelper.isValidUsername('us')).toBe(false);
      expect(SecurityHelper.isValidUsername('u')).toBe(false);
      expect(SecurityHelper.isValidUsername('')).toBe(false);
    });

    it('should return false for too long usernames', () => {
      expect(SecurityHelper.isValidUsername('user1234567890123')).toBe(false);
    });

    it('should return false for usernames with special characters', () => {
      expect(SecurityHelper.isValidUsername('user@name')).toBe(false);
      expect(SecurityHelper.isValidUsername('user-name')).toBe(false);
      expect(SecurityHelper.isValidUsername('user.name')).toBe(false);
      expect(SecurityHelper.isValidUsername('user name')).toBe(false);
    });

    it('should return false for non-string input', () => {
      expect(SecurityHelper.isValidUsername(null as any)).toBe(false);
      expect(SecurityHelper.isValidUsername(undefined as any)).toBe(false);
      expect(SecurityHelper.isValidUsername(123 as any)).toBe(false);
    });
  });

  describe('sanitizeEmail', () => {
    it('should return lowercase email for valid email', () => {
      expect(SecurityHelper.sanitizeEmail('User@Example.COM')).toBe('user@example.com');
      expect(SecurityHelper.sanitizeEmail('test@example.com')).toBe('test@example.com');
    });

    it('should trim whitespace', () => {
      expect(SecurityHelper.sanitizeEmail('  test@example.com  ')).toBe('test@example.com');
    });

    it('should return null for invalid email', () => {
      expect(SecurityHelper.sanitizeEmail('invalid')).toBe(null);
      expect(SecurityHelper.sanitizeEmail('test@')).toBe(null);
      expect(SecurityHelper.sanitizeEmail('@example.com')).toBe(null);
      expect(SecurityHelper.sanitizeEmail('test@')).toBe(null);
    });

    it('should return null for non-string input', () => {
      expect(SecurityHelper.sanitizeEmail(null as any)).toBe(null);
      expect(SecurityHelper.sanitizeEmail(undefined as any)).toBe(null);
      expect(SecurityHelper.sanitizeEmail(123 as any)).toBe(null);
    });
  });

  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      expect(SecurityHelper.escapeHtml('<div>')).toBe('&lt;div&gt;');
      expect(SecurityHelper.escapeHtml('&nbsp;')).toBe('&amp;nbsp;');
      expect(SecurityHelper.escapeHtml('"quoted"')).toBe('&quot;quoted&quot;');
      expect(SecurityHelper.escapeHtml("'apostrophe'")).toBe('&#039;apostrophe&#039;');
      expect(SecurityHelper.escapeHtml('<script>')).toBe('&lt;script&gt;');
    });

    it('should escape all dangerous characters in string', () => {
      expect(SecurityHelper.escapeHtml('<script>alert("XSS")</script>'))
        .toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');
    });

    it('should handle empty string', () => {
      expect(SecurityHelper.escapeHtml('')).toBe('');
    });

    it('should handle strings without special characters', () => {
      expect(SecurityHelper.escapeHtml('normal text')).toBe('normal text');
    });

    it('should throw error for non-string input', () => {
      expect(() => SecurityHelper.escapeHtml(null as any)).toThrow();
      expect(() => SecurityHelper.escapeHtml(undefined as any)).toThrow();
    });
  });
});

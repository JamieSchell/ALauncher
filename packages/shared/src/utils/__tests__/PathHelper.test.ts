/**
 * Path Helper Tests
 * Tests for path manipulation and security protections
 */

import { PathHelper, PathError } from '../../index';

describe('PathHelper', () => {
  describe('normalize', () => {
    it('should convert backslashes to forward slashes', () => {
      expect(PathHelper.normalize('C:\\Users\\test')).toBe('C:/Users/test');
      expect(PathHelper.normalize('path\\to\\file')).toBe('path/to/file');
    });

    it('should handle forward slashes correctly', () => {
      expect(PathHelper.normalize('path/to/file')).toBe('path/to/file');
    });

    it('should throw error for non-string input', () => {
      expect(() => PathHelper.normalize(null as any)).toThrow(PathError);
      expect(() => PathHelper.normalize(undefined as any)).toThrow(PathError);
    });
  });

  describe('join', () => {
    it('should join path segments correctly', () => {
      expect(PathHelper.join('uploads', 'files', 'doc.pdf')).toBe('uploads/files/doc.pdf');
    });

    it('should trim leading/trailing slashes', () => {
      expect(PathHelper.join('/uploads/', '/files/', '/doc.pdf')).toBe('uploads/files/doc.pdf');
    });

    it('should handle Windows backslashes', () => {
      expect(PathHelper.join('uploads\\', 'files')).toBe('uploads/files');
    });

    it('should filter empty segments', () => {
      expect(PathHelper.join('uploads', '', 'files')).toBe('uploads/files');
    });

    it('should throw error for path traversal with ../', () => {
      expect(() => PathHelper.join('uploads', '../etc/passwd')).toThrow(PathError);
      expect(() => PathHelper.join('../..', 'etc')).toThrow(PathError);
    });

    it('should throw error for path traversal with ..\\', () => {
      expect(() => PathHelper.join('uploads', '..\\..\\etc')).toThrow(PathError);
    });

    it('should throw error for encoded path traversal', () => {
      expect(() => PathHelper.join('uploads', '%2e%2e', 'passwd')).toThrow(PathError);
      expect(() => PathHelper.join('uploads', '%252e%252e')).toThrow(PathError);
    });

    it('should throw error for null bytes', () => {
      expect(() => PathHelper.join('uploads', 'file\x00.pdf')).toThrow(PathError);
    });

    it('should throw error for empty segments', () => {
      // When all segments are empty, should throw error
      expect(() => PathHelper.join('', '', '')).toThrow(PathError);
    });

    it('should throw error when result starts with ..', () => {
      expect(() => PathHelper.join('..', 'uploads')).toThrow(PathError);
    });

    it('should throw error for non-string segments', () => {
      expect(() => PathHelper.join(null as any, 'path')).toThrow(PathError);
      expect(() => PathHelper.join('uploads', 123 as any)).toThrow(PathError);
    });

    it('should throw error for empty path list', () => {
      expect(() => PathHelper.join()).toThrow(PathError);
    });
  });

  describe('joinSafe', () => {
    it('should join paths safely with base directory', () => {
      expect(PathHelper.joinSafe('/var/www', 'uploads', 'file.txt')).toBe('/var/www/uploads/file.txt');
    });

    it('should throw error for absolute paths in segments', () => {
      expect(() => PathHelper.joinSafe('/var/www', '/etc/passwd')).toThrow(PathError);
      expect(() => PathHelper.joinSafe('C:\\www', '\\windows')).toThrow(PathError);
    });

    it('should throw error for empty base path', () => {
      expect(() => PathHelper.joinSafe('', 'path')).toThrow(PathError);
    });
  });

  describe('getExtension', () => {
    it('should return lowercase extension without dot', () => {
      expect(PathHelper.getExtension('file.pdf')).toBe('pdf');
      expect(PathHelper.getExtension('document.PDF')).toBe('pdf');
      expect(PathHelper.getExtension('archive.tar.gz')).toBe('gz');
    });

    it('should return empty string for files without extension', () => {
      expect(PathHelper.getExtension('filename')).toBe('');
      expect(PathHelper.getExtension('path/to/file')).toBe('');
    });

    it('should throw error for non-string input', () => {
      expect(() => PathHelper.getExtension(null as any)).toThrow();
    });
  });

  describe('hasExtension', () => {
    it('should return true for matching extension', () => {
      expect(PathHelper.hasExtension('file.pdf', 'pdf')).toBe(true);
      expect(PathHelper.hasExtension('file.pdf', '.pdf')).toBe(true);
      expect(PathHelper.hasExtension('file.PDF', 'pdf')).toBe(true);
    });

    it('should return false for non-matching extension', () => {
      expect(PathHelper.hasExtension('file.pdf', 'txt')).toBe(false);
      expect(PathHelper.hasExtension('file.txt', 'pdf')).toBe(false);
    });

    it('should return false for files without extension', () => {
      expect(PathHelper.hasExtension('filename', 'pdf')).toBe(false);
    });

    it('should throw error for non-string input', () => {
      expect(() => PathHelper.hasExtension(null as any, 'pdf')).toThrow();
      expect(() => PathHelper.hasExtension('file.pdf', null as any)).toThrow();
    });
  });

  describe('isSafe', () => {
    it('should return true for safe paths', () => {
      expect(PathHelper.isSafe('uploads/file.pdf')).toBe(true);
      expect(PathHelper.isSafe('path/to/file')).toBe(true);
      expect(PathHelper.isSafe('a/b/c/d/e')).toBe(true);
    });

    it('should return false for unsafe paths', () => {
      expect(PathHelper.isSafe('uploads/../etc/passwd')).toBe(false);
      expect(PathHelper.isSafe('../file')).toBe(false);
      expect(PathHelper.isSafe('path\x00file')).toBe(false);
    });

    it('should return false for path traversal attempts', () => {
      expect(PathHelper.isSafe('..')).toBe(false);
      expect(PathHelper.isSafe('uploads/../../etc')).toBe(false);
    });
  });
});

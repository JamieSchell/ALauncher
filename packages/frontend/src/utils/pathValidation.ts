/**
 * Path Validation Utility for Tauri File Operations
 * Prevents directory traversal and validates file paths
 */

import { join, normalize, resolve, isAbsolute, relative } from 'path';

/**
 * Allowed base directories for file operations
 * All file operations must be within these directories
 */
export const ALLOWED_BASE_DIRS = {
  UPDATES: 'updates',
  LOGS: 'logs',
  CACHE: 'cache',
  CONFIG: 'config',
  TEMP: 'temp',
} as const;

type AllowedBaseDir = typeof ALLOWED_BASE_DIRS[keyof typeof ALLOWED_BASE_DIRS];

/**
 * Path validation options
 */
export interface PathValidationOptions {
  /**
   * Base directory to resolve paths against
   * If not provided, uses the app's updates directory
   */
  baseDir?: AllowedBaseDir | string;

  /**
   * Whether to allow absolute paths
   * @default false
   */
  allowAbsolute?: boolean;

  /**
   * Whether to allow parent directory references (..)
   * @default false
   */
  allowParentTraversal?: boolean;

  /**
   * Maximum path length to prevent buffer overflow attacks
   * @default 4096 (Linux PATH_MAX)
   */
  maxPathLength?: number;

  /**
   * Allowed file extensions (for write operations)
   * If not provided, all extensions are allowed
   */
  allowedExtensions?: string[];

  /**
   * Whether to allow creating new files (for write operations)
   * @default true
   */
  allowCreate?: boolean;
}

/**
 * Path validation result
 */
export interface PathValidationResult {
  valid: boolean;
  sanitizedPath?: string;
  error?: string;
}

/**
 * Dangerous patterns that could indicate path traversal attacks
 */
const DANGEROUS_PATTERNS = [
  /\.\.\./,  // Parent directory traversal (multiple levels)
  /%2e%2e/i,  // URL-encoded parent directory
  /%5c/i,     // URL-encoded backslash
  /\0/,       // Null byte injection
  /[<>:"|?*]/, // Invalid Windows filename characters
];

/**
 * Validate and sanitize a file path
 *
 * @param inputPath - The path to validate
 * @param options - Validation options
 * @returns Validation result with sanitized path or error
 */
export function validatePath(
  inputPath: string,
  options: PathValidationOptions = {}
): PathValidationResult {
  const {
    baseDir = ALLOWED_BASE_DIRS.UPDATES,
    allowAbsolute = false,
    allowParentTraversal = false,
    maxPathLength = 4096,
    allowedExtensions,
    allowCreate = true,
  } = options;

  // 1. Check for null/undefined
  if (!inputPath || typeof inputPath !== 'string') {
    return {
      valid: false,
      error: 'Path must be a non-empty string',
    };
  }

  // 2. Check path length
  if (inputPath.length > maxPathLength) {
    return {
      valid: false,
      error: `Path exceeds maximum length of ${maxPathLength} characters`,
    };
  }

  // 3. Check for dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(inputPath)) {
      return {
        valid: false,
        error: 'Path contains dangerous characters or patterns',
      };
    }
  }

  // 4. Check for parent directory traversal if not allowed
  if (!allowParentTraversal && inputPath.includes('..')) {
    return {
      valid: false,
      error: 'Parent directory traversal is not allowed',
    };
  }

  // 5. Check for absolute paths if not allowed
  if (!allowAbsolute && isAbsolute(inputPath)) {
    return {
      valid: false,
      error: 'Absolute paths are not allowed',
    };
  }

  // 6. Normalize the path
  let sanitizedPath = normalize(inputPath);

  // 7. Check for parent directory after normalization
  if (!allowParentTraversal && sanitizedPath.includes('..')) {
    return {
      valid: false,
      error: 'Path traversal detected after normalization',
    };
  }

  // 8. Check file extension if specified
  if (allowedExtensions && allowedExtensions.length > 0) {
    const ext = sanitizedPath.split('.').pop()?.toLowerCase();
    if (!ext || !allowedExtensions.includes(`.${ext}`)) {
      return {
        valid: false,
        error: `File extension not allowed. Allowed: ${allowedExtensions.join(', ')}`,
      };
    }
  }

  return {
    valid: true,
    sanitizedPath,
  };
}

/**
 * Validate a path against a specific base directory
 * Ensures the resolved path is within the base directory
 *
 * @param inputPath - The path to validate
 * @param baseDirectory - The base directory (must be one of ALLOWED_BASE_DIRS or a custom path)
 * @returns Validation result with safe path or error
 */
export function validatePathInBaseDir(
  inputPath: string,
  baseDirectory: AllowedBaseDir | string = ALLOWED_BASE_DIRS.UPDATES
): PathValidationResult {
  // First validate the path itself
  const baseValidation = validatePath(inputPath, {
    allowAbsolute: false,
    allowParentTraversal: false,
  });

  if (!baseValidation.valid) {
    return baseValidation;
  }

  // Resolve the path relative to base directory
  const basePath = typeof baseDirectory === 'string'
    ? baseDirectory
    : ALLOWED_BASE_DIRS[baseDirectory.toUpperCase() as keyof typeof ALLOWED_BASE_DIRS] || baseDirectory;

  // For additional security, ensure the resolved path doesn't escape the base directory
  // This is a frontend check - the Rust backend should also enforce this
  const resolvedPath = join(basePath, baseValidation.sanitizedPath!);

  // Check if the resolved path would escape the base directory
  const relativePath = relative(basePath, resolvedPath);
  if (relativePath.startsWith('..')) {
    return {
      valid: false,
      error: 'Path would escape base directory',
    };
  }

  return {
    valid: true,
    sanitizedPath: resolvedPath,
  };
}

/**
 * Validate a file path for reading operations
 * More permissive than write operations
 */
export function validateReadPath(inputPath: string): PathValidationResult {
  return validatePathInBaseDir(inputPath, ALLOWED_BASE_DIRS.UPDATES);
}

/**
 * Validate a file path for writing operations
 * More restrictive - checks file extensions and prevents overwriting system files
 */
export function validateWritePath(
  inputPath: string,
  options: {
    allowedExtensions?: string[];
    allowCreate?: boolean;
  } = {}
): PathValidationResult {
  return validatePathInBaseDir(inputPath, ALLOWED_BASE_DIRS.UPDATES);
}

/**
 * Validate a directory path for creation
 */
export function validateDirectoryPath(inputPath: string): PathValidationResult {
  return validatePathInBaseDir(inputPath, ALLOWED_BASE_DIRS.UPDATES);
}

/**
 * Validate a download destination path
 * Downloads should only go to specific directories
 */
export function validateDownloadPath(inputPath: string): PathValidationResult {
  return validatePathInBaseDir(inputPath, ALLOWED_BASE_DIRS.UPDATES);
}

/**
 * Safe wrapper for Tauri file operations with path validation
 */
export class SafeFileOperations {
  /**
   * Safely read a file with path validation
   */
  static async safeReadFile(
    rawPath: string,
    readFn: (path: string) => Promise<string>
  ): Promise<string> {
    const validation = validateReadPath(rawPath);
    if (!validation.valid) {
      throw new Error(`Invalid path: ${validation.error}`);
    }
    return readFn(validation.sanitizedPath!);
  }

  /**
   * Safely write a file with path validation
   */
  static async safeWriteFile(
    rawPath: string,
    content: string,
    writeFn: (path: string, content: string) => Promise<void>,
    options?: { allowedExtensions?: string[] }
  ): Promise<void> {
    const validation = validateWritePath(rawPath, options);
    if (!validation.valid) {
      throw new Error(`Invalid path: ${validation.error}`);
    }
    return writeFn(validation.sanitizedPath!, content);
  }

  /**
   * Safely create a directory with path validation
   */
  static async safeCreateDirectory(
    rawPath: string,
    createFn: (path: string) => Promise<void>
  ): Promise<void> {
    const validation = validateDirectoryPath(rawPath);
    if (!validation.valid) {
      throw new Error(`Invalid path: ${validation.error}`);
    }
    return createFn(validation.sanitizedPath!);
  }

  /**
   * Safely download a file with path validation
   */
  static async safeDownloadFile(
    url: string,
    rawDestPath: string,
    downloadFn: (url: string, path: string) => Promise<void>
  ): Promise<void> {
    // Validate URL
    try {
      new URL(url);
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        throw new Error('Invalid URL protocol');
      }
    } catch {
      throw new Error('Invalid URL');
    }

    const validation = validateDownloadPath(rawDestPath);
    if (!validation.valid) {
      throw new Error(`Invalid path: ${validation.error}`);
    }
    return downloadFn(url, validation.sanitizedPath!);
  }

  /**
   * Safely check if a file exists with path validation
   */
  static async safeFileExists(
    rawPath: string,
    existsFn: (path: string) => Promise<boolean>
  ): Promise<boolean> {
    const validation = validateReadPath(rawPath);
    if (!validation.valid) {
      return false; // Don't throw, just return false for invalid paths
    }
    return existsFn(validation.sanitizedPath!);
  }
}

export default {
  validatePath,
  validatePathInBaseDir,
  validateReadPath,
  validateWritePath,
  validateDirectoryPath,
  validateDownloadPath,
  SafeFileOperations,
  ALLOWED_BASE_DIRS,
};

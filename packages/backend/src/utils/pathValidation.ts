/**
 * Path Validation Utility
 * Защита от Directory Traversal атак
 */

import path from 'path';
import fs from 'fs';

/**
 * Ошибка валидации пути
 */
export class PathValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PathValidationError';
  }
}

/**
 * Валидация пользовательского пути для защиты от directory traversal
 *
 * @param userPath - Путь предоставленный пользователем
 * @param allowedDir - Разрешённая базовая директория
 * @returns Санитизированный путь
 * @throws {PathValidationError} Если путь небезопасен
 */
export function validatePath(userPath: string, allowedDir: string): string {
  // Удаляем null characters
  const sanitized = userPath.replace(/\0/g, '');

  // Проверяем на пустой путь
  if (!sanitized || sanitized.trim() === '') {
    throw new PathValidationError('Path cannot be empty');
  }

  // Нормализуем путь
  const normalized = path.normalize(sanitized);

  // Проверяем на directory traversal
  if (normalized.includes('..')) {
    throw new PathValidationError(
      'Directory traversal detected: ".." sequences are not allowed'
    );
  }

  // Проверяем на абсолютные пути (за исключением случая когда разрешённая директория абсолютная)
  const resolvedPath = path.resolve(allowedDir, normalized);
  const resolvedAllowedDir = path.resolve(allowedDir);

  // Убеждаемся что результирующий путь находится внутри разрешённой директории
  if (!resolvedPath.startsWith(resolvedAllowedDir)) {
    throw new PathValidationError(
      `Path validation failed: resolved path is outside allowed directory`
    );
  }

  return normalized;
}

/**
 * Валидация имени файла/директории
 * Разрешает только алфавитно-цифровые символы, дефисы и подчёркивания
 *
 * @param name - Имя файла или директории
 * @returns Валидное имя
 * @throws {PathValidationError} Если имя содержит недопустимые символы
 */
export function validateFilename(name: string): string {
  // Удаляем null characters
  const sanitized = name.replace(/\0/g, '');

  // Проверяем на пустое имя
  if (!sanitized || sanitized.trim() === '') {
    throw new PathValidationError('Filename cannot be empty');
  }

  // Проверяем длину
  if (sanitized.length > 255) {
    throw new PathValidationError('Filename too long (max 255 characters)');
  }

  // Разрешаем только alphanumeric, hyphens, underscores, и точки
  const validPattern = /^[a-zA-Z0-9._-]+$/;

  if (!validPattern.test(sanitized)) {
    throw new PathValidationError(
      'Invalid filename: only alphanumeric characters, hyphens, underscores, and dots are allowed'
    );
  }

  // Проверяем что имя не начинается с точки (скрытые файлы)
  if (sanitized.startsWith('.')) {
    throw new PathValidationError('Hidden files (starting with dot) are not allowed');
  }

  // Проверяем на специальные имена
  const reservedNames = [
    'CON', 'PRN', 'AUX', 'NUL',
    'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
    'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
  ];

  const baseName = path.basename(sanitized, path.extname(sanitized)).toUpperCase();
  if (reservedNames.includes(baseName)) {
    throw new PathValidationError('Reserved filename detected');
  }

  return sanitized;
}

/**
 * Безопасное соединение путей
 *
 * @param allowedDir - Разрешённая базовая директория
 * @param parts - Части пути
 * @returns Полный валидный путь
 * @throws {PathValidationError} Если путь небезопасен
 */
export function safePathJoin(allowedDir: string, ...parts: string[]): string {
  // Валидируем каждую часть пути
  const validatedParts = parts.map(part => {
    try {
      return validateFilename(part);
    } catch {
      // Если не является filename, пробуем validatePath
      return validatePath(part, allowedDir);
    }
  });

  // Соединяем части
  const fullPath = path.join(allowedDir, ...validatedParts);

  // Финальная проверка
  const resolvedPath = path.resolve(fullPath);
  const resolvedAllowedDir = path.resolve(allowedDir);

  if (!resolvedPath.startsWith(resolvedAllowedDir)) {
    throw new PathValidationError('Final path validation failed');
  }

  return fullPath;
}

/**
 * Проверка что путь существует и является директорией
 *
 * @param dirPath - Путь к директории
 * @returns true если директория существует
 */
export function ensureDirectoryExists(dirPath: string): boolean {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    return true;
  } catch (error) {
    throw new PathValidationError(`Failed to create directory: ${dirPath}`);
  }
}

/**
 * Безопасное чтение файла
 *
 * @param filePath - Путь к файлу
 * @param allowedDir - Разрешённая директория
 * @returns Содержимое файла
 * @throws {PathValidationError} Если путь небезопасен
 */
export function safeReadFile(filePath: string, allowedDir: string): Buffer {
  const validatedPath = validatePath(filePath, allowedDir);
  const fullPath = path.join(allowedDir, validatedPath);

  const resolvedPath = path.resolve(fullPath);
  const resolvedAllowedDir = path.resolve(allowedDir);

  if (!resolvedPath.startsWith(resolvedAllowedDir)) {
    throw new PathValidationError('File path validation failed');
  }

  return fs.readFileSync(resolvedPath);
}

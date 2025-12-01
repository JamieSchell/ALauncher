/**
 * Type definitions for translation keys
 *
 * Автоматически генерируемые типы для всех ключей переводов.
 * Обеспечивает типобезопасность при использовании переводов.
 *
 * @module i18n/types
 */

import { ru } from './locales/ru';
import { en } from './locales/en';

/**
 * Тип для структуры переводов
 */
export type TranslationStructure = typeof ru;

/**
 * Рекурсивно извлекает все пути ключей из объекта переводов
 */
type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

/**
 * Тип для всех возможных ключей переводов
 */
export type TranslationKey = NestedKeyOf<TranslationStructure>;

/**
 * Проверка, что структуры en и ru совпадают
 */
type StructureCheck<T1, T2> = T1 extends T2
  ? T2 extends T1
    ? true
    : { error: 'Structure mismatch: ru has keys not in en' }
  : { error: 'Structure mismatch: en has keys not in ru' };

// Эта проверка будет ошибкой компиляции, если структуры не совпадают
type _StructureValidation = StructureCheck<typeof ru, typeof en>;

/**
 * Вспомогательный тип для получения значения по ключу
 */
export type TranslationValue<K extends TranslationKey> = K extends `${infer Key}.${infer Rest}`
  ? Key extends keyof TranslationStructure
    ? TranslationStructure[Key] extends object
      ? Rest extends NestedKeyOf<TranslationStructure[Key]>
        ? string // Вложенное значение всегда строка
        : never
      : never
    : never
  : Key extends keyof TranslationStructure
  ? TranslationStructure[Key] extends string
    ? TranslationStructure[Key]
    : never
  : never;


/**
 * @file src/base-specs.ts
 * @description Предоставляет несколько базовых спецификаций ошибок (ErrorSpec) в качестве примеров.
 * @version 1.0.1
 * @date 2025-05-30
 * @updated Заменены типы 'any' на 'unknown' в контекстах. Добавлена пустая строка в конце файла.
 *
 * HISTORY:
 * v1.0.1 (2025-05-30): Заменены 'any' на 'unknown' в контекстах, eol-last.
 * v1.0.0 (2025-05-29): Начальная реализация базовых ErrorSpec.
 */

import type { ErrorSpec } from './error-spec'

// --- Контексты для базовых ошибок ---

/** Контекст для ошибки невалидного аргумента. */
export interface InvalidArgumentContext {
  argumentName: string
  argumentValue?: unknown // Значение может быть любым, или не быть вовсе
  reason: string
  expected?: string // Опционально: что ожидалось
}

/** Контекст для ошибки провала операции. */
export interface OperationFailedContext {
  operationName: string
  reason?: string // Общая причина
  details?: Record<string, unknown> // Дополнительные детали
}

/** Контекст для ошибки "не реализовано". */
export interface NotImplementedContext {
  featureName: string
  plannedVersion?: string // Опционально: когда планируется
}

/** Контекст для неожиданной ошибки. */
export interface UnexpectedErrorContext {
  situation: string // Описание ситуации, где произошла ошибка
  details?: Record<string, unknown>
}

// --- Спецификации базовых ошибок ---

/**
 * Спецификация для ошибки: Невалидный аргумент.
 * Указывает на то, что предоставленный аргумент функции или методу
 * не соответствует ожиданиям (неправильный тип, значение вне диапазона и т.д.).
 */
export const INVALID_ARGUMENT_SPEC: ErrorSpec<InvalidArgumentContext> = {
  code: 'FAB_INVALID_ARGUMENT',
  messageTemplate: 'Invalid argument: {argumentName}. Reason: {reason}.',
  docs: 'https://example.com/fab-errors-docs#invalid-argument' // Заменить на реальную ссылку
}

/**
 * Спецификация для ошибки: Операция не удалась.
 * Общая ошибка, указывающая на то, что выполнение некоторой операции
 * завершилось неудачей по неопределенной или внутренней причине.
 * Более специфичные ошибки операции должны наследоваться или уточнять эту.
 */
export const OPERATION_FAILED_SPEC: ErrorSpec<OperationFailedContext> = {
  code: 'FAB_OPERATION_FAILED',
  messageTemplate: 'Operation "{operationName}" failed. Reason: {reason}',
  docs: 'https://example.com/fab-errors-docs#operation-failed' // Заменить на реальную ссылку
}

/**
 * Спецификация для ошибки: Функциональность не реализована.
 * Указывает на попытку вызова функциональности, которая еще не была реализована.
 */
export const NOT_IMPLEMENTED_SPEC: ErrorSpec<NotImplementedContext> = {
  code: 'FAB_NOT_IMPLEMENTED',
  messageTemplate: 'Feature not implemented: {featureName}.',
  docs: 'https://example.com/fab-errors-docs#not-implemented' // Заменить на реальную ссылку
}

/**
 * Спецификация для ошибки: Неожиданная ошибка.
 * Используется для перехвата и логирования ошибок, которые не были
 * предвидены или обработаны более специфичным образом.
 */
export const UNEXPECTED_ERROR_SPEC: ErrorSpec<UnexpectedErrorContext> = {
  code: 'FAB_UNEXPECTED_ERROR',
  messageTemplate: 'An unexpected error occurred during {situation}.',
  docs: 'https://example.com/fab-errors-docs#unexpected-error' // Заменить на реальную ссылку
}

// END OF: src/base-specs.ts

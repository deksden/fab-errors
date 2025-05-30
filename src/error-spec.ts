/**
 * @file src/error-spec.ts
 * @description Определяет интерфейс ErrorSpec для декларативного описания ошибок.
 * @version 1.0.1
 * @date 2025-05-30
 * @updated Заменен тип 'any' на 'unknown' в дженерике TContext. Добавлена пустая строка в конце файла.
 *
 * HISTORY:
 * v1.0.1 (2025-05-30): Заменен 'any' на 'unknown' в TContext, eol-last.
 * v1.0.0 (2025-05-29): Начальная реализация ErrorSpec.
 */

/**
 * Интерфейс для декларативного определения "типа" или "чертежа" ошибки.
 * Используется для создания экземпляров `FabError`.
 *
 * @template TContext Тип объекта контекста, ожидаемого для данного типа ошибки.
 */
export interface ErrorSpec<TContext extends object = Record<string, unknown>> {
  /**
   * Уникальный код ошибки. Должен быть в формате UPPER_SNAKE_CASE.
   * @example 'MY_MODULE_OPERATION_FAILED'
   */
  readonly code: string

  /**
   * Шаблон сообщения об ошибке. Может содержать плейсхолдеры вида `{key}`,
   * которые будут заменены значениями из объекта контекста.
   * @example 'Operation {operationName} failed for item ID {itemId}.'
   */
  readonly messageTemplate: string

  /**
   * Опциональные значения по умолчанию для полей контекста `TContext`.
   * Эти значения будут использованы, если соответствующие поля не предоставлены
   * при создании ошибки.
   */
  readonly defaultContext?: Partial<TContext>

  /**
   * Опциональная ссылка (URL или путь) на документацию, описывающую
   * данный тип ошибки, её причины и способы устранения.
   */
  readonly docs?: string
}

// END OF: src/error-spec.ts

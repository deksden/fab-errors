/**
 * @file src/utils.ts
 * @description Вспомогательные утилиты для библиотеки @fab33/fab-errors.
 * @version 1.0.2
 * @date 2025-05-30
 * @updated Переименована неиспользуемая переменная ошибки в catch на _e. Добавлена пустая строка в конце файла (eol-last).
 *
 * HISTORY:
 * v1.0.2 (2025-05-30): Исправлено правило no-unused-vars (catch _e) и eol-last.
 * v1.0.1 (2025-05-30): Исправления ESLint, улучшено преобразование в строку в formatMessage.
 * v1.0.0 (2025-05-29): Добавлена функция formatMessage.
 */

/**
 * Форматирует шаблон сообщения, подставляя значения из контекста.
 * Если ключ из плейсхолдера `{key}` отсутствует в контексте или его значение
 * `null` или `undefined`, плейсхолдер остается в строке без изменений.
 * Для объектов пытается вызвать `.toString()`, если он не стандартный `Object.prototype.toString`.
 *
 * @param template Шаблон сообщения с плейсхолдерами вида `{key}`.
 * @param context Объект со значениями для подстановки.
 * @returns Отформатированное сообщение. Если `template` не является строкой, возвращается пустая строка.
 * @deterministic Да, при одинаковых template и context результат всегда одинаков (за исключением нестандартных toString).
 */
export function formatMessage (template: string, context: object): string {
  if (typeof template !== 'string') {
    return ''
  }

  const ctx = context as Record<string, unknown>

  return template.replace(/{(\w+)}/g, (match, key: string) => {
    const value = ctx[key]

    if (value !== undefined && value !== null) {
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return String(value)
      }
      // Для объектов пытаемся вызвать toString, если он переопределен
      if (typeof value === 'object' && value !== null && typeof value.toString === 'function') {
        if (value.toString !== Object.prototype.toString) {
          try {
            return value.toString()
          } catch (_e) { // Переменная ошибки 'e' переименована в '_e', так как не используется
            // Игнорируем ошибки при вызове кастомного toString, оставляем плейсхолдер
            return match
          }
        }
        // Если это стандартный Object.prototype.toString, не используем его вывод ([object Object])
        return match // Оставляем плейсхолдер
      }
      // Для других типов (function, symbol, etc.) или если безопасное преобразование не удалось
      return match
    }
    return match // Оставляем плейсхолдер, если значение null/undefined или отсутствует
  })
}

// END OF: src/utils.ts

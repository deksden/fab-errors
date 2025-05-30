/**
 * @file src/di.ts
 * @description Механизм Dependency Injection для внутреннего логирования библиотеки @fab33/fab-errors.
 * @version 1.0.1
 * @date 2025-05-30
 * @updated Применены // eslint-disable-next-line для @typescript-eslint/no-explicit-any в LoggerLike. Исправлены пробелы, eol-last.
 *
 * HISTORY:
 * v1.0.1 (2025-05-30): Локальное отключение no-explicit-any для LoggerLike, исправления ESLint.
 * v1.0.0 (2025-05-29): Начальная реализация DI для внутреннего логгера.
 */

/**
 * Интерфейс для логгера, совместимого с @fab33/fab-errors.
 * Определяет минимально необходимые методы логирования.
 * Использование 'any' здесь оправдано для совместимости с API популярных логгеров.
 */
export interface LoggerLike {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  trace: (objOrMsg: any, msg?: string, ...args: any[]) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  debug: (objOrMsg: any, msg?: string, ...args: any[]) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  info: (objOrMsg: any, msg?: string, ...args: any[]) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  warn: (objOrMsg: any, msg?: string, ...args: any[]) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: (objOrMsg: any, msg?: string, ...args: any[]) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fatal?: (objOrMsg: any, msg?: string, ...args: any[]) => void // Опциональный метод
}

/**
 * Интерфейс для объекта зависимостей библиотеки @fab33/fab-errors.
 * В настоящее время содержит только опциональный логгер.
 */
export interface FabErrorsDependencies {
  logger?: LoggerLike
}

/**
 * Экземпляр зависимостей библиотеки.
 * По умолчанию логгер не установлен.
 */
export const dependencies: FabErrorsDependencies = {
  logger: undefined
}

/**
 * Устанавливает новые зависимости для библиотеки @fab33/fab-errors.
 * Позволяет пользователю предоставить собственный экземпляр логгера
 * для отладки внутренней работы библиотеки.
 *
 * @param newDependencies Объект с новыми зависимостями для частичного или полного обновления.
 */
export function setFabErrorsDependencies (newDependencies: Partial<FabErrorsDependencies>): void {
  Object.assign(dependencies, newDependencies)
}

// END OF: src/di.ts

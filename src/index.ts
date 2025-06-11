/**
 * @file src/index.ts
 * @description Основной файл экспорта (barrel file) для библиотеки @fab33/fab-errors.
 * @version 1.0.3
 * @date 2025-05-30
 * @updated Добавлена пустая строка в конце файла.
 *
 * HISTORY:
 * v1.0.1 (2025-05-30): eol-last.
 * v1.0.0 (2025-05-29): Начальный набор экспортов для v1.
 */

// Основной класс ошибки
export { FabError } from './fab-error.js'
export type { FabErrorJSON } from './fab-error.js'

// Тип для спецификации ошибки
export type { ErrorSpec } from './error-spec.js'

// Утилиты для работы с цепочками ошибок
export { hasErrorInChain, checkErrorChain } from './chain-utils.js'
export type { ErrorCriteria, ExpectedChainLevel } from './chain-utils.js'

// Базовые спецификации ошибок (как примеры)
export {
  INVALID_ARGUMENT_SPEC,
  OPERATION_FAILED_SPEC,
  NOT_IMPLEMENTED_SPEC,
  UNEXPECTED_ERROR_SPEC
} from './base-specs.js'
export type {
  InvalidArgumentContext,
  OperationFailedContext,
  NotImplementedContext,
  UnexpectedErrorContext
} from './base-specs.js'

// DI для внутреннего логирования библиотеки
export type { LoggerLike, FabErrorsDependencies } from './di.js'
export { setFabErrorsDependencies, dependencies as fabErrorsInternalDependencies } from './di.js'

// END OF: src/index.ts

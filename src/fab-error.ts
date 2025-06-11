/**
 * @file src/fab-error.ts
 * @description Основной класс ошибок FabError для библиотеки @fab33/fab-errors.
 * @version 1.0.2
 * @date 2025-05-30
 * @updated Заменен тип 'any' на 'unknown' в дженерике TContext. Исправлены пробелы, eol-last.
 *
 * HISTORY:
 * v1.0.2 (2025-05-30): Заменен 'any' на 'unknown' в TContext, исправления ESLint.
 * v1.0.1 (2025-05-29): Добавлен интерфейс FabErrorJSON и обновлена сигнатура toJSON.
 * v1.0.0 (2025-05-29): Первая реализация FabError с поддержкой Error.cause и типизированного контекста.
 */

import type { ErrorSpec } from './error-spec.js'
import { formatMessage } from './utils.js'

/**
 * Структура объекта, возвращаемого методом `toJSON()` класса `FabError`.
 */
export interface FabErrorJSON {
  name: string
  code: string
  message: string
  context: object // Сохраняем как object для простоты, т.к. TContext уже есть в экземпляре FabError
  docs?: string
  stack?: string
  spec: {
    code: string
    messageTemplate: string
    docs?: string
  }
  cause?: FabErrorJSON | { name?: string; message?: string; stack?: string; [key: string]: any } // eslint-disable-line @typescript-eslint/no-explicit-any
}

/**
 * Базовый класс для всех ошибок, создаваемых библиотекой `@fab33/fab-errors`.
 * Расширяет стандартный `Error`, добавляя структурированные метаданные:
 * код ошибки, спецификацию ошибки, типизированный контекст и использует
 * нативное свойство `Error.cause` для построения цепочек ошибок.
 *
 * @template TContext Тип объекта контекста, связанного с ошибкой.
 */
export class FabError<TContext extends object = Record<string, unknown>> extends Error {
  /**
   * Уникальный код ошибки, определенный в `ErrorSpec`.
   * @example 'USER_SERVICE_USER_NOT_FOUND'
   */
  public readonly code: string

  /**
   * Объект контекста, содержащий дополнительные данные об ошибке.
   * Типизируется через дженерик `TContext`.
   */
  public readonly context: Readonly<TContext>

  /**
   * Ссылка на спецификацию (`ErrorSpec`), по которой была создана эта ошибка.
   * Содержит `code`, `messageTemplate`, `defaultContext` (если есть) и `docs`.
   */
  public readonly spec: Readonly<ErrorSpec<TContext>>

  /**
   * Опциональная ссылка на документацию по этой ошибке, из `ErrorSpec`.
   */
  public readonly docs?: string

  /**
   * Создает экземпляр `FabError`.
   *
   * @param spec Спецификация ошибки (`ErrorSpec`), содержащая `code`, `messageTemplate` и др.
   * @param context Объект контекста, соответствующий `TContext` и дополняющий `spec.defaultContext`.
   * @param cause Оригинальная ошибка, которая привела к возникновению текущей (для `Error.cause`).
   */
  constructor (
    spec: ErrorSpec<TContext>,
    context: TContext,
    cause?: Error
  ) {
    const fullContext = { ...spec.defaultContext, ...context }
    const formattedMessage = formatMessage(spec.messageTemplate, fullContext)

    super(formattedMessage)

    this.name = this.constructor.name // 'FabError'
    this.code = spec.code
    this.spec = spec
    this.context = Object.freeze(fullContext) // Делаем контекст неизменяемым
    this.docs = spec.docs

    if (cause instanceof Error) {
      this.cause = cause
    }
  }

  /**
   * Сериализует ошибку в JSON-совместимый объект для логирования или передачи.
   * Включает все ключевые свойства ошибки и рекурсивно сериализует `cause`.
   *
   * @returns Сериализованное представление ошибки, соответствующее интерфейсу `FabErrorJSON`.
   */
  toJSON (): FabErrorJSON {
    let causeJSON: FabErrorJSON['cause']
    if (this.cause) {
      if (this.cause instanceof FabError) {
        causeJSON = this.cause.toJSON()
      } else if (this.cause instanceof Error) {
        causeJSON = {
          name: this.cause.name,
          message: this.cause.message,
          stack: this.cause.stack
        }
      } else if (typeof this.cause === 'object' && this.cause !== null) {
        causeJSON = { ...(this.cause as object) }
      } else if (this.cause !== undefined) {
        causeJSON = { value: String(this.cause) }
      }
    }

    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context,
      docs: this.docs,
      stack: this.stack,
      spec: {
        code: this.spec.code,
        messageTemplate: this.spec.messageTemplate,
        docs: this.spec.docs
      },
      cause: causeJSON
    }
  }
}

// END OF: src/fab-error.ts

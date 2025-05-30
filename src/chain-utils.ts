/**
 * @file src/chain-utils.ts
 * @description Утилиты для работы с цепочками ошибок (Error.cause).
 * @version 1.0.8
 * @date 2025-05-30
 * @updated Добавлена пустая строка в конце файла (eol-last).
 *
 * HISTORY:
 * v1.0.8 (2025-05-30): Исправлено правило eol-last.
 * v1.0.7 (2025-05-30): Изменен ErrorCriteria.type на `new (...args: any[]) => Error`. Добавлено явное присвоение confirmedError: Error.
 * v1.0.6 (2025-05-30): Исправления ESLint (no-unused-vars, no-explicit-any, space-before-function-paren), eol-last. (Версия из XML)
 * v1.0.5 (2025-05-30): Использовано явное утверждение типа `as Error` для `currentErrorForLevel` в `checkErrorChain`.
 * v1.0.4 (2025-05-30): Убрана вложенная проверка `currentErrorForLevel instanceof Error` в блоке проверки типа.
 * v1.0.3 (2025-05-29): Добавлена явная проверка `instanceof Error` для currentErrorForLevel в блоке проверки типа.
 * v1.0.2 (2025-05-29): Реструктуризация проверки типа в checkErrorChain для исправления TS2339.
 * v1.0.1 (2025-05-29): Исправлена ошибка типов TS2339 в checkErrorChain (первая попытка).
 * v1.0.0 (2025-05-29): Начальная реализация hasErrorInChain и checkErrorChain.
 */

// FabError здесь не используется напрямую для проверок, работаем с общим Error

/**
 * Критерии для поиска ошибки в цепочке с помощью `hasErrorInChain`.
 */
export interface ErrorCriteria {
  /** Ожидаемый код ошибки (свойство `code` у `FabError` или аналогичных). */
  code?: string
  /**
   * Ожидаемый тип/класс ошибки (сравнение через `instanceof`).
   * Использование 'any' для аргументов конструктора здесь для совместимости
   * с различными сигнатурами конструкторов ошибок.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type?: new (...args: any[]) => Error
  /**
   * Ожидаемый фрагмент(ы) для поиска в сообщении ошибки (`error.message`).
   * Поиск регистронезависимый. Если массив, то все строки из массива должны присутствовать.
   */
  message?: string | string[]
}

/**
 * Описание ожидаемого уровня в цепочке ошибок для функции `checkErrorChain`.
 */
export interface ExpectedChainLevel extends ErrorCriteria {
  // Наследует code, type, message от ErrorCriteria
}

/**
 * Проверяет, присутствует ли в цепочке ошибок (начиная с `error` и далее по `error.cause`)
 * ошибка, соответствующая указанным критериям.
 *
 * @param error Начальная ошибка для проверки.
 * @param criteria Объект с критериями поиска (`code`, `type`, `message`).
 * @returns `true`, если ошибка, соответствующая критериям, найдена в цепочке, иначе `false`.
 * @deterministic Да, для той же ошибки и критериев.
 */
export function hasErrorInChain (error: Error | undefined | null, criteria: ErrorCriteria): boolean {
  let currentError: Error | undefined | null = error

  while (currentError) {
    let codeMatch = true
    if (criteria.code !== undefined) {
      const errorWithCode = currentError as { code?: unknown }
      codeMatch = typeof errorWithCode.code === 'string' && errorWithCode.code === criteria.code
    }

    let typeMatch = true
    if (criteria.type !== undefined) {
      typeMatch = currentError instanceof criteria.type
    }

    let messageMatch = true
    if (criteria.message !== undefined) {
      if (typeof currentError.message === 'string') {
        const currentMessageLower = currentError.message.toLowerCase()
        const expectedMessages = Array.isArray(criteria.message) ? criteria.message : [criteria.message]
        messageMatch = expectedMessages.every(msg =>
          typeof msg === 'string' && currentMessageLower.includes(msg.toLowerCase())
        )
      } else {
        messageMatch = false
      }
    }

    if (codeMatch && typeMatch && messageMatch) {
      return true
    }

    const cause = currentError.cause
    if (cause instanceof Error) {
      currentError = cause
    } else {
      currentError = undefined
    }
  }

  return false
}

/**
 * Проверяет, соответствует ли цепочка ошибок (начиная с `error` и далее по `error.cause`)
 * ожидаемой структуре, описанной в `expectedChain`.
 *
 * @param error Начальная ошибка для проверки.
 * @param expectedChain Массив объектов `ExpectedChainLevel`, описывающих каждый ожидаемый уровень цепочки.
 * @returns `true`, если цепочка полностью соответствует ожиданиям.
 * @throws `Error` если цепочка не соответствует ожиданиям (сообщение содержит детали несоответствия).
 * @deterministic Да, для той же ошибки и ожидаемой цепочки.
 */
export function checkErrorChain (error: Error | undefined | null, expectedChain: ExpectedChainLevel[]): boolean {
  let currentErrorInChain: Error | undefined | null = error
  let levelIndex = 0

  if (!Array.isArray(expectedChain)) {
    throw new Error('checkErrorChain: expectedChain must be an array.')
  }

  for (levelIndex = 0; levelIndex < expectedChain.length; levelIndex++) {
    const expectedLevel = expectedChain[levelIndex]
    const errorPrefix = `Error chain mismatch at level ${levelIndex}`

    const errorForThisIteration = currentErrorInChain
    if (!errorForThisIteration) {
      throw new Error(`${errorPrefix}: Expected level with code '${expectedLevel.code || 'any'}' but error chain ended.`)
    }
    // На этом этапе TypeScript должен знать, что errorForThisIteration это Error.

    // 1. Проверка кода ошибки (если указан)
    if (expectedLevel.code !== undefined) {
      const errorWithCode = errorForThisIteration as { code?: unknown }
      if (typeof errorWithCode.code !== 'string' || errorWithCode.code !== expectedLevel.code) {
        throw new Error(`${errorPrefix}: Expected code '${expectedLevel.code}', got '${String(errorWithCode.code) || 'undefined'}'. Message: "${errorForThisIteration.message}"`)
      }
    }

    // 2. Проверка типа ошибки (если указан)
    if (expectedLevel.type !== undefined) {
      if (!(errorForThisIteration instanceof expectedLevel.type)) {
        // Явно присваиваем переменной с типом Error, чтобы помочь TS, если он "теряет" сужение.
        const confirmedError: Error = errorForThisIteration

        const actualTypeName = confirmedError.constructor.name
        const actualMessage = confirmedError.message
        throw new Error(`${errorPrefix}: Expected type '${expectedLevel.type.name}', got '${actualTypeName}'. Message: "${actualMessage}"`)
      }
    }

    // 3. Проверка содержания сообщения (если указано)
    if (expectedLevel.message !== undefined) {
      // errorForThisIteration здесь также должен быть Error
      const errorWithMessage = errorForThisIteration as { message?: unknown, code?: unknown }
      if (typeof errorWithMessage.message !== 'string') {
        throw new Error(`${errorPrefix}: Error message is not a string or missing for code '${String(errorWithMessage.code) || 'unknown'}'.`)
      }
      const currentMessageLower = errorWithMessage.message.toLowerCase()
      const expectedMessages = Array.isArray(expectedLevel.message) ? expectedLevel.message : [expectedLevel.message]

      for (const expectedMsg of expectedMessages) {
        if (typeof expectedMsg !== 'string' || !currentMessageLower.includes(expectedMsg.toLowerCase())) {
          throw new Error(`${errorPrefix}: Message does not contain expected text '${expectedMsg}'. Full message: "${errorWithMessage.message}"`)
        }
      }
    }

    const cause = errorForThisIteration.cause
    if (cause instanceof Error) {
      currentErrorInChain = cause
    } else {
      currentErrorInChain = undefined
    }
  }

  if (currentErrorInChain) {
    const nextError = currentErrorInChain as Error
    const nextErrorCode = (nextError as { code?: unknown }).code
    throw new Error(`Error chain validation failed: Error chain has more levels than expected (${expectedChain.length}). Next level error: ${nextError.constructor.name} [${String(nextErrorCode) || 'unknown'}] "${nextError.message}"`)
  }

  return true
}

// END OF: src/chain-utils.ts

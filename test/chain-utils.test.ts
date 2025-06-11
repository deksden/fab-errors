/**
 * @file test/chain-utils.test.ts
 * @description Юнит-тесты для утилит работы с цепочками ошибок.
 * @version 1.0.1
 * @date 2025-05-30
 * @updated Исправлены ошибки ESLint: space-before-function-paren, no-multi-spaces, eol-last.
 *
 * HISTORY:
 * v1.0.1 (2025-05-30): Исправления ESLint.
 * v1.0.0 (2025-05-29): Тесты для hasErrorInChain и checkErrorChain с учетом Error.cause.
 */

import { describe, expect, it } from 'vitest'
import { checkErrorChain, type ErrorSpec, type ExpectedChainLevel, FabError, hasErrorInChain } from '../src/index.js'

// --- Тестовые данные ---
const SPEC_LEVEL_3: ErrorSpec<{ detail: string }> = { code: 'L3_ERROR', messageTemplate: 'Level 3: {detail}' }
const SPEC_LEVEL_2: ErrorSpec<{ info: string }> = {
  code: 'L2_ERROR',
  messageTemplate: 'Level 2 error with info {info}'
}
const SPEC_LEVEL_1: ErrorSpec<{ reason: string }> = { code: 'L1_ERROR', messageTemplate: 'Level 1 because {reason}' }

const errLvl3 = new FabError(SPEC_LEVEL_3, { detail: 'Innermost issue' })
const errLvl2 = new FabError(SPEC_LEVEL_2, { info: 'middle problem' }, errLvl3)
const errLvl1 = new FabError(SPEC_LEVEL_1, { reason: 'initial failure' }, errLvl2)

const typeErrorCause = new TypeError('A type problem')
const errWithStdCause = new FabError(SPEC_LEVEL_1, { reason: 'wrapping std error' }, typeErrorCause)

class CustomError extends Error {
  customField: string

  constructor (message: string, customField: string) {
    super(message)
    this.name = 'CustomError'
    this.customField = customField
  }
}

const customErrorCause = new CustomError('Custom error happened', 'extraData')
const errWithCustomCause = new FabError(SPEC_LEVEL_1, { reason: 'wrapping custom' }, customErrorCause)

describe('chain-utils', () => {
  describe('hasErrorInChain()', () => {
    it('должен находить ошибку по коду в цепочке', () => {
      expect(hasErrorInChain(errLvl1, { code: 'L1_ERROR' })).toBe(true)
      expect(hasErrorInChain(errLvl1, { code: 'L2_ERROR' })).toBe(true)
      expect(hasErrorInChain(errLvl1, { code: 'L3_ERROR' })).toBe(true)
      expect(hasErrorInChain(errLvl1, { code: 'NON_EXISTENT' })).toBe(false)
    })

    it('должен находить ошибку по типу (FabError)', () => {
      expect(hasErrorInChain(errLvl1, { type: FabError })).toBe(true)
    })

    it('должен находить ошибку по типу (стандартная Error)', () => {
      expect(hasErrorInChain(errWithStdCause, { type: TypeError })).toBe(true)
      expect(hasErrorInChain(errWithStdCause, { type: RangeError })).toBe(false)
    })

    it('должен находить ошибку по типу (кастомная Error)', () => {
      expect(hasErrorInChain(errWithCustomCause, { type: CustomError })).toBe(true)
      expect(hasErrorInChain(errWithCustomCause, { type: FabError, code: 'L1_ERROR' })).toBe(true) // Проверка первого уровня
    })

    it('должен находить ошибку по сообщению (одна строка)', () => {
      expect(hasErrorInChain(errLvl1, { message: 'initial failure' })).toBe(true)
      expect(hasErrorInChain(errLvl1, { message: 'middle problem' })).toBe(true)
      expect(hasErrorInChain(errLvl1, { message: 'INNERMOST ISSUE' })).toBe(true) // Регистронезависимость
      expect(hasErrorInChain(errLvl1, { message: 'non existent message part' })).toBe(false)
    })

    it('должен находить ошибку по сообщению (массив строк - все должны присутствовать)', () => {
      expect(hasErrorInChain(errLvl2, { message: ['level 2', 'middle'] })).toBe(true)
      expect(hasErrorInChain(errLvl2, { message: ['level 2', 'non_existent'] })).toBe(false)
    })

    it('должен находить ошибку по комбинации критериев', () => {
      expect(hasErrorInChain(errLvl1, { code: 'L2_ERROR', message: 'middle' })).toBe(true)
      expect(hasErrorInChain(errLvl1, { type: FabError, code: 'L3_ERROR' })).toBe(true)
      expect(hasErrorInChain(errLvl1, { code: 'L2_ERROR', message: 'wrong message' })).toBe(false)
    })

    it('должен возвращать false для null или undefined ошибки', () => {
      expect(hasErrorInChain(null, { code: 'ANY' })).toBe(false)
      expect(hasErrorInChain(undefined, { code: 'ANY' })).toBe(false)
    })

    it('должен корректно работать с ошибками без свойства code', () => {
      const simpleError = new Error('simple')
      const fabWrappingSimple = new FabError(SPEC_LEVEL_1, { reason: 'wrap' }, simpleError)
      expect(hasErrorInChain(fabWrappingSimple, { message: 'simple' })).toBe(true)
      expect(hasErrorInChain(fabWrappingSimple, { code: 'NON_CODE_PROP' })).toBe(false) // На простом Error нет code
    })
  })

  describe('checkErrorChain()', () => {
    const validChain: ExpectedChainLevel[] = [
      { code: 'L1_ERROR', type: FabError, message: 'initial failure' },
      { code: 'L2_ERROR', message: ['middle problem', 'level 2'] },
      { code: 'L3_ERROR', type: FabError, message: 'Innermost' }
    ]

    it('должен вернуть true для полностью соответствующей цепочки', () => {
      expect(checkErrorChain(errLvl1, validChain)).toBe(true)
    })

    it('должен выбросить ошибку при неверном коде на одном из уровней', () => {
      const invalidChain = [...validChain]
      invalidChain[1] = { ...invalidChain[1], code: 'WRONG_CODE' }
      expect(() => checkErrorChain(errLvl1, invalidChain))
        .toThrow(/Expected code 'WRONG_CODE', got 'L2_ERROR'/)
    })

    it('должен выбросить ошибку при неверном типе на одном из уровней', () => {
      const chainWithStdError: ExpectedChainLevel[] = [
        { code: 'L1_ERROR', type: FabError },
        { type: TypeError } // Ожидаем TypeError на втором уровне
      ]
      expect(() => checkErrorChain(errWithStdCause, chainWithStdError)).not.toThrow()

      const wrongTypeChain: ExpectedChainLevel[] = [
        { code: 'L1_ERROR', type: FabError },
        { type: RangeError } // errWithStdCause имеет TypeError на втором уровне
      ]
      expect(() => checkErrorChain(errWithStdCause, wrongTypeChain))
        .toThrow(/Expected type 'RangeError', got 'TypeError'/)
    })

    it('должен выбросить ошибку, если сообщение не содержит ожидаемый текст', () => {
      const invalidChain = [...validChain]
      invalidChain[0] = { ...invalidChain[0], message: 'non_existent_text' }
      expect(() => checkErrorChain(errLvl1, invalidChain))
        .toThrow(/Message does not contain expected text 'non_existent_text'/)
    })

    it('должен выбросить ошибку, если ожидаемая цепочка длиннее фактической', () => {
      const longerChain = [...validChain, { code: 'L4_ERROR' }]
      expect(() => checkErrorChain(errLvl1, longerChain))
        .toThrow(/Expected level with code 'L4_ERROR' but error chain ended/)
    })

    it('должен выбросить ошибку, если фактическая цепочка длиннее ожидаемой', () => {
      const shorterChain = [validChain[0]]
      expect(() => checkErrorChain(errLvl1, shorterChain))
        .toThrow(/Error chain has more levels than expected \(1\)/)
    })

    it('должен выбросить ошибку, если expectedChain не массив', () => {
      // @ts-ignore
      expect(() => checkErrorChain(errLvl1, null)).toThrow('checkErrorChain: expectedChain must be an array.')
      // @ts-ignore
      expect(() => checkErrorChain(errLvl1, {})).toThrow('checkErrorChain: expectedChain must be an array.')
    })

    it('должен корректно работать с частичными проверками на уровнях', () => {
      const partialChain: ExpectedChainLevel[] = [
        { code: 'L1_ERROR' }, // Только код
        { type: FabError }, // Только тип
        { message: 'Innermost' } // Только сообщение
      ]
      expect(checkErrorChain(errLvl1, partialChain)).toBe(true)
    })

    it('должен корректно обрабатывать null или undefined в качестве ошибки', () => {
      expect(() => checkErrorChain(null, [{ code: 'ANY' }])).toThrow(/Expected level with code 'ANY' but error chain ended./)
    })
  })
})

// END OF: test/chain-utils.test.ts

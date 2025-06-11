/**
 * @file test/fab-error.test.ts
 * @description Юнит-тесты для класса FabError.
 * @version 1.0.2
 * @date 2025-05-30
 * @updated Локально отключено правило @typescript-eslint/no-explicit-any для тестовых сценариев с cause. Добавлена пустая строка в конце файла.
 *
 * HISTORY:
 * v1.0.2 (2025-05-30): Локальное отключение no-explicit-any для тестов cause, eol-last.
 * v1.0.1 (2025-05-30): Добавлены проверки на undefined для json.cause.
 * v1.0.0 (2025-05-29): Начальные тесты для FabError, включая context, cause, toJSON.
 */

import { describe, expect, it } from 'vitest'
import { FabError, type FabErrorJSON, type ErrorSpec } from '../src/index.js' // Импортируем FabErrorJSON
import { formatMessage } from '../src/utils.js'

interface TestContext1 {
  value: string
  optionalValue?: number
}
const TEST_SPEC_1: ErrorSpec<TestContext1> = {
  code: 'TEST_ERR_001',
  messageTemplate: 'Test error 1 with value {value} and optional {optionalValue}.',
  defaultContext: {
    optionalValue: 42
  },
  docs: 'https://example.com/docs/test-err-001'
}

interface AnotherContext {
  id: number
  details: string
}
const ANOTHER_SPEC: ErrorSpec<AnotherContext> = {
  code: 'ANOTHER_ERR',
  messageTemplate: 'Another error for ID {id}: {details}.'
}

describe('FabError', () => {
  describe('constructor and properties', () => {
    it('должен корректно создать экземпляр FabError со всеми свойствами', () => {
      const context: TestContext1 = { value: 'test-data' }
      const cause = new TypeError('Original cause')
      const error = new FabError(TEST_SPEC_1, context, cause)

      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(FabError)
      expect(error.name).toBe('FabError')
      expect(error.code).toBe(TEST_SPEC_1.code)
      expect(error.spec).toBe(TEST_SPEC_1)
      expect(error.docs).toBe(TEST_SPEC_1.docs)

      const expectedMessage = formatMessage(TEST_SPEC_1.messageTemplate, {
        ...TEST_SPEC_1.defaultContext,
        ...context
      })
      expect(error.message).toBe(expectedMessage)
      expect(error.message).toBe('Test error 1 with value test-data and optional 42.')

      expect(error.context).toEqual({
        value: 'test-data',
        optionalValue: 42
      })
      expect(Object.isFrozen(error.context)).toBe(true)

      expect(error.cause).toBe(cause)
      expect(error.stack).toBeDefined()
    })

    it('должен корректно создать экземпляр без defaultContext и без cause', () => {
      const context: AnotherContext = { id: 123, details: 'No default' }
      const error = new FabError(ANOTHER_SPEC, context)

      expect(error.code).toBe(ANOTHER_SPEC.code)
      expect(error.message).toBe('Another error for ID 123: No default.')
      expect(error.context).toEqual(context)
      expect(error.cause).toBeUndefined()
      expect(error.docs).toBeUndefined()
    })

    it('должен использовать переданное optionalValue вместо defaultContext', () => {
      const context: TestContext1 = { value: 'override', optionalValue: 99 }
      const error = new FabError(TEST_SPEC_1, context)

      expect(error.context).toEqual({
        value: 'override',
        optionalValue: 99
      })
      expect(error.message).toBe('Test error 1 with value override and optional 99.')
    })

    it('должен корректно обрабатывать messageTemplate без плейсхолдеров', () => {
      const spec: ErrorSpec = { code: 'NO_PLACEHOLDER', messageTemplate: 'Fixed message.' }
      const error = new FabError(spec, {})
      expect(error.message).toBe('Fixed message.')
    })

    it('должен корректно обрабатывать плейсхолдеры, отсутствующие в контексте (остаются как есть)', () => {
      const spec: ErrorSpec<{ present?: string }> = {
        code: 'MISSING_KEY',
        messageTemplate: 'Value: {present}, Missing: {absent}.'
      }
      const error = new FabError(spec, { present: 'here' })
      expect(error.message).toBe('Value: here, Missing: {absent}.')
    })
  })

  describe('toJSON()', () => {
    it('должен корректно сериализовать FabError без cause', () => {
      const context: TestContext1 = { value: 'json-test' }
      const error = new FabError(TEST_SPEC_1, context)
      const json: FabErrorJSON = error.toJSON()

      expect(json).toMatchObject({
        name: 'FabError',
        code: TEST_SPEC_1.code,
        message: 'Test error 1 with value json-test and optional 42.',
        context: { value: 'json-test', optionalValue: 42 },
        docs: TEST_SPEC_1.docs,
        stack: expect.any(String),
        spec: {
          code: TEST_SPEC_1.code,
          messageTemplate: TEST_SPEC_1.messageTemplate,
          docs: TEST_SPEC_1.docs
        },
        cause: undefined
      })
    })

    it('должен корректно сериализовать FabError со стандартной Error в cause', () => {
      const context: TestContext1 = { value: 'cause-test' }
      const causeError = new URIError('Malformed URI')
      causeError.stack = 'URIError stack trace'
      const error = new FabError(TEST_SPEC_1, context, causeError)
      const json: FabErrorJSON = error.toJSON()

      expect(json.cause).toBeDefined()
      if (json.cause && !('code' in json.cause)) {
        expect(json.cause.name).toBe('URIError')
        expect(json.cause.message).toBe('Malformed URI')
        expect(json.cause.stack).toBe('URIError stack trace')
      } else {
        expect.fail('json.cause was expected to be a serialized standard Error')
      }
    })

    it('должен рекурсивно сериализовать FabError, если cause тоже FabError', () => {
      const innerContext: AnotherContext = { id: 789, details: 'Inner error' }
      const innerError = new FabError(ANOTHER_SPEC, innerContext)

      const outerContext: TestContext1 = { value: 'outer-error' }
      const outerError = new FabError(TEST_SPEC_1, outerContext, innerError)

      const json: FabErrorJSON = outerError.toJSON()

      expect(json.name).toBe('FabError')
      expect(json.code).toBe(TEST_SPEC_1.code)
      expect(json.cause).toBeDefined()

      if (json.cause && 'code' in json.cause) {
        const causeAsFabErrorJson = json.cause as FabErrorJSON
        expect(causeAsFabErrorJson.name).toBe('FabError')
        expect(causeAsFabErrorJson.code).toBe(ANOTHER_SPEC.code)
        expect(causeAsFabErrorJson.context).toEqual(innerContext)
        expect(causeAsFabErrorJson.spec.code).toBe(ANOTHER_SPEC.code)
        expect(causeAsFabErrorJson.cause).toBeUndefined()
      } else {
        expect.fail('json.cause was expected to be a serialized FabError')
      }
    })

    it('должен обрабатывать cause, не являющийся Error, при прямом присваивании (для теста toJSON)', () => {
      const context: TestContext1 = { value: 'non-error-cause' }
      const error = new FabError(TEST_SPEC_1, context)

      const causeObj = { customReason: 'something odd', code: 123 }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(error as any).cause = causeObj // Обходим типизацию конструктора для теста
      const jsonWithAnyCause: FabErrorJSON = error.toJSON()

      expect(jsonWithAnyCause.cause).toEqual(causeObj)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(error as any).cause = 'just a string cause'
      const jsonWithStringCause: FabErrorJSON = error.toJSON()
      expect(jsonWithStringCause.cause).toEqual({ value: 'just a string cause' })
    })
  })
})

// END OF: test/fab-error.test.ts

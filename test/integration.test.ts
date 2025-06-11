/**
 * @file test/integration.test.ts
 * @description Интеграционные тесты, демонстрирующие пользовательский workflow с FabError.
 * @version 1.0.2
 * @date 2025-05-30
 * @updated Исправлены ошибки ESLint: space-before-function-paren, eol-last. Локально отключено @typescript-eslint/no-explicit-any для error в catch.
 *
 * HISTORY:
 * v1.0.2 (2025-05-30): Исправления ESLint (space-before-function-paren, eol-last, no-explicit-any).
 * v1.0.1 (2025-05-30): Добавлены проверки instanceof Error для error.cause.
 * v1.0.0 (2025-05-29): Начальные интеграционные тесты.
 */

import { describe, expect, it } from 'vitest'
import { FabError, type ErrorSpec, hasErrorInChain, checkErrorChain, type ExpectedChainLevel } from '../src/index.js'

// --- Начало определения пользовательских ошибок ---

interface FileProcessingContext {
  filePath: string
  lineNumber?: number
}

interface NetworkOperationContext {
  url: string
  method: 'GET' | 'POST'
  statusCode?: number
}

const FILE_READ_FAILED_SPEC: ErrorSpec<FileProcessingContext> = {
  code: 'FS_READ_FAILED',
  messageTemplate: 'Failed to read file {filePath} at line {lineNumber}.',
  defaultContext: {
    lineNumber: 0
  },
  docs: 'custom-docs/fs-read-failed'
}

const NETWORK_REQUEST_FAILED_SPEC: ErrorSpec<NetworkOperationContext> = {
  code: 'NET_REQUEST_FAILED',
  messageTemplate: 'Network request {method} to {url} failed with status {statusCode}.'
}

function createFsReadFailedError (
  context: Pick<FileProcessingContext, 'filePath'> & Partial<Omit<FileProcessingContext, 'filePath'>>,
  cause?: Error
): FabError<FileProcessingContext> {
  const fullContext: FileProcessingContext = {
    ...FILE_READ_FAILED_SPEC.defaultContext,
    ...context
  } as FileProcessingContext
  return new FabError(FILE_READ_FAILED_SPEC, fullContext, cause)
}

function createNetworkRequestFailedError (
  context: NetworkOperationContext,
  cause?: Error
): FabError<NetworkOperationContext> {
  return new FabError(NETWORK_REQUEST_FAILED_SPEC, context, cause)
}
// --- Конец определения пользовательских ошибок ---

class DataProcessor {
  async readFile (filePath: string): Promise<string> {
    if (filePath === 'nonexistent.txt') {
      const lowLevelError = new Error('ENOENT: no such file or directory')
      throw createFsReadFailedError({ filePath }, lowLevelError)
    }
    if (filePath === 'corrupted.txt') {
      throw createFsReadFailedError({ filePath, lineNumber: 123 })
    }
    return `content of ${filePath}`
  }

  async fetchData (url: string): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (url.includes('error.com')) {
      const networkLibError = new Error('Connection refused')
      throw createNetworkRequestFailedError(
        { url, method: 'GET', statusCode: 503 },
        networkLibError
      )
    }
    return { data: `response from ${url}` }
  }

  async processDataFromSource (file: string, remoteUrl: string): Promise<string> {
    try {
      const fileContent = await this.readFile(file)
      const remoteData = await this.fetchData(remoteUrl)
      return `Processed: ${fileContent} & ${JSON.stringify(remoteData)}`
    } catch (error) {
      const spec: ErrorSpec<{ originalErrorType?: string }> = {
        code: 'DATA_PROCESSING_FAILED',
        messageTemplate: 'Data processing failed. Original error type: {originalErrorType}'
      }
      const causeError = error instanceof Error ? error : new Error(String(error))
      throw new FabError(spec, { originalErrorType: causeError.constructor.name }, causeError)
    }
  }
}

describe('Интеграция FabError в приложение', () => {
  const processor = new DataProcessor()

  it('должен корректно создавать и бросать FileSystemError через фабрику', async () => {
    try {
      await processor.readFile('nonexistent.txt')
      expect.fail('Ожидалась ошибка чтения файла')
    } catch (e) {
      expect(e).toBeInstanceOf(FabError)
      const error = e as FabError<FileProcessingContext>

      expect(error.code).toBe('FS_READ_FAILED')
      expect(error.context.filePath).toBe('nonexistent.txt')
      expect(error.context.lineNumber).toBe(0)
      expect(error.cause).toBeInstanceOf(Error)
      if (error.cause instanceof Error) {
        expect(error.cause.message).toBe('ENOENT: no such file or directory')
      } else {
        expect.fail('error.cause должен быть instanceof Error')
      }
      expect(error.docs).toBe(FILE_READ_FAILED_SPEC.docs)

      expect(hasErrorInChain(error, { code: 'FS_READ_FAILED' })).toBe(true)
      expect(hasErrorInChain(error, { message: 'ENOENT' })).toBe(true)
    }
  })

  it('должен корректно создавать и бросать NetworkError через фабрику', async () => {
    const url = 'http://error.com/data'
    try {
      await processor.fetchData(url)
      expect.fail('Ожидалась сетевая ошибка')
    } catch (e) {
      expect(e).toBeInstanceOf(FabError)
      const error = e as FabError<NetworkOperationContext>

      expect(error.code).toBe('NET_REQUEST_FAILED')
      expect(error.context.url).toBe(url)
      expect(error.cause).toBeInstanceOf(Error)
      if (error.cause instanceof Error) {
        expect(error.cause.message).toBe('Connection refused')
      } else {
        expect.fail('error.cause должен быть instanceof Error')
      }
    }
  })

  it('должен корректно оборачивать ошибки в ошибку операции более высокого уровня', async () => {
    try {
      await processor.processDataFromSource('nonexistent.txt', 'http://good.com')
      expect.fail('Ожидалась ошибка обработки данных')
    } catch (e) {
      expect(e).toBeInstanceOf(FabError)
      const error = e as FabError // Общая ошибка обработки

      expect(error.code).toBe('DATA_PROCESSING_FAILED')
      expect(error.context.originalErrorType).toBe('FabError')

      const expectedChain: ExpectedChainLevel[] = [
        { code: 'DATA_PROCESSING_FAILED', type: FabError },
        { code: 'FS_READ_FAILED', type: FabError, message: 'nonexistent.txt' },
        { type: Error, message: 'ENOENT' }
      ]
      expect(() => checkErrorChain(error, expectedChain)).not.toThrow()

      expect(hasErrorInChain(error, { code: 'FS_READ_FAILED' })).toBe(true)
      expect(hasErrorInChain(error, { message: 'ENOENT' })).toBe(true)
    }
  })
})

// END OF: test/integration.test.ts

# DOC_DI.md :: 💉 Dependency Injection (DI) в Проекте

**Версия Документа:** 0.2.1 (Объединенный)
**Дата:** 2025-05-30
**Статус:** Активный

## 🎯 1. Назначение и Принцип

**Dependency Injection (DI)** — это паттерн проектирования, используемый в системе "Vibe Story" для управления зависимостями модулей. Основная цель — упростить **тестирование** 🧪 модулей путем гибкой подмены их зависимостей на моки или стабы, а также повысить **модульность** 🧱 и **гибкость** 🤸‍♂️ кода.

**Ключевые Принципы Реализации:**

1.  **Централизованные Зависимости:** Все зависимости модуля (внешние импорты, иногда внутренние функции для тестируемости) хранятся в едином экспортируемом объекте `dependencies`.
2.  **Инициализация по Умолчанию:** При импорте модуля его объект `dependencies` инициализируется реальными, рабочими реализациями.
3.  **Функция Подмены:** Каждый модуль, использующий DI, экспортирует функцию `setDependencies(newDependencies)` (или специфичную для модуля, например, `setModelFactoryDependencies`), позволяющую частично или полностью заменить зависимости новыми реализациями. Это основной механизм для внедрения моков в тестах.
4.  **Использование через `dependencies`:** Весь код модуля (включая его внутренние функции) обращается к своим зависимостям **исключительно** через объект `dependencies`. Прямой вызов импортированных модулей (если они являются зависимостями) или глобальных объектов внутри функций модуля недопустим, если они могут быть подменены через DI.
5. названия переменной dependencies и функции setDependencies являются стандартными, мы не меняем их для разных модулей для большей узнаваемости паттерна.

## 🛠️ 2. Правила Реализации в Коде

### 2.1. Объявление Зависимостей (Пример)

```typescript
// Файл: src/example-module.ts
import fs from 'fs/promises'; // Реальная зависимость
import { createLogger, type Logger } from '@fab33/sys-logger'; // Реальная зависимость

// 1. (Рекомендуется) Определение интерфейса для объекта зависимостей
export interface ExampleModuleDependencies {
  logger: Logger;
  readFile: typeof fs.readFile;
  processItemInternal: (item: string) => string; // Пример "внутренней" функции, вынесенной в зависимости для тестируемости
}

// 2. Экспортируемый объект с зависимостями по умолчанию
export const dependencies: ExampleModuleDependencies = {
  logger: createLogger('example-module'),
  readFile: fs.readFile,
  processItemInternal: (item: string) => `[REAL] Processed: ${item.toUpperCase()}`,
};

// 3. Экспортируемая функция для установки/подмены зависимостей
export function setExampleModuleDependencies(newDependencies: Partial<ExampleModuleDependencies>): void {
  Object.assign(dependencies, newDependencies);
}
```

### 2.2. Использование Зависимостей (Пример)

```typescript
// Продолжение файла: src/example-module.ts
export async function loadAndProcessData(filePath: string): Promise<string[]> {
  // 4. Получение зависимостей из объекта `dependencies`
  const { logger, readFile, processItemInternal } = dependencies;

  logger.info({ filePath }, 'Attempting to load and process file...');
  
  try {
    const content = await readFile(filePath, 'utf-8');
    const items = content.split('\\n');
    
    const processedItems = items.map(item => processItemInternal(item)); // Вызов зависимости
    logger.info({ filePath, itemCount: items.length, processedCount: processedItems.length }, 'File processed successfully.');
    return processedItems;
  } catch (error) {
    logger.error({ err: error, filePath }, 'Failed to load or process file.');
    throw error; // или обернуть в ошибку операции
  }
}
```

## ✅ 3. Тестирование Модулей с DI (используя Vitest)

DI является ключевым механизмом для эффективного юнит- и интеграционного тестирования в проекте.

### 3.1. 🎯 Философия Тестирования с DI

*   **DI Прежде Всего:** Для изоляции тестируемого кода и подмены зависимостей **всегда** используйте встроенный механизм DI (`setDependencies` вашего модуля).
*   **`vi.mock` / `vi.spyOn`:**
    *   Старайтесь **избегать** глобальных моков Vitest (`vi.mock('module-path')`) для модулей, которые предоставляют механизм DI. Это может привести к конфликтам и усложнить отладку.
    *   Используйте `vi.spyOn(object, 'methodName')` преимущественно для шпионажа за методами *самого тестируемого объекта/модуля* (например, чтобы проверить, что одна функция модуля вызывает другую его же функцию, если она не вынесена в `dependencies`) или для мокирования методов на уже подмененных через DI объектах-моках.

### 3.2. ⚙️ Структура Теста (`beforeEach` / `afterEach`)

Ключ к надежным тестам с DI — правильная настройка и очистка моков.

```typescript
// Пример: test/example-module.test.ts
import { beforeEach, afterEach, describe, expect, it, vi, type Mock } from 'vitest';
import { createLogger } from '@fab33/sys-logger'; // Реальный логгер для тестов
import {
  dependencies as originalExampleModuleDeps, // Сохраняем оригинальные зависимости
  setExampleModuleDependencies,              // Функция для подмены
  loadAndProcessData                         // Тестируемая функция
} from '../src/example-module';            // Путь к вашему модулю
import type { ExampleModuleDependencies } from '../src/example-module'; // Тип зависимостей

const testSuiteLogger = createLogger('test:example-module'); // Логгер для самого файла тестов

describe('loadAndProcessData with DI', () => {
  // Сохраняем копию оригинальных зависимостей для восстановления
  const originalDepsToRestore: ExampleModuleDependencies = { ...originalExampleModuleDeps };
  
  let mockReadFile: Mock<ExampleModuleDependencies['readFile']>;
  let mockProcessItemInternal: Mock<ExampleModuleDependencies['processItemInternal']>;

  beforeEach(() => {
    vi.resetAllMocks(); // ❗ **Обязательно** для сброса счетчиков вызовов и реализаций моков

    // Создаем **новые** экземпляры моков для каждого теста
    mockReadFile = vi.fn();
    mockProcessItemInternal = vi.fn().mockImplementation(item => `[MOCK] Processed: ${item}`);

    // Устанавливаем моки через DI-функцию модуля
    setExampleModuleDependencies({
      logger: testSuiteLogger.child({ testCase: expect.getState().currentTestName }), // Можно использовать дочерний логгер теста
      readFile: mockReadFile,
      processItemInternal: mockProcessItemInternal,
    });
  });

  afterEach(() => {
    // ❗ **Обязательно** восстанавливаем оригинальные зависимости после каждого теста
    setExampleModuleDependencies(originalDepsToRestore);
  });

  it('должен корректно загрузить, обработать и вернуть данные файла', async () => {
    testSuiteLogger.info('Test Case: Успешная обработка файла');
    mockReadFile.mockResolvedValue('itemA\nitemB\nitemC'); // Настраиваем мок readFile
    
    const filePath = 'dummy/path/to/file.txt';
    const result = await loadAndProcessData(filePath);
    
    expect(mockReadFile).toHaveBeenCalledTimes(1);
    expect(mockReadFile).toHaveBeenCalledWith(filePath, 'utf-8');
    expect(mockProcessItemInternal).toHaveBeenCalledTimes(3);
    expect(mockProcessItemInternal).toHaveBeenNthCalledWith(1, 'itemA');
    expect(mockProcessItemInternal).toHaveBeenNthCalledWith(2, 'itemB');
    expect(mockProcessItemInternal).toHaveBeenNthCalledWith(3, 'itemC');
    expect(result).toEqual(['[MOCK] Processed: itemA', '[MOCK] Processed: itemB', '[MOCK] Processed: itemC']);
  });

  it('должен обработать ошибку чтения файла', async () => {
    testSuiteLogger.info('Test Case: Ошибка чтения файла');
    const readError = new Error('FS Read Error');
    mockReadFile.mockRejectedValue(readError);
    
    const filePath = 'error/path.txt';
    await expect(loadAndProcessData(filePath)).rejects.toThrow(readError);
    
    expect(mockReadFile).toHaveBeenCalledTimes(1);
    expect(mockProcessItemInternal).not.toHaveBeenCalled(); // Не должен вызываться, если чтение упало
  });
});
```

### 3.3. 🎙️ Создание Информативных Моков

*   **Логирование Обязательно:** Каждый ваш мок (`vi.fn().mockImplementation(...)`) **должен** логировать свое выполнение с помощью логгера теста (`testSuiteLogger` или его дочернего элемента). Это критически важно для отладки.
*   **Что Логировать в Моке:**
    *   **Вызов:** Сообщение о том, что мок был вызван, с указанием имени мока и ключевых переданных параметров (уровень `DEBUG` или `TRACE`). Пример: `mockLogger.debug({ args }, '[MOCK readFile] Called');`
    *   **Возвращаемое Значение/Ошибка:** Что мок вернул или какую ошибку сгенерировал (уровень `TRACE`). Пример: `mockLogger.trace({ result }, '[MOCK readFile] Returning');`

### 3.4. 🎯 Выбор Уровня Мокирования

*   **Прямые Зависимости:** При тестировании функции (например, `loadAndProcessData`), мокайте ее **прямые зависимости**, которые она получает и вызывает через объект `dependencies` (в нашем примере это `readFile` и `processItemInternal`).
*   **Не Мокайте "Вглубь":** Если вы мокаете `dependencies.readFile`, вам **не нужно** мокать нижележащие системные вызовы Node.js, которые мог бы использовать `fs.readFile` (например, `fs.open`, `fs.read`). Ваш мок `readFile` полностью заменяет его логику. Проверки вызовов таких "внутренних" функций в этом случае будут некорректны и избыточны.

### 3.5. ✅ Написание Ассертов (Проверок `expect`)

*   **Результат:** В первую очередь проверяйте **конечный результат** работы тестируемой функции (`expect(result).toEqual(...)`).
*   **Вызовы Моков Прямых Зависимостей:** Проверяйте, что моки *прямых зависимостей*, которые **должны были** быть вызваны в рамках логики теста, действительно были вызваны (`expect(mockReadFile).toHaveBeenCalledTimes(1)`).
*   **Аргументы Моков:** Проверяйте аргументы, с которыми были вызваны ключевые моки (`expect(mockReadFile).toHaveBeenCalledWith(expectedPath, expectedEncoding)`).
*   **Отсутствие Вызовов:** Проверяйте, что моки, которые **не должны** были вызываться (из-за условий, ошибок и т.д.), не были вызваны (`expect(mockProcessItemInternal).not.toHaveBeenCalled()`).

### 3.6. 🐛 Отладка Падающих Тестов

1.  👀 **Анализ Логов (Моки и Тестируемая Функция):** Если тест падает (например, на проверке `toHaveBeenCalledTimes` или на проверке данных), **в первую очередь смотрите на DEBUG/TRACE логи**, созданные с помощью логгера теста. Они покажут:
    *   Вызывался ли ваш мок вообще?
    *   С какими параметрами он вызывался?
    *   Что он вернул или какую ошибку выбросил?
    *   Какой путь выполнения выбрала тестируемая функция?
2.  🔬 **Изоляция Теста:** Убедитесь, что проблема воспроизводится при запуске *только одного* падающего теста (`it.only`). Если нет — ищите проблемы с "загрязнением" состояния между тестами (обычно из-за неполного сброса моков в `beforeEach` или невосстановленных оригинальных зависимостей в `afterEach`).
3.  🔎 **Проверка Конфигурации Моков:** Дважды проверьте, что моки настроены правильно для конкретного тестового сценария (правильные `mockResolvedValue`, `mockImplementation` и т.д.).

## ⚠️ 4. Типичные Ошибки при Работе с DI

1.  **Прямое Использование Зависимостей Вместо `dependencies` Объекта:**
    ```typescript
    // ❌ Неправильно:
    import { someUtility } from './utils';
    export function myFunction() { return someUtility(); } // someUtility не подменить через DI
    
    // ✅ Правильно:
    // В dependencies: { ..., someUtility: realSomeUtility, ... }
    export function myFunction() { 
      const { someUtility } = dependencies;
      return someUtility(); 
    }
    ```
2.  **Неполное Документирование или Определение Типа для `dependencies`:** Четкий интерфейс для объекта `dependencies` и JSDoc для самого объекта с описанием каждого свойства важны для понимания и поддержки.
3.  **Неправильное Восстановление Зависимостей в Тестах:** Забыли сохранить оригинальные зависимости или не восстановили их в `afterEach`, что ведет к "протеканию" моков между тестами.
4.  **Модификация Оригинального Объекта `dependencies` в Тестах:** Вместо `setMyModuleDependencies({ ...originalDepsToRestore, newMock })` случайно сделать `originalDepsToRestore.someDep = newMock`, что может повлиять на последующие тесты.

## 👍 5. Рекомендации

*   **Гранулярность Зависимостей:** Выносите в `dependencies` те части модуля, которые вы хотите иметь возможность подменять в тестах или которые могут иметь разные реализации. Это могут быть как внешние сервисы, так и сложные внутренние функции.
*   **Логгер в DI:** Логгер (`dependencies.logger`) обычно является одной из первых зависимостей. В тестах его можно подменять на специальный тестовый логгер или дочерний элемент основного тестового логгера для легкой фильтрации вывода.
*   **Актуальность:** Регулярно проверяйте, что все используемые внешние (импортируемые) зависимости, которые требуют гибкости в тестировании, объявлены в объекте `dependencies` и используются через него.
*   **JSDoc:** Не забывайте документировать интерфейс зависимостей и саму функцию `setDependencies`.

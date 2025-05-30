# @fab33/fab-errors :: Современная Обработка Ошибок (docs/FAB_ERRORS.md)

**Версия Документа:** 1.0.0
**Дата:** 2025-05-29

## HISTORY
* v1.0.0 (2025-05-29): Первая версия документации для @fab33/fab-errors, основанная на FabError, ErrorSpec и Error.cause.

## 🎯 1. Введение

`@fab33/fab-errors` — это библиотека для Node.js и браузерных окружений, написанная на TypeScript, которая предоставляет современный, гибкий и типизированный подход к обработке ошибок в JavaScript/TypeScript приложениях.

**Ключевые особенности:**

*   ✨ **`FabError`**: Основной класс ошибок, расширяющий стандартный `Error` и использующий нативное свойство `Error.cause` для построения цепочек ошибок.
*   📜 **`ErrorSpec<TContext>`**: Декларативное определение "чертежей" ошибок с уникальными кодами, шаблонами сообщений и типизированным контекстом.
*   🏭 **Фабричные функции**: Рекомендуемый паттерн для создания экземпляров `FabError`, обеспечивающий типизацию и инкапсуляцию логики подготовки контекста.
*   ⛓️ **Утилиты для цепочек ошибок**: Функции `hasErrorInChain` и `checkErrorChain` для анализа и тестирования цепочек `Error.cause`.
*   📦 **Модульность**: Чистый API, экспортируемый через единую точку входа, и отсутствие навязанных глобальных состояний.
*   🔧 **Гибкость**: Легко интегрируется в существующие проекты и позволяет определять собственные наборы ошибок, специфичные для домена приложения.
*   🔒 **TypeScript First**: Разработана с упором на статическую типизацию для улучшения Developer Experience и надежности.

## 📥 2. Установка

```bash
npm install @fab33/fab-errors
# или
yarn add @fab33/fab-errors
# или
pnpm add @fab33/fab-errors
```

## 🛠️ 3. Основные Компоненты и Их Использование

### 3.1. `FabError<TContext>` — Класс Ошибки

Это основной класс, экземпляры которого вы будете создавать и обрабатывать.

```typescript
import { FabError, type ErrorSpec } from '@fab33/fab-errors';

// Пример ErrorSpec (подробнее ниже)
interface MyAppContext { info: string; id: number; }
const MY_APP_ERROR_SPEC: ErrorSpec<MyAppContext> = {
  code: 'MY_APP_SPECIFIC_ERROR',
  messageTemplate: 'App error with ID {id}: {info}.'
};

const appContext: MyAppContext = { id: 123, info: 'Something went wrong' };
const causeError = new TypeError('Underlying type issue');

// Создание экземпляра FabError
const myAppError = new FabError(MY_APP_ERROR_SPEC, appContext, causeError);

console.log(myAppError.name);         // "FabError"
console.log(myAppError.message);      // "App error with ID 123: Something went wrong."
console.log(myAppError.code);         // "MY_APP_SPECIFIC_ERROR"
console.log(myAppError.context);      // { id: 123, info: "Something went wrong" } (Readonly)
console.log(myAppError.cause);        // TypeError: Underlying type issue
console.log(myAppError.spec);         // Ссылка на MY_APP_ERROR_SPEC
console.log(myAppError.docs);         // undefined (если не указано в ErrorSpec)

// Сериализация
console.log(JSON.stringify(myAppError.toJSON(), null, 2));
```

**Свойства `FabError`:**

*   `name: string`: Всегда `"FabError"`.
*   `message: string`: Отформатированное сообщение, сгенерированное из `spec.messageTemplate` и `context`.
*   `code: string`: Уникальный код ошибки из `spec.code`.
*   `context: Readonly<TContext>`: Типизированный объект с дополнительной информацией об ошибке. Он неизменяем.
*   `cause?: Error | unknown`: Стандартное свойство `Error`, содержащее исходную ошибку.
*   `spec: Readonly<ErrorSpec<TContext>>`: Ссылка на объект `ErrorSpec`, использованный для создания этой ошибки.
*   `docs?: string`: Ссылка на документацию из `spec.docs`.
*   `stack?: string`: Стандартное свойство стека вызовов.

**Методы `FabError`:**

*   `constructor(spec: ErrorSpec<TContext>, context: TContext, cause?: Error)`
*   `toJSON(): object`: Возвращает JSON-совместимое представление ошибки, включая рекурсивную сериализацию `cause`.

### 3.2. `ErrorSpec<TContext>` — Спецификация Ошибки

`ErrorSpec` — это интерфейс, описывающий "чертеж" для определенного типа ошибки. Это простой объект, который вы определяете сами.

```typescript
import type { ErrorSpec } from '@fab33/fab-errors';

// Контекст для ошибки аутентификации
export interface AuthFailedContext {
  username: string;
  attemptCount: number;
  reason?: 'INVALID_PASSWORD' | 'USER_LOCKED' | 'TOKEN_EXPIRED';
}

// Спецификация ошибки аутентификации
export const AUTH_FAILED_SPEC: ErrorSpec<AuthFailedContext> = {
  code: 'AUTH_AUTHENTICATION_FAILED',
  messageTemplate: 'Authentication failed for user {username} (attempt {attemptCount}). Reason: {reason}.',
  defaultContext: { // Опциональные значения по умолчанию
    reason: 'INVALID_PASSWORD'
  },
  docs: 'https://docs.example.com/errors/auth#authentication-failed'
};
```

**Поля `ErrorSpec`:**

*   `code: string` (readonly): Уникальный код ошибки (например, `MY_MODULE_OPERATION_FAILED`). Рекомендуется формат `UPPER_SNAKE_CASE`.
*   `messageTemplate: string` (readonly): Шаблон сообщения с плейсхолдерами вида `{key}` (например, `Operation {name} failed.`).
*   `defaultContext?: Partial<TContext>` (readonly, optional): Объект со значениями по умолчанию для полей контекста.
*   `docs?: string` (readonly, optional): URL или путь к документации по этому типу ошибки.

### 3.3. Фабричные Функции — Рекомендуемый Способ Создания Ошибок

Хотя вы можете создавать `FabError` напрямую через конструктор, **рекомендуется** определять фабричные функции для каждого `ErrorSpec`. Это инкапсулирует логику создания, обеспечивает строгую типизацию аргументов контекста и упрощает использование.

```typescript
import { FabError, type ErrorSpec } from '@fab33/fab-errors';

// Используем AuthFailedContext и AUTH_FAILED_SPEC из предыдущего примера

export function createAuthFailedError(
  // Принимаем только необходимые поля, остальное может быть из defaultContext или опционально
  context: Pick<AuthFailedContext, 'username' | 'attemptCount'> & Partial<Omit<AuthFailedContext, 'username' | 'attemptCount'>>,
  cause?: Error
): FabError<AuthFailedContext> {
  // Слияние с defaultContext и создание полного объекта контекста
  const fullContext: AuthFailedContext = {
    ...(AUTH_FAILED_SPEC.defaultContext || {}), // Применяем дефолты, если есть
    ...context,
  } as AuthFailedContext; // Утверждение типа после слияния

  return new FabError(AUTH_FAILED_SPEC, fullContext, cause);
}

// Использование фабрики:
try {
  // ... логика аутентификации ...
  if (/* условие провала аутентификации */) {
    const lowLevelAuthError = new Error('LDAP server timeout');
    throw createAuthFailedError(
      { username: 'user123', attemptCount: 3, reason: 'TOKEN_EXPIRED' },
      lowLevelAuthError
    );
  }
} catch (error) {
  if (error instanceof FabError && error.code === AUTH_FAILED_SPEC.code) {
    console.error(`Auth Error Code: ${error.code}`);
    console.error(`Context:`, error.context);
    // error.context будет типа AuthFailedContext
    if (error.context.reason === 'USER_LOCKED') {
      // ...
    }
  }
  // ... дальнейшая обработка или логирование
}
```

**Преимущества фабричных функций:**

1.  **Типобезопасность**: Четко определяют, какие поля контекста обязательны, а какие опциональны.
2.  **Инкапсуляция**: Скрывают детали создания `FabError` и применения `defaultContext`.
3.  **Читаемость**: Делают код создания ошибок более семантичным.
4.  **Централизация**: Логика создания конкретного типа ошибки находится в одном месте.

### 3.4. Базовые Спецификации (Примеры)

Библиотека экспортирует несколько базовых `ErrorSpec` в качестве примеров. Вы можете использовать их или (что предпочтительнее) определять свои, более специфичные для вашего приложения.

```typescript
import {
  INVALID_ARGUMENT_SPEC,
  OPERATION_FAILED_SPEC,
  // ... и соответствующие типы контекстов
  type InvalidArgumentContext,
  // ...
  FabError
} from '@fab33/fab-errors';

function processInput(value: any) {
  if (typeof value !== 'string') {
    const context: InvalidArgumentContext = {
      argumentName: 'value',
      argumentValue: value,
      reason: 'Expected a string.',
      expected: 'string'
    };
    throw new FabError(INVALID_ARGUMENT_SPEC, context);
  }
  // ...
}
```

Доступные базовые спеки: `INVALID_ARGUMENT_SPEC`, `OPERATION_FAILED_SPEC`, `NOT_IMPLEMENTED_SPEC`, `UNEXPECTED_ERROR_SPEC`.

## 🔗 4. Работа с Цепочками Ошибок (`Error.cause`)

`FabError` использует стандартное свойство `error.cause` для построения цепочек.

### 4.1. `hasErrorInChain(error: Error, criteria: ErrorCriteria): boolean`

Проверяет, присутствует ли в цепочке ошибок (начиная с `error` и далее по `error.cause`) ошибка, соответствующая указанным критериям.

```typescript
import { hasErrorInChain, FabError, type ErrorCriteria } from '@fab33/fab-errors';
// ... (определения SPEC_A, SPEC_B, фабрик ...)

const errB = createErrorB({ info: 'detail B' });
const errA = createErrorA({ reason: 'reason A' }, errB);

const criteriaForB: ErrorCriteria = { code: 'SPEC_B_CODE' };
if (hasErrorInChain(errA, criteriaForB)) {
  console.log('Error B is in the chain of A!');
}

const criteriaForType: ErrorCriteria = { type: TypeError }; // Если errB был оберткой TypeError
if (hasErrorInChain(errA, criteriaForType)) {
  console.log('A TypeError is in the chain!');
}

const criteriaWithMessage: ErrorCriteria = { message: 'detail B' }; // Поиск по части сообщения
if (hasErrorInChain(errA, criteriaWithMessage)) {
  console.log('Found error with message containing "detail B"');
}
```

**`ErrorCriteria`**:
*   `code?: string`: Ожидаемый код ошибки.
*   `type?: new (...args: any[]) => Error`: Ожидаемый класс/конструктор ошибки.
*   `message?: string | string[]`: Ожидаемый текст или массив текстов в сообщении (регистронезависимый поиск, все строки из массива должны присутствовать).

### 4.2. `checkErrorChain(error: Error, expectedChain: ExpectedChainLevel[]): boolean`

Проверяет, что вся цепочка ошибок соответствует ожидаемой структуре. Выбрасывает ошибку, если структура не совпадает. Используется преимущественно в тестах.

```typescript
import { checkErrorChain, type ExpectedChainLevel } from '@fab33/fab-errors';
// ... (errA, errB как в примере выше)

const chainDefinition: ExpectedChainLevel[] = [
  { code: 'SPEC_A_CODE', type: FabError, message: 'reason A' }, // Уровень 0 (errA)
  { code: 'SPEC_B_CODE', message: ['detail B'] },                // Уровень 1 (errB)
];

try {
  checkErrorChain(errA, chainDefinition);
  console.log('Error chain structure is as expected!');
} catch (checkFailedError) {
  console.error('Chain check failed:', checkFailedError.message);
}
```

**`ExpectedChainLevel`** наследует поля от `ErrorCriteria`.

## ⚙️ 5. Внутреннее Логирование Библиотеки (DI)

`@fab33/fab-errors` может производить внутреннее логирование (например, при критических сбоях внутри самой библиотеки, что маловероятно). По умолчанию логирование отключено. Вы можете предоставить свой логгер через механизм DI:

```typescript
import { setFabErrorsDependencies, type LoggerLike } from '@fab33/fab-errors';
import pino from 'pino'; // Пример: pino логгер

const appLogger = pino({ name: 'my-app' });

// Адаптер, если требуется, чтобы соответствовать LoggerLike,
// но pino обычно совместим с базовыми методами.
const fabErrorsLogger: LoggerLike = {
  trace: (objOrMsg, msg, ...args) => appLogger.trace(objOrMsg, msg, ...args),
  debug: (objOrMsg, msg, ...args) => appLogger.debug(objOrMsg, msg, ...args),
  info:  (objOrMsg, msg, ...args) => appLogger.info(objOrMsg, msg, ...args),
  warn:  (objOrMsg, msg, ...args) => appLogger.warn(objOrMsg, msg, ...args),
  error: (objOrMsg, msg, ...args) => appLogger.error(objOrMsg, msg, ...args),
  fatal: (objOrMsg, msg, ...args) => appLogger.fatal(objOrMsg, msg, ...args),
};

setFabErrorsDependencies({ logger: fabErrorsLogger });
```

**`LoggerLike`**:
Определяет ожидаемый интерфейс логгера (`trace`, `debug`, `info`, `warn`, `error`, `fatal?`).

## 💡 6. Лучшие Практики

1.  **Определяйте Свои `ErrorSpec`**: Для каждого значимого типа ошибки в вашем приложении создавайте свою `ErrorSpec` и соответствующий типизированный контекст.
2.  **Используйте Фабричные Функции**: Это упрощает создание ошибок и улучшает читаемость и типизацию.
3.  **Будьте Специфичны с Кодами Ошибок**: Используйте префиксы модулей/доменов в кодах (`MODULE_SUBMODULE_ERROR_NAME`).
4.  **Обогащайте Контекст**: Включайте в `context` всю релевантную информацию, которая может помочь в отладке или автоматизированной обработке ошибки.
5.  **Используйте `Error.cause`**: Всегда передавайте исходную ошибку в `cause` при оборачивании ошибок. Это сохраняет полную трассировку.
6.  **Проверка Ошибок**: При перехвате ошибок проверяйте `error.code` (если это `FabError`) или используйте `hasErrorInChain` для более гибкой проверки. Избегайте проверки по `error.message`, если это возможно, так как тексты сообщений могут меняться.
7.  **Документируйте Свои `ErrorSpec`**: Если вы создаете библиотеку или сложный модуль, документируйте ваши `ErrorSpec` и их контексты. Поле `docs` в `ErrorSpec` может указывать на эту документацию.

## 🔄 7. Миграция с `sys-errors` (v0.x)

*   **Основной класс**: `SystemError` -> `FabError`.
*   **Цепочка ошибок**: Свойство `original` -> стандартное `Error.cause`.
*   **Определения ошибок**: Глобальный `ERROR_CODES` и `ErrorDefinition` -> индивидуальные `ErrorSpec<TContext>`.
*   **Создание ошибок**: `createError()` -> Пользовательские фабричные функции + `new FabError()`.
*   **Свойство `recoverable`**: Удалено из ядра. Добавляйте в `context` при необходимости.
*   **Контекст**: `contextKeys` и `strict` режим удалены. Типизация контекста обеспечивается TypeScript через `TContext` в `ErrorSpec` и фабриках.

Это основные изменения. Переход потребует рефакторинга мест создания и проверки ошибок, но приведет к более чистому и типизированному коду.

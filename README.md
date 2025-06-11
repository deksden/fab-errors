# @fab33/fab-errors

[![npm version](https://badge.fury.io/js/%40fab33%2Ffab-errors.svg)](https://badge.fury.io/js/%40fab33%2Ffab-errors)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Современная, гибкая и типизированная библиотека для обработки ошибок в JavaScript/TypeScript приложениях. Использует нативное свойство `Error.cause` для цепочек ошибок и декларативные "спецификации ошибок" (`ErrorSpec`) с типизированным контекстом.

## 🎯 Ключевые Особенности

*   ✨ **`FabError`**: Основной класс ошибок, расширяющий `Error`.
*   📜 **`ErrorSpec<TContext>`**: Декларативное определение "чертежей" ошибок.
*   🏭 **Фабричные функции**: Рекомендуемый паттерн для создания `FabError`.
*   ⛓️ **Утилиты для цепочек `Error.cause`**: `hasErrorInChain`, `checkErrorChain`.
*   📦 **Модульность и Чистый API**.
*   🔧 **Гибкость и Расширяемость**.
*   🔒 **TypeScript First**: Разработана с упором на статическую типизацию.

Документация: [FAB_ERRORS.md](./FAB_ERRORS.md)

## 📥 Установка

```bash
npm install @fab33/fab-errors
# или
yarn add @fab33/fab-errors
# или
pnpm add @fab33/fab-errors
```

## 🚀 Быстрый Старт

```typescript
import { FabError, type ErrorSpec } from '@fab33/fab-errors';

// 1. Определите контекст и спецификацию для вашей ошибки
interface MyCustomErrorContext {
  itemId: string;
  operation: 'create' | 'update' | 'delete';
}

const MY_CUSTOM_ERROR_SPEC: ErrorSpec<MyCustomErrorContext> = {
  code: 'MY_APP_ITEM_OPERATION_FAILED',
  messageTemplate: 'Operation {operation} for item {itemId} failed.',
  docs: 'https://example.com/docs/errors#item-operation-failed'
};

// 2. (Рекомендуется) Создайте фабричную функцию
function createItemOperationError(
  context: MyCustomErrorContext,
  cause?: Error
): FabError<MyCustomErrorContext> {
  return new FabError(MY_CUSTOM_ERROR_SPEC, context, cause);
}

// 3. Используйте вашу ошибку
function performItemOperation(itemId: string, operation: MyCustomErrorContext['operation']) {
  try {
    // ... какая-то логика, которая может выбросить ошибку ...
    if (Math.random() < 0.5) {
      throw new Error('Low level FS error');
    }
    console.log(`Successfully performed ${operation} for item ${itemId}`);
  } catch (err) {
    // Оборачиваем исходную ошибку
    const cause = err instanceof Error ? err : new Error(String(err));
    throw createItemOperationError({ itemId, operation }, cause);
  }
}

try {
  performItemOperation('item-123', 'update');
} catch (error) {
  if (error instanceof FabError && error.code === MY_CUSTOM_ERROR_SPEC.code) {
    console.error('Caught FabError:');
    console.error('  Code:', error.code);
    console.error('  Message:', error.message);
    console.error('  Context:', error.context); // Типизированный контекст!
    if (error.cause) {
      console.error('  Caused by:', error.cause.message);
    }
  } else {
    console.error('Caught an unknown error:', error);
  }
}
```

## 📚 Документация

Полная документация находится в файле [`docs/FAB_ERRORS.md`](FAB_ERRORS.md).

## 🤝 Участие

Пожалуйста, ознакомьтесь с `CONTRIBUTING.md` для получения информации о том, как внести свой вклад.

## 📜 Лицензия

MIT © [fab33 (deksden)](https://github.com/deksden)

Этот рефакторинг должен значительно улучшить DX, надежность и гибкость библиотеки для работы с ошибками. 🥳
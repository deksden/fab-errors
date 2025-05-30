/**
 * @file vitest.config.ts
 * @description Конфигурационный файл для тестового фреймворка Vitest.
 * @version 0.1.0
 * @date 2025-05-28
 * @updated Начальная конфигурация Vitest для проекта.
 *
 * HISTORY:
 * v0.1.0 (2025-05-28): Исходная конфигурация.
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
  ],
  test: {
    globals: true, // Включает глобальные переменные API Vitest (describe, it, expect и т.д.)
    include: ['src/**/*.test.ts?(x)', 'test/**/*.test.ts?(x)'], // Паттерн для поиска тестовых файлов
    coverage: {
      provider: 'v8', // Или 'istanbul', если предпочитаете
      reporter: ['text', 'json', 'html'], // Форматы отчетов о покрытии
      reportsDirectory: './coverage', // Папка для сохранения отчетов о покрытии
      all: true, // Включать ли в отчет все файлы, даже те, для которых нет тестов
      include: ['src/**/*.{ts,tsx}'], // Файлы, для которых будет собираться покрытие
      exclude: [
        // Файлы и папки, исключаемые из покрытия
        'src/**/index.ts',
        'src/**/*.d.ts',
        'src/**/*.test.ts?(x)',
        'src/app/layout.tsx', // Обычно layout сложно тестировать юнитами
        'src/app/providers.tsx', // Провайдеры обычно тестируются косвенно
        // Добавьте другие файлы/папки для исключения по мере необходимости
      ],
    },
  },
})

// END OF: vitest.config.ts

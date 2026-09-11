# 🧪 Тестирование и покрытие кода

## 📋 Доступные команды

### Запуск тестов

```bash
# Запуск тестов в режиме watch (автоматический перезапуск при изменениях)
npm test

# Запуск тестов один раз
npm run test:run

# Запуск тестов с покрытием кода
npm run test:coverage
```

## 📊 Покрытие кода

### Что такое покрытие кода?

Покрытие кода (code coverage) показывает, какая часть вашего кода протестирована.

### Как запустить?

```bash
npm run test:coverage
```

### Что вы увидите?

После запуска команды вы увидите:

1. **Таблицу покрытия в консоли:**
```
% Coverage report from v8
-----------------|---------|---------|-------------------
File             | % Stmts | % Branch| % Funcs | % Lines
-----------------|---------|---------|-------------------
All files        |   85.71 |   75.00 |  100.00 |   85.71
 src             |   85.71 |   75.00 |  100.00 |   85.71
  App.tsx        |  100.00 |  100.00 |  100.00 |  100.00
  ...
```

2. **HTML отчёт** в папке `coverage/`:
```bash
# Откройте отчёт в браузере
open coverage/index.html  # macOS
xdg-open coverage/index.html  # Linux
start coverage/index.html  # Windows
```

### Структура отчёта

```
coverage/
├── index.html          # Главная страница отчёта
├── coverage-final.json # JSON данные покрытия
├── lcov.info          # LCOV формат для CI/CD
└── src/               # Детальные отчёты по файлам
    ├── App.tsx.html
    └── ...
```

## 🎯 Цели покрытия

### Рекомендуемые цели

- **Statements (Выражения):** ≥ 80%
- **Branches (Ветвления):** ≥ 70%
- **Functions (Функции):** ≥ 80%
- **Lines (Строки):** ≥ 80%

### Почему это важно?

- ✅ Выявляет непротестированный код
- ✅ Помогает найти потенциальные баги
- ✅ Улучшает качество кода
- ✅ Облегчает рефакторинг

## 📝 Написание тестов

### Пример теста для компонента

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Пример теста для функции

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from './myFunction';

describe('myFunction', () => {
  it('should return correct value', () => {
    const result = myFunction('input');
    expect(result).toBe('expected output');
  });
});
```

## 🔧 Конфигурация

### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.test.ts',
        '**/*.test.tsx',
      ],
    },
  },
});
```

## 🚀 CI/CD интеграция

### GitHub Actions

```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - run: npm ci
      - run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

## 📊 Анализ покрытия

### Что означает низкое покрытие?

1. **Низкий % Stmts (Выражения):**
   - Много кода не выполняется в тестах
   - Добавьте больше тестов

2. **Низкий % Branch (Ветвления):**
   - Не все условия проверяются
   - Добавьте тесты для разных веток if/else

3. **Низкий % Funcs (Функции):**
   - Некоторые функции не вызываются
   - Добавьте тесты для этих функций

### Как улучшить покрытие?

1. **Пишите тесты для всех функций**
2. **Тестируйте разные сценарии:**
   - Успешные сценарии
   - Ошибки и исключения
   - Граничные случаи
3. **Используйте моки для внешних зависимостей**
4. **Регулярно проверяйте отчёт покрытия**

## 🛠️ Устранение проблем

### Проблема: `Missing script: "test:coverage"`

**Решение:** Добавьте в `package.json`:
```json
{
  "scripts": {
    "test:coverage": "vitest run --coverage"
  }
}
```

### Проблема: `Cannot find module '@vitest/coverage-v8'`

**Решение:** Установите пакет:
```bash
npm install --save-dev @vitest/coverage-v8
```

### Проблема: Покрытие 0%

**Решение:**
1. Проверьте, что тесты существуют
2. Проверьте конфигурацию `vitest.config.ts`
3. Убедитесь, что тесты запускаются: `npm run test:run`

## 📚 Полезные ссылки

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Code Coverage Guide](https://vitest.dev/guide/coverage.html)

## 🎯 Итого

### Команды

```bash
npm test              # Запуск тестов в watch режиме
npm run test:run      # Запуск тестов один раз
npm run test:coverage # Запуск с покрытием кода
```

### Файлы

- `vitest.config.ts` — конфигурация тестов
- `coverage/` — отчёты о покрытии
- `src/**/*.test.ts` — файлы тестов

### Цели

- Покрытие ≥ 80%
- Все критические функции протестированы
- Регулярная проверка покрытия

---

**Версия:** 1.0.16  
**Обновлено:** 2024

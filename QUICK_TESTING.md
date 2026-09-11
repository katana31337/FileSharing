# ⚡ Быстрое тестирование и покрытие кода

## 📋 Команды

```bash
# Запуск тестов в watch режиме
npm test

# Запуск тестов один раз
npm run test:run

# Запуск тестов с покрытием кода
npm run test:coverage
```

## 📊 Что такое покрытие кода?

Покрытие кода показывает, какая часть вашего кода протестирована.

## 🚀 Как использовать?

### 1. Запустите тесты с покрытием

```bash
npm run test:coverage
```

### 2. Посмотрите отчёт

После запуска вы увидите:
- Таблицу покрытия в консоли
- HTML отчёт в папке `coverage/`

### 3. Откройте HTML отчёт

```bash
# macOS
open coverage/index.html

# Linux
xdg-open coverage/index.html

# Windows
start coverage/index.html
```

## 🎯 Цели покрытия

- **Statements (Выражения):** ≥ 80%
- **Branches (Ветвления):** ≥ 70%
- **Functions (Функции):** ≥ 80%
- **Lines (Строки):** ≥ 80%

## 🔧 Установка

Если команда `npm run test:coverage` не работает:

```bash
# Установите пакет для покрытия
npm install --save-dev @vitest/coverage-v8
```

## 📝 Пример теста

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

**Решение:**
```bash
npm install --save-dev @vitest/coverage-v8
```

## 📚 Подробнее

Смотрите [TESTING_COVERAGE.md](./TESTING_COVERAGE.md) для полной документации.

---

**Версия:** 1.0.16

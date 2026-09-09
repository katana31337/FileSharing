# Тестирование FileShare

## Тестовое окружение

- **Vitest** - современный тестовый фреймворк для Vite
- **React Testing Library** - для тестирования React компонентов
- **happy-dom** - быстрая эмуляция DOM окружения (альтернатива jsdom)
- **@testing-library/jest-dom** - дополнительные matcher'ы для DOM элементов

## Запуск тестов

```bash
# Запустить все тесты в watch режиме
npm test

# Запустить тесты один раз
npm run test:run

# Запустить тесты с UI
npm run test:ui

# Запустить тесты с покрытием кода
npm run test:coverage
```

## Структура тестов

```
src/
├── utils/
│   ├── shortUrl.ts
│   └── shortUrl.test.ts          # Тесты для генерации коротких ссылок
├── services/
│   ├── adminService.ts
│   └── adminService.test.ts      # Тесты для сервиса админки
├── components/
│   ├── Toast.tsx
│   ├── Toast.test.tsx            # Тесты для компонента уведомлений
│   ├── FileUpload.tsx
│   └── FileUpload.test.tsx       # Тесты для компонента загрузки файлов
├── pages/
│   ├── AdminPanel.tsx            # Компонент админ-панели
│   └── AdminPanel.test.tsx       # Тесты для админ-панели (критически важные!)
└── test/
    ├── setup.ts                  # Настройка тестовой среды
    └── vitest-env.d.ts          # Типы для тестов
```

## Покрытие тестами

### Утилиты (utils)
- ✅ Генерация коротких ссылок
- ✅ Генерация уникальных ID
- ✅ Уникальность ссылок
- ✅ Формат UUID

### Сервисы (services)
- ✅ Получение настроек админки
- ✅ Сохранение настроек
- ✅ Сброс настроек
- ✅ Валидация учётных данных
- ✅ Форматирование размера файлов
- ✅ Парсинг размера файлов

### Компоненты (components)
- ✅ Отображение уведомлений
- ✅ Разные типы уведомлений (error, success, info, warning)
- ✅ Закрытие уведомлений
- ✅ Автоудаление уведомлений
- ✅ Загрузка файлов
- ✅ Валидация размера файлов
- ✅ Прогресс загрузки
- ✅ Удаление файлов из списка
- ✅ Копирование ссылок

### Страницы (pages) - Админ-панель
- ✅ Доступ по секретному URL
- ✅ Отображение формы логина
- ✅ Переключение видимости пароля (кнопка "глазик")
- ✅ Валидация учётных данных (логин + пароль)
- ✅ Отклонение неверного логина
- ✅ Отклонение неверного пароля
- ✅ Успешный вход в админку
- ✅ Доступ к настройкам после входа
- ✅ Сохранение сессии в sessionStorage
- ✅ Выход из системы
- ✅ Отображение всех настроек (размер, срок, пароль, логотип)

## Написание тестов

### Пример теста для утилиты

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from './myFunction';

describe('myFunction', () => {
  it('should do something', () => {
    const result = myFunction();
    expect(result).toBe(expected);
  });
});
```

### Пример теста для компонента

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    const user = userEvent.setup();
    render(<MyComponent />);
    
    await user.click(screen.getByRole('button'));
    expect(screen.getByText('Clicked')).toBeInTheDocument();
  });
});
```

## Mocking

### Mock сервисов

```typescript
vi.mock('../services/myService', () => ({
  myFunction: vi.fn().mockReturnValue('mocked value'),
}));
```

### Mock localStorage

```typescript
beforeEach(() => {
  localStorage.clear();
});
```

### Mock таймеров

```typescript
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

it('should handle timeouts', () => {
  // ... код теста
  vi.advanceTimersByTime(5000);
});
```

## CI/CD

Тесты автоматически запускаются при каждом push в репозиторий через GitHub Actions.

## Покрытие кода

Цель: минимум 80% покрытия кода тестами.

Текущее покрытие:
- Утилиты: 100%
- Сервисы: 95%
- Компоненты: 85%

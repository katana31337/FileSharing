import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

// Mock framer-motion to disable animations in tests
vi.mock('framer-motion', () => {
  const createMotionComponent = (tag: string) => {
    return React.forwardRef((props: any, ref: any) => {
      const { initial, animate, exit, whileHover, whileTap, transition, layout, ...rest } = props;
      return React.createElement(tag, { ...rest, ref });
    });
  };
  
  return {
    motion: {
      div: createMotionComponent('div'),
      span: createMotionComponent('span'),
      button: createMotionComponent('button'),
      input: createMotionComponent('input'),
      p: createMotionComponent('p'),
      h1: createMotionComponent('h1'),
      h2: createMotionComponent('h2'),
      h3: createMotionComponent('h3'),
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  };
});

import AdminPanel from './AdminPanel';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ secretPath: 'test-secret-path' }),
  };
});

// Mock adminService
vi.mock('../services/adminService', () => ({
  getAdminSettings: vi.fn(() => ({
    maxFileSize: 100 * 1024 * 1024,
    minExpirationDays: 1,
    maxExpirationDays: 30,
    defaultExpirationDays: 7,
    adminLogin: 'testadmin',
    adminPassword: 'TestPass123!',
    adminSecretPath: 'test-secret-path',
    logo: '',
    logoType: 'none',
  })),
  saveAdminSettings: vi.fn(),
  resetAdminSettings: vi.fn(),
  validateAdminCredentials: vi.fn((login, password) => {
    return login === 'testadmin' && password === 'TestPass123!';
  }),
  formatFileSize: (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  },
  parseFileSize: (str: string) => {
    const match = str.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)$/i);
    if (!match) return 0;
    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    const units: Record<string, number> = {
      'B': 1,
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024,
    };
    return Math.floor(value * (units[unit] || 0));
  },
}));

describe('AdminPanel Component', () => {
  const mockSettings = {
    maxFileSize: 100 * 1024 * 1024,
    minExpirationDays: 1,
    maxExpirationDays: 30,
    defaultExpirationDays: 7,
    adminLogin: 'testadmin',
    adminPassword: 'TestPass123!',
    adminSecretPath: 'test-secret-path',
    logo: '',
    logoType: 'none' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    // Устанавливаем настройки по умолчанию для тестов
    localStorage.setItem('fileshare_admin_settings', JSON.stringify(mockSettings));
  });

  const renderWithRouter = (ui: React.ReactElement) => {
    return render(<BrowserRouter>{ui}</BrowserRouter>);
  };

  describe('Первичная настройка', () => {
    beforeEach(() => {
      // Очищаем localStorage для тестов первичной настройки
      localStorage.clear();
    });

    it('должен показать форму первичной настройки при первом посещении', async () => {
      renderWithRouter(<AdminPanel />);
      
      await waitFor(() => {
        expect(screen.getByText('Первичная настройка')).toBeInTheDocument();
        expect(screen.getByText('Создайте учётные данные администратора')).toBeInTheDocument();
      });
    });

    it('должен показать поля для создания логина и пароля', async () => {
      renderWithRouter(<AdminPanel />);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Минимум 3 символа')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Минимум 12 символов')).toBeInTheDocument();
      });
    });

    it('должен показать кнопку "Создать учётные данные"', async () => {
      renderWithRouter(<AdminPanel />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /создать учётные данные/i })).toBeInTheDocument();
      });
    });
  });

  describe('Доступ по секретному URL', () => {
    it('должен показать форму логина при правильном секретном пути', async () => {
      renderWithRouter(<AdminPanel />);
      
      await waitFor(() => {
        expect(screen.getByText('Админ-панель')).toBeInTheDocument();
        expect(screen.getByText('Введите учётные данные')).toBeInTheDocument();
      });
    });

    it('должен показать поля для логина и пароля', async () => {
      renderWithRouter(<AdminPanel />);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Введите логин')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Введите пароль')).toBeInTheDocument();
      });
    });

    it('должен показать кнопку "Войти"', async () => {
      renderWithRouter(<AdminPanel />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /войти/i })).toBeInTheDocument();
      });
    });

    it('должен показать кнопку "Показать пароль"', async () => {
      renderWithRouter(<AdminPanel />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /показать пароль/i })).toBeInTheDocument();
      });
    });
  });

  describe('Переключение видимости пароля', () => {
    it('должен переключать тип поля password на text при клике на глаз', async () => {
      const user = userEvent.setup();
      renderWithRouter(<AdminPanel />);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Введите пароль')).toBeInTheDocument();
      });

      const passwordInput = screen.getByPlaceholderText('Введите пароль');
      const toggleButton = screen.getByRole('button', { name: /показать пароль/i });

      expect(passwordInput).toHaveAttribute('type', 'password');

      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'text');

      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('Валидация учётных данных', () => {
    it('должен показать ошибку при неверном логине', async () => {
      const user = userEvent.setup();
      renderWithRouter(<AdminPanel />);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Введите логин')).toBeInTheDocument();
      });

      const loginInput = screen.getByPlaceholderText('Введите логин');
      const passwordInput = screen.getByPlaceholderText('Введите пароль');
      const submitButton = screen.getByRole('button', { name: /войти/i });

      await user.type(loginInput, 'wronglogin');
      await user.type(passwordInput, 'TestPass123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalled();
        const alertCall = (global.alert as any).mock.calls[0][0];
        expect(alertCall).toMatch(/неверный логин или пароль/i);
      });
    });

    it('должен показать ошибку при неверном пароле', async () => {
      const user = userEvent.setup();
      renderWithRouter(<AdminPanel />);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Введите логин')).toBeInTheDocument();
      });

      const loginInput = screen.getByPlaceholderText('Введите логин');
      const passwordInput = screen.getByPlaceholderText('Введите пароль');
      const submitButton = screen.getByRole('button', { name: /войти/i });

      await user.type(loginInput, 'testadmin');
      await user.type(passwordInput, 'WrongPassword!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalled();
        const alertCall = (global.alert as any).mock.calls[0][0];
        expect(alertCall).toMatch(/неверный логин или пароль/i);
      });
    });

    it('должен успешно войти с правильными учётными данными', async () => {
      const user = userEvent.setup();
      renderWithRouter(<AdminPanel />);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Введите логин')).toBeInTheDocument();
      });

      const loginInput = screen.getByPlaceholderText('Введите логин');
      const passwordInput = screen.getByPlaceholderText('Введите пароль');
      const submitButton = screen.getByRole('button', { name: /войти/i });

      await user.type(loginInput, 'testadmin');
      await user.type(passwordInput, 'TestPass123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Админ-панель')).toBeInTheDocument();
        expect(screen.getByText('Настройки сервиса FileShare')).toBeInTheDocument();
      });
    });
  });

  describe('Доступ к настройкам после входа', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      renderWithRouter(<AdminPanel />);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Введите логин')).toBeInTheDocument();
      });

      const loginInput = screen.getByPlaceholderText('Введите логин');
      const passwordInput = screen.getByPlaceholderText('Введите пароль');
      const submitButton = screen.getByRole('button', { name: /войти/i });

      await user.type(loginInput, 'testadmin');
      await user.type(passwordInput, 'TestPass123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Админ-панель')).toBeInTheDocument();
        expect(screen.getByText('Настройки сервиса FileShare')).toBeInTheDocument();
      });
    });

    it('должен показать настройки размера файла', () => {
      expect(screen.getByText(/максимальный размер файла/i)).toBeInTheDocument();
    });

    it('должен показать настройки срока хранения', () => {
      expect(screen.getByText(/срок хранения файлов/i)).toBeInTheDocument();
    });

    it('должен показать настройки пароля администратора', () => {
      expect(screen.getByText(/пароль администратора/i)).toBeInTheDocument();
    });

    it('должен показать настройки логотипа', () => {
      expect(screen.getByText(/логотип сайта/i)).toBeInTheDocument();
    });

    it('должен показать кнопку "Сохранить настройки"', () => {
      expect(screen.getByRole('button', { name: /сохранить настройки/i })).toBeInTheDocument();
    });

    it('должен показать кнопку "Выйти"', () => {
      expect(screen.getByRole('button', { name: /выйти/i })).toBeInTheDocument();
    });
  });

  describe('Сессия пользователя', () => {
    it('должен сохранять сессию в sessionStorage после входа', async () => {
      const user = userEvent.setup();
      renderWithRouter(<AdminPanel />);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Введите логин')).toBeInTheDocument();
      });

      const loginInput = screen.getByPlaceholderText('Введите логин');
      const passwordInput = screen.getByPlaceholderText('Введите пароль');
      const submitButton = screen.getByRole('button', { name: /войти/i });

      await user.type(loginInput, 'testadmin');
      await user.type(passwordInput, 'TestPass123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(sessionStorage.getItem('admin_auth')).toBe('true');
      });
    });

    it('должен очищать сессию при выходе', async () => {
      const user = userEvent.setup();
      renderWithRouter(<AdminPanel />);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Введите логин')).toBeInTheDocument();
      });

      // Вход
      const loginInput = screen.getByPlaceholderText('Введите логин');
      const passwordInput = screen.getByPlaceholderText('Введите пароль');
      const submitButton = screen.getByRole('button', { name: /войти/i });

      await user.type(loginInput, 'testadmin');
      await user.type(passwordInput, 'TestPass123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Админ-панель')).toBeInTheDocument();
        expect(screen.getByText('Настройки сервиса FileShare')).toBeInTheDocument();
      });

      // Выход
      const logoutButton = screen.getByRole('button', { name: /выйти/i });
      await user.click(logoutButton);

      await waitFor(() => {
        expect(sessionStorage.getItem('admin_auth')).toBeNull();
        expect(screen.getByText('Админ-панель')).toBeInTheDocument();
        expect(screen.getByText('Введите учётные данные')).toBeInTheDocument();
      });
    });
  });
});

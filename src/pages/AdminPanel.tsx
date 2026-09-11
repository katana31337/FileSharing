import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  getAdminSettings, 
  saveAdminSettings, 
  validateCredentials,
  hasCredentials,
  formatFileSize, 
  parseFileSize,
  type AdminSettings 
} from '../services/adminService';

export default function AdminPanel() {
  const { secretPath } = useParams<{ secretPath: string }>();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [maxFileSizeInput, setMaxFileSizeInput] = useState('');
  const [expirationButtonsInput, setExpirationButtonsInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [needsSetup, setNeedsSetup] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const loadedSettings = await getAdminSettings();
      setSettings(loadedSettings);
      setMaxFileSizeInput(formatFileSize(loadedSettings.maxFileSize));
      setExpirationButtonsInput(loadedSettings.expirationButtons.join(', '));
      
      const hasCreds = await hasCredentials();
      setNeedsSetup(!hasCreds);
      setLoading(false);
    };
    
    init();
  }, []);

  useEffect(() => {
    if (settings && secretPath && settings.adminSecretPath && secretPath !== settings.adminSecretPath) {
      navigate('/');
    }
  }, [settings, secretPath, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = await validateCredentials(login, password);
    if (isValid) {
      setIsAuthenticated(true);
    } else {
      alert('Неверный логин или пароль');
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (login.length < 3) {
      alert('Логин должен содержать минимум 3 символа');
      return;
    }
    if (password.length < 12) {
      alert('Пароль должен содержать минимум 12 символов');
      return;
    }
    if (!/[a-z]/.test(password)) {
      alert('Пароль должен содержать строчные буквы (a-z)');
      return;
    }
    if (!/[A-Z]/.test(password)) {
      alert('Пароль должен содержать заглавные буквы (A-Z)');
      return;
    }
    if (!/[0-9]/.test(password)) {
      alert('Пароль должен содержать цифры (0-9)');
      return;
    }
    if (!/[^a-zA-Z0-9]/.test(password)) {
      alert('Пароль должен содержать спецсимволы (!@#$%^&* и др.)');
      return;
    }

    try {
      const updatedSettings = await saveAdminSettings({
        adminLogin: login,
        adminPassword: password,
        adminSecretPath: secretPath || '',
      });
      setSettings(updatedSettings);
      setNeedsSetup(false);
    } catch (error) {
      alert('Ошибка при сохранении учётных данных');
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    const maxFileSize = parseFileSize(maxFileSizeInput);
    if (maxFileSize === 0) {
      alert('Неверный формат размера файла. Используйте формат: 100MB, 1GB');
      return;
    }

    const buttons = expirationButtonsInput
      .split(',')
      .map(s => parseInt(s.trim()))
      .filter(n => !isNaN(n) && n > 0);

    if (buttons.length === 0) {
      alert('Укажите хотя бы одну кнопку срока хранения');
      return;
    }

    if (settings.minExpirationDays > settings.maxExpirationDays) {
      alert('Минимальный срок не может быть больше максимального');
      return;
    }

    if (settings.defaultExpirationDays < settings.minExpirationDays || 
        settings.defaultExpirationDays > settings.maxExpirationDays) {
      alert('Срок по умолчанию должен быть между минимальным и максимальным');
      return;
    }

    try {
      const newSettings = {
        ...settings,
        maxFileSize,
        expirationButtons: buttons,
      };

      const updatedSettings = await saveAdminSettings(newSettings);
      setSettings(updatedSettings);
      alert('Настройки сохранены!');
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert('Ошибка при сохранении настроек');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-lg text-red-600">Ошибка загрузки настроек</p>
        </div>
      </div>
    );
  }

  if (needsSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6 text-gray-900">Первичная настройка</h1>
          <form onSubmit={handleSetup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Логин</label>
              <input
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Минимум 3 символа"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Минимум 12 символов"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Создать учётные данные
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6 text-gray-900">Вход в админ-панель</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Логин</label>
              <input
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Войти
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 py-8">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-xl">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">Настройки админ-панели</h1>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Максимальный размер файла
            </label>
            <input
              type="text"
              value={maxFileSizeInput}
              onChange={(e) => setMaxFileSizeInput(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="100MB"
            />
            <p className="text-xs text-gray-500 mt-1">
              Формат: B, KB, MB, GB (например: 100MB, 1GB)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Минимальный срок хранения (дни)
            </label>
            <input
              type="number"
              value={settings.minExpirationDays}
              onChange={(e) => setSettings({ ...settings, minExpirationDays: parseInt(e.target.value) || 1 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Максимальный срок хранения (дни)
            </label>
            <input
              type="number"
              value={settings.maxExpirationDays}
              onChange={(e) => setSettings({ ...settings, maxExpirationDays: parseInt(e.target.value) || 30 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Срок хранения по умолчанию (дни)
            </label>
            <input
              type="number"
              value={settings.defaultExpirationDays}
              onChange={(e) => setSettings({ ...settings, defaultExpirationDays: parseInt(e.target.value) || 7 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Кнопки срока хранения (через запятую)
            </label>
            <input
              type="text"
              value={expirationButtonsInput}
              onChange={(e) => setExpirationButtonsInput(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="1, 3, 7, 14, 30"
            />
            <p className="text-xs text-gray-500 mt-1">
              Укажите значения в днях через запятую (например: 1, 3, 7, 14, 30)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Срок жизни сессии (дни)
            </label>
            <input
              type="number"
              value={settings.sessionDurationDays}
              onChange={(e) => setSettings({ ...settings, sessionDurationDays: parseInt(e.target.value) || 7 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              min="1"
              max="365"
            />
            <p className="text-xs text-gray-500 mt-1">
              Через сколько дней сессия пользователя истечёт (по умолчанию: 7 дней)
            </p>
          </div>

          <button
            onClick={handleSave}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Сохранить настройки
          </button>
        </div>
      </div>
    </div>
  );
}

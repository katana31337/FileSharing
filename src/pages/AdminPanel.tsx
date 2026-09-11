import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  getAdminSettings, 
  saveAdminSettings, 
  formatFileSize, 
  parseFileSize,
  type AdminSettings 
} from '../services/adminService';

export default function AdminPanel() {
  const { secretPath } = useParams<{ secretPath: string }>();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<AdminSettings>(getAdminSettings());
  const [maxFileSizeInput, setMaxFileSizeInput] = useState(
    formatFileSize(settings.maxFileSize)
  );
  const [expirationButtonsInput, setExpirationButtonsInput] = useState(
    settings.expirationButtons.join(', ')
  );
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [needsSetup, setNeedsSetup] = useState(!settings.adminLogin);

  // Проверка секретного пути
  if (secretPath !== settings.adminSecretPath && settings.adminSecretPath) {
    navigate('/');
    return null;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (login === settings.adminLogin && password === settings.adminPassword) {
      setIsAuthenticated(true);
    } else {
      alert('Неверный логин или пароль');
    }
  };

  const handleSetup = (e: React.FormEvent) => {
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

    saveAdminSettings({
      adminLogin: login,
      adminPassword: password,
      adminSecretPath: secretPath || '',
    });
    setSettings({ ...settings, adminLogin: login, adminPassword: password, adminSecretPath: secretPath || '' });
    setNeedsSetup(false);
  };

  const handleSave = () => {
    const maxFileSize = parseFileSize(maxFileSizeInput);
    if (maxFileSize === 0) {
      alert('Неверный формат размера файла. Используйте формат: 100MB, 1GB');
      return;
    }

    // Парсинг кнопок срока хранения
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

    const newSettings = {
      ...settings,
      maxFileSize,
      expirationButtons: buttons,
    };

    saveAdminSettings(newSettings);
    setSettings(newSettings);
    alert('Настройки сохранены!');
  };

  // Первичная настройка
  if (needsSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6">Первичная настройка</h1>
          <form onSubmit={handleSetup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Логин</label>
              <input
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Минимум 3 символа"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Минимум 12 символов"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              Создать учётные данные
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Форма входа
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6">Вход в админ-панель</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Логин</label>
              <input
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              Войти
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Админ-панель
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6">Настройки админ-панели</h1>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Максимальный размер файла
            </label>
            <input
              type="text"
              value={maxFileSizeInput}
              onChange={(e) => setMaxFileSizeInput(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="100MB"
            />
            <p className="text-xs text-gray-500 mt-1">
              Формат: B, KB, MB, GB (например: 100MB, 1GB)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Минимальный срок хранения (дни)
            </label>
            <input
              type="number"
              value={settings.minExpirationDays}
              onChange={(e) => setSettings({ ...settings, minExpirationDays: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 border rounded-lg"
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Максимальный срок хранения (дни)
            </label>
            <input
              type="number"
              value={settings.maxExpirationDays}
              onChange={(e) => setSettings({ ...settings, maxExpirationDays: parseInt(e.target.value) || 30 })}
              className="w-full px-3 py-2 border rounded-lg"
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Срок хранения по умолчанию (дни)
            </label>
            <input
              type="number"
              value={settings.defaultExpirationDays}
              onChange={(e) => setSettings({ ...settings, defaultExpirationDays: parseInt(e.target.value) || 7 })}
              className="w-full px-3 py-2 border rounded-lg"
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Кнопки срока хранения (через запятую)
            </label>
            <input
              type="text"
              value={expirationButtonsInput}
              onChange={(e) => setExpirationButtonsInput(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="1, 3, 7, 14, 30"
            />
            <p className="text-xs text-gray-500 mt-1">
              Укажите значения в днях через запятую (например: 1, 3, 7, 14, 30)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Срок жизни сессии (дни)
            </label>
            <input
              type="number"
              value={settings.sessionDurationDays}
              onChange={(e) => setSettings({ ...settings, sessionDurationDays: parseInt(e.target.value) || 7 })}
              className="w-full px-3 py-2 border rounded-lg"
              min="1"
              max="365"
            />
            <p className="text-xs text-gray-500 mt-1">
              Через сколько дней сессия пользователя истечёт (по умолчанию: 7 дней)
            </p>
          </div>

          <button
            onClick={handleSave}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
          >
            Сохранить настройки
          </button>
        </div>
      </div>
    </div>
  );
}

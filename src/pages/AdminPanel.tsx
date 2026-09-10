import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Settings, Save, RotateCcw, Lock, ArrowLeft, Upload, Link, Image, X, User, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  getAdminSettings, 
  getAdminSettingsAsync,
  saveAdminSettings, 
  saveAdminSettingsAsync,
  resetAdminSettings,
  resetAdminSettingsAsync,
  validateAdminCredentials,
  formatFileSize,
  parseFileSize,
  type AdminSettings 
} from '../services/adminService';

export default function AdminPanel() {
  const navigate = useNavigate();
  const { secretPath } = useParams<{ secretPath: string }>();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [settings, setSettings] = useState<AdminSettings>(getAdminSettings());
  const [maxFileSizeInput, setMaxFileSizeInput] = useState(
    formatFileSize(settings.maxFileSize)
  );
  const [logoUrl, setLogoUrl] = useState(settings.logoType === 'url' ? settings.logo : '');
  const [saveMessage, setSaveMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [needsInitialSetup, setNeedsInitialSetup] = useState(false);
  const [initialLogin, setInitialLogin] = useState('');
  const [initialPassword, setInitialPassword] = useState('');
  const [showInitialPassword, setShowInitialPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Проверяем, нужна ли первичная настройка
  const checkInitialSetup = () => {
    const hasSavedSettings = localStorage.getItem('fileshare_admin_settings');
    return !hasSavedSettings && secretPath;
  };

  // Проверяем, совпадает ли путь с секретным
  const isValidSecretPath = () => {
    // Если есть secretPath в URL - это всегда валидный путь для первого визита
    if (secretPath) {
      const hasSavedSettings = localStorage.getItem('fileshare_admin_settings');
      
      // Если настроек нет - это первый визит, разрешаем доступ
      if (!hasSavedSettings) {
        return true;
      }
      
      // Если настройки есть - проверяем совпадение пути
      const savedSettings = getAdminSettings();
      return secretPath === savedSettings.adminSecretPath;
    }
    
    return false;
  };

  // При первом посещении секретного URL - сохраняем этот путь
  useEffect(() => {
    console.log('%c[AdminPanel] 🔑 Проверка секретного пути:', 'color: purple; font-weight: bold;');
    console.log('%c[AdminPanel] 📎 secretPath из URL:', 'color: purple;', secretPath);
    
    if (secretPath && checkInitialSetup()) {
      console.log('%c[AdminPanel] 🆕 Первый визит! Сохраняем секретный путь из URL', 'color: green; font-weight: bold;');
      // Сохраняем секретный путь из URL в localStorage
      const currentSettings = getAdminSettings();
      const updatedSettings = {
        ...currentSettings,
        adminSecretPath: secretPath,
      };
      saveAdminSettings(updatedSettings);
      setSettings(updatedSettings);
      setNeedsInitialSetup(true);
      console.log('%c[AdminPanel] ✅ Сохранён adminSecretPath:', 'color: green;', secretPath);
    }
  }, [secretPath]);

  // Проверяем секретный путь и авторизацию
  useEffect(() => {
    console.log('%c[AdminPanel] 🔐 Проверка авторизации...', 'color: blue; font-weight: bold;');
    console.log('%c[AdminPanel] 📎 secretPath:', 'color: blue;', secretPath);
    console.log('%c[AdminPanel] 🔧 isValidSecretPath:', 'color: blue;', isValidSecretPath());
    
    // Проверяем секретный путь
    if (!isValidSecretPath()) {
      console.log('%c[AdminPanel] ❌ Неверный секретный путь! Редирект на главную', 'color: red; font-weight: bold;');
      navigate('/');
      return;
    }

    console.log('%c[AdminPanel] ✅ Секретный путь верный', 'color: green;');
    
    const auth = sessionStorage.getItem('admin_auth');
    if (auth === 'true') {
      console.log('%c[AdminPanel] ✅ Пользователь авторизован', 'color: green;');
      setIsAuthenticated(true);
    } else {
      console.log('%c[AdminPanel] ⚠️ Пользователь не авторизован', 'color: orange;');
    }
  }, [secretPath]);

  // Загружаем настройки из API при монтировании компонента
  useEffect(() => {
    console.log('%c[AdminPanel] 📥 Загрузка настроек из API...', 'color: cyan; font-weight: bold;');
    
    getAdminSettingsAsync().then(apiSettings => {
      console.log('%c[AdminPanel] 📦 Настройки из API:', 'color: cyan;', apiSettings);
      
      // Сохраняем adminSecretPath из localStorage, если он был установлен через URL
      const localSettings = getAdminSettings();
      console.log('%c[AdminPanel] 💾 Настройки из localStorage:', 'color: cyan;', localSettings);
      
      const mergedSettings = {
        ...apiSettings,
        // ВАЖНО: adminSecretPath берём из localStorage, если он там есть
        // Иначе используем значение из API
        adminSecretPath: localSettings.adminSecretPath && localSettings.adminSecretPath !== 'admin' 
          ? localSettings.adminSecretPath 
          : apiSettings.adminSecretPath,
        adminLogin: localSettings.adminLogin && localSettings.adminLogin !== 'admin' 
          ? localSettings.adminLogin 
          : apiSettings.adminLogin,
        adminPassword: localSettings.adminPassword && localSettings.adminPassword !== 'admin123' 
          ? localSettings.adminPassword 
          : apiSettings.adminPassword,
      };
      
      console.log('%c[AdminPanel] 🔀 Итоговые настройки:', 'color: cyan;', mergedSettings);
      
      setSettings(mergedSettings);
      setMaxFileSizeInput(formatFileSize(mergedSettings.maxFileSize));
      setLogoUrl(mergedSettings.logoType === 'url' ? mergedSettings.logo : '');
    }).catch(error => {
      console.error('%c[AdminPanel] ❌ Ошибка загрузки настроек из API:', 'color: red; font-weight: bold;', error);
      // При ошибке используем локальные настройки
      const localSettings = getAdminSettings();
      setSettings(localSettings);
      setMaxFileSizeInput(formatFileSize(localSettings.maxFileSize));
      setLogoUrl(localSettings.logoType === 'url' ? localSettings.logo : '');
    });
  }, []);

  const handleInitialSetup = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Валидация логина
    if (initialLogin.length < 3) {
      alert('Логин должен содержать минимум 3 символа');
      return;
    }

    // Валидация пароля
    if (initialPassword.length < 12) {
      alert('Пароль должен содержать минимум 12 символов');
      return;
    }

    if (!/[a-z]/.test(initialPassword)) {
      alert('Пароль должен содержать строчные буквы (a-z)');
      return;
    }

    if (!/[A-Z]/.test(initialPassword)) {
      alert('Пароль должен содержать заглавные буквы (A-Z)');
      return;
    }

    if (!/[0-9]/.test(initialPassword)) {
      alert('Пароль должен содержать цифры (0-9)');
      return;
    }

    if (!/[^a-zA-Z0-9]/.test(initialPassword)) {
      alert('Пароль должен содержать спецсимволы (!@#$%^&* и др.)');
      return;
    }

    // Сохраняем настройки с секретным путём из URL
    const currentSettings = getAdminSettings();
    const newSettings = {
      ...currentSettings,
      adminLogin: initialLogin,
      adminPassword: initialPassword,
      adminSecretPath: secretPath || 'admin',
    };
    saveAdminSettings(newSettings);
    setSettings(newSettings);
    setNeedsInitialSetup(false);
    alert('Настройки сохранены! Теперь войдите с новыми учётными данными.');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateAdminCredentials(login, password)) {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_auth', 'true');
    } else {
      const currentSettings = getAdminSettings();
      alert(
        `Неверный логин или пароль\n\n` +
        `Текущие настройки:\n` +
        `Логин: ${currentSettings.adminLogin}\n` +
        `Пароль: ${currentSettings.adminPassword}\n\n` +
        `Если это первая установка, используйте данные по умолчанию:\n` +
        `Логин: admin\n` +
        `Пароль: admin123`
      );
    }
  };

  const handleSave = async () => {
    const maxFileSize = parseFileSize(maxFileSizeInput);
    
    if (maxFileSize === 0) {
      alert('Неверный формат размера файла. Используйте формат: 100MB, 1GB');
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
    };

    try {
      const savedSettings = await saveAdminSettingsAsync(newSettings);
      setSettings(savedSettings);
      setSaveMessage('Настройки сохранены!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      alert('Ошибка сохранения настроек');
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите изображение');
      return;
    }

    // Проверка размера (максимум 2MB для логотипа)
    if (file.size > 2 * 1024 * 1024) {
      alert('Размер логотипа не должен превышать 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setSettings({
        ...settings,
        logo: dataUrl,
        logoType: 'file',
      });
    };
    reader.readAsDataURL(file);
  };

  const handleLogoUrlChange = (url: string) => {
    setLogoUrl(url);
    if (url.trim()) {
      setSettings({
        ...settings,
        logo: url,
        logoType: 'url',
      });
    }
  };

  const handleRemoveLogo = () => {
    setSettings({
      ...settings,
      logo: '',
      logoType: 'none',
    });
    setLogoUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleReset = async () => {
    if (confirm('Сбросить все настройки к значениям по умолчанию?')) {
      try {
        const defaultSettings = await resetAdminSettingsAsync();
        setSettings(defaultSettings);
        setMaxFileSizeInput(formatFileSize(defaultSettings.maxFileSize));
        setLogoUrl('');
      } catch (error) {
        alert('Ошибка сброса настроек');
      }
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_auth');
    setIsAuthenticated(false);
    setLogin('');
    setPassword('');
  };

  // Если путь не совпадает с секретным - показываем 404
  // Но только если есть сохранённые настройки (иначе покажем форму настройки)
  if (!needsInitialSetup && !isValidSecretPath()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
          <p className="text-xl text-gray-600 mb-6">Страница не найдена</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
          >
            На главную
          </button>
        </motion.div>
      </div>
    );
  }

  // Первичная настройка админки
  if (needsInitialSetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Settings className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Первичная настройка</h1>
              <p className="text-sm text-gray-500">Создайте учётные данные администратора</p>
            </div>
          </div>

          <form onSubmit={handleInitialSetup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Логин
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={initialLogin}
                  onChange={(e) => setInitialLogin(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="Минимум 3 символа"
                  autoFocus
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Пароль
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showInitialPassword ? "text" : "password"}
                  value={initialPassword}
                  onChange={(e) => setInitialPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="Минимум 12 символов"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowInitialPassword(!showInitialPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showInitialPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <div className="mt-2 text-xs text-gray-500 space-y-1">
                <p>Требования к паролю:</p>
                <ul className="list-disc list-inside space-y-0.5 ml-2">
                  <li className={initialPassword.length >= 12 ? 'text-green-600' : ''}>Минимум 12 символов</li>
                  <li className={/[a-z]/.test(initialPassword) ? 'text-green-600' : ''}>Строчные буквы (a-z)</li>
                  <li className={/[A-Z]/.test(initialPassword) ? 'text-green-600' : ''}>Заглавные буквы (A-Z)</li>
                  <li className={/[0-9]/.test(initialPassword) ? 'text-green-600' : ''}>Цифры (0-9)</li>
                  <li className={/[^a-zA-Z0-9]/.test(initialPassword) ? 'text-green-600' : ''}>Спецсимволы (!@#$% и др.)</li>
                </ul>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
            >
              Создать учётные данные
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Lock className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Админ-панель</h1>
              <p className="text-sm text-gray-500">Введите учётные данные</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Логин
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="Введите логин"
                  autoFocus
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Пароль
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="Введите пароль"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
            >
              Войти
            </button>
          </form>

          <button
            onClick={() => navigate('/')}
            className="w-full mt-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            На главную
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-6 md:p-8"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Settings className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Админ-панель</h1>
                <p className="text-sm text-gray-500">Настройки сервиса FileShare</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Выйти
            </button>
          </div>

          <div className="space-y-6">
            {/* Максимальный размер файла */}
            <div className="border border-gray-200 rounded-xl p-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Максимальный размер файла
              </label>
              <input
                type="text"
                value={maxFileSizeInput}
                onChange={(e) => setMaxFileSizeInput(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                placeholder="100MB"
              />
              <p className="text-xs text-gray-500 mt-2">
                Формат: B, KB, MB, GB (например: 100MB, 1GB)
              </p>
            </div>

            {/* Срок хранения */}
            <div className="border border-gray-200 rounded-xl p-5">
              <h3 className="text-sm font-medium text-gray-700 mb-4">
                Срок хранения файлов
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-2">
                    Минимум (дни)
                  </label>
                  <input
                    type="number"
                    value={settings.minExpirationDays}
                    onChange={(e) => setSettings({
                      ...settings,
                      minExpirationDays: parseInt(e.target.value) || 1
                    })}
                    min="1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-2">
                    Максимум (дни)
                  </label>
                  <input
                    type="number"
                    value={settings.maxExpirationDays}
                    onChange={(e) => setSettings({
                      ...settings,
                      maxExpirationDays: parseInt(e.target.value) || 30
                    })}
                    min="1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-2">
                    По умолчанию (дни)
                  </label>
                  <input
                    type="number"
                    value={settings.defaultExpirationDays}
                    onChange={(e) => setSettings({
                      ...settings,
                      defaultExpirationDays: parseInt(e.target.value) || 7
                    })}
                    min="1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Пароль администратора */}
            <div className="border border-gray-200 rounded-xl p-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Пароль администратора
              </label>
              <input
                type="password"
                value={settings.adminPassword}
                onChange={(e) => setSettings({
                  ...settings,
                  adminPassword: e.target.value
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                placeholder="Новый пароль"
              />
              <p className="text-xs text-gray-500 mt-2">
                Измените пароль по умолчанию для безопасности
              </p>
            </div>

            {/* Логотип сайта */}
            <div className="border border-gray-200 rounded-xl p-5">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Логотип сайта
              </label>

              {/* Превью логотипа */}
              {settings.logo && (
                <div className="mb-4 flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <img 
                    src={settings.logo} 
                    alt="Логотип" 
                    className="h-16 w-auto object-contain rounded-lg"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">
                      {settings.logoType === 'file' ? 'Загруженный файл' : 'URL'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {settings.logoType === 'url' ? settings.logo : 'Локальный файл'}
                    </p>
                  </div>
                  <button
                    onClick={handleRemoveLogo}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Удалить логотип"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Загрузка файла */}
              <div className="space-y-4">
                <div>
                  <label className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <Upload className="w-4 h-4" />
                    Загрузить файл
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, SVG (макс. 2MB)
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">или</span>
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <Link className="w-4 h-4" />
                    Указать URL
                  </label>
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => handleLogoUrlChange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    placeholder="https://example.com/logo.png"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Прямая ссылка на изображение
                  </p>
                </div>
              </div>
            </div>

            {/* Кнопки */}
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Сохранить настройки
              </button>
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Сбросить
              </button>
            </div>

            {/* Сообщение о сохранении */}
            {saveMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm"
              >
                {saveMessage}
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Кнопка назад */}
        <button
          onClick={() => navigate('/')}
          className="mt-6 w-full py-3 bg-white text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          На главную
        </button>
      </div>
    </div>
  );
}

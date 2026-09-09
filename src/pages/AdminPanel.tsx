import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Save, RotateCcw, Lock, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  getAdminSettings, 
  saveAdminSettings, 
  resetAdminSettings,
  validateAdminPassword,
  formatFileSize,
  parseFileSize,
  type AdminSettings 
} from '../services/adminService';

export default function AdminPanel() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [settings, setSettings] = useState<AdminSettings>(getAdminSettings());
  const [maxFileSizeInput, setMaxFileSizeInput] = useState(
    formatFileSize(settings.maxFileSize)
  );
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    const auth = sessionStorage.getItem('admin_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateAdminPassword(password)) {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_auth', 'true');
    } else {
      alert('Неверный пароль');
    }
  };

  const handleSave = () => {
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

    saveAdminSettings(newSettings);
    setSaveMessage('Настройки сохранены!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleReset = () => {
    if (confirm('Сбросить все настройки к значениям по умолчанию?')) {
      resetAdminSettings();
      const defaultSettings = getAdminSettings();
      setSettings(defaultSettings);
      setMaxFileSizeInput(formatFileSize(defaultSettings.maxFileSize));
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_auth');
    setIsAuthenticated(false);
    setPassword('');
  };

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
              <p className="text-sm text-gray-500">Введите пароль для доступа</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Пароль
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                placeholder="Введите пароль"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-2">
                Пароль по умолчанию: admin123
              </p>
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

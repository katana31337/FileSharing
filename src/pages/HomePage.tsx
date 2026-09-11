import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, Zap, Shield, Clock, Settings } from 'lucide-react';
import FileUpload from '../components/FileUpload';
import ExpirationSelector from '../components/ExpirationSelector';
import { getAdminSettings, type AdminSettings } from '../services/adminService';
import { getCurrentSession, getSessionHistory, type SessionHistory } from '../services/sessionService';

export default function HomePage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [expirationDays, setExpirationDays] = useState(7);
  const [sessionHistory, setSessionHistory] = useState<SessionHistory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const loadedSettings = await getAdminSettings();
      setSettings(loadedSettings);
      setExpirationDays(loadedSettings.defaultExpirationDays);
      
      await getCurrentSession();
      const history = await getSessionHistory();
      setSessionHistory(history);
      setLoading(false);
    };
    
    init();
  }, []);

  const handleFileSelect = (file: File) => {
    console.log('Выбран файл:', file.name);
    // Здесь будет логика загрузки файла на сервер
  };

  if (loading || !settings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">FileShare</h1>
            </div>
            <button
              onClick={() => navigate('/admin')}
              className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              title="Админ-панель"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Быстрый обмен файлами
          </h2>
          <p className="text-xl text-gray-600">
            Загружайте файлы и делитесь короткими ссылками
          </p>
        </motion.div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Безопасно</h3>
            <p className="text-gray-600">Файлы автоматически удаляются по истечении срока</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Гибкие сроки</h3>
            <p className="text-gray-600">От {settings.minExpirationDays} до {settings.maxExpirationDays} дней хранения</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <Upload className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Быстро</h3>
            <p className="text-gray-600">Загрузка до {(settings.maxFileSize / 1024 / 1024).toFixed(0)} MB</p>
          </motion.div>
        </div>

        {/* Upload Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-8"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Загрузить файл
          </h3>
          
          <FileUpload onFileSelect={handleFileSelect} />
          
          <div className="mt-6">
            <ExpirationSelector value={expirationDays} onChange={setExpirationDays} />
          </div>
        </motion.div>

        {/* Session History */}
        {sessionHistory && sessionHistory.files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              История загрузок
            </h3>
            <div className="space-y-3">
              {sessionHistory.files.slice(0, 5).map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{file.file_name}</p>
                    <p className="text-sm text-gray-500">
                      Загружен: {new Date(file.uploaded_at).toLocaleString('ru-RU')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      Истекает: {new Date(file.expires_at).toLocaleDateString('ru-RU')}
                    </p>
                    <button
                      onClick={() => navigate(`/s/${file.short_url}`)}
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      Открыть →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-500">
            FileShare v1.0.17 — Быстрый обмен файлами
          </p>
        </div>
      </footer>
    </div>
  );
}

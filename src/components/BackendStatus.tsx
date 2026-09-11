import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, X } from 'lucide-react';

const API_BASE_URL = '/api';

export default function BackendStatus() {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        });

        if (response.ok) {
          setStatus('online');
        } else {
          setStatus('offline');
        }
      } catch (error) {
        console.error('Backend health check failed:', error);
        setStatus('offline');
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 30000);

    return () => clearInterval(interval);
  }, []);

  if (status === 'online' || dismissed) {
    return null;
  }

  if (status === 'checking') {
    return (
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <p className="text-sm text-blue-900">Проверка подключения к серверу...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-red-900 mb-1">Сервер недоступен</p>
            <p className="text-sm text-red-700">
              База данных временно недоступна. Функционал загрузки файлов и просмотра истории не работает.
              Пожалуйста, попробуйте позже или обратитесь к администратору.
            </p>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-red-600 hover:text-red-800 flex-shrink-0"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

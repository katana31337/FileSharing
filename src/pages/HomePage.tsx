import { useState, useEffect } from 'react';
import FileUpload from '../components/FileUpload';
import ExpirationSelector from '../components/ExpirationSelector';
import { getAdminSettings } from '../services/adminService';
import { 
  getCurrentSession, 
  getSessionHistory, 
  addFileToHistory,
  getSessionInfo,
  type SessionHistory,
  type SessionFile
} from '../services/sessionService';

export default function HomePage() {
  const [settings, setSettings] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [expirationDays, setExpirationDays] = useState(7);
  const [sessionHistory, setSessionHistory] = useState<SessionHistory | null>(null);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Инициализация сессии и настроек при загрузке страницы
  useEffect(() => {
    const init = async () => {
      const loadedSettings = await getAdminSettings();
      setSettings(loadedSettings);
      setExpirationDays(loadedSettings.defaultExpirationDays);
      
      const session = await getCurrentSession();
      const history = await getSessionHistory();
      const info = await getSessionInfo();
      
      setSessionHistory(history);
      setSessionInfo(info);
      setLoading(false);
      
      console.log('%c[HomePage] 🎯 Сессия инициализирована:', 'color: purple; font-weight: bold;', {
        sessionId: session.id,
        expiresAt: session.expiresAt,
        filesCount: history.files.length,
        textsCount: history.texts.length,
      });
    };
    
    init();
  }, []);

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    
    // Здесь будет логика загрузки файла на сервер
    // Пока просто добавляем в историю сессии
    const mockShortUrl = `test_${Date.now()}`;
    const expiresAt = new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000).toISOString();
    
    await addFileToHistory({
      shortUrl: mockShortUrl,
      name: file.name,
      size: file.size,
      expiresAt,
    });
    
    // Обновляем историю
    const updatedHistory = await getSessionHistory();
    const updatedInfo = await getSessionInfo();
    
    setSessionHistory(updatedHistory);
    setSessionInfo(updatedInfo);
    
    console.log('Выбран файл:', file.name, 'Срок хранения:', expirationDays, 'дней');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
          <p className="text-center text-gray-500">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-6 text-center">FileShare</h1>
        
        {/* Информация о сессии */}
        {sessionInfo && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Сессия:</span> {sessionInfo.id.substring(0, 20)}...
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Истекает:</span> {new Date(sessionInfo.expiresAt).toLocaleDateString('ru-RU')}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Загружено файлов:</span> {sessionInfo.filesCount}
            </p>
          </div>
        )}
        
        <div className="space-y-6">
          <FileUpload onFileSelect={handleFileSelect} />
          
          {selectedFile && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="font-medium">Выбранный файл:</p>
              <p className="text-sm text-gray-600">{selectedFile.name}</p>
            </div>
          )}
          
          <ExpirationSelector value={expirationDays} onChange={setExpirationDays} />
          
          {/* История загрузок */}
          {sessionHistory && sessionHistory.files.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4">История загрузок</h2>
              <div className="space-y-2">
                {sessionHistory.files.map((file: SessionFile, index: number) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-sm">{file.file_name}</p>
                    <p className="text-xs text-gray-500">
                      Загружен: {new Date(file.uploaded_at).toLocaleString('ru-RU')}
                    </p>
                    <p className="text-xs text-gray-500">
                      Истекает: {new Date(file.expires_at).toLocaleDateString('ru-RU')}
                    </p>
                    <p className="text-xs text-gray-500">
                      Ссылка: /s/{file.short_url}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

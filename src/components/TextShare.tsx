import { useState, useEffect } from 'react';
import { getAdminSettings, type AdminSettings } from '../services/adminService';

interface TextShareProps {
  onTextShare?: (shortUrl: string) => void;
}

export default function TextShare({ onTextShare }: TextShareProps) {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [text, setText] = useState('');
  const [expirationDays, setExpirationDays] = useState(7);

  useEffect(() => {
    getAdminSettings().then((loadedSettings) => {
      setSettings(loadedSettings);
      setExpirationDays(loadedSettings.defaultExpirationDays);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!text.trim()) {
      alert('Пожалуйста, введите текст');
      return;
    }

    // Здесь будет логика отправки текста на сервер
    // Пока просто показываем сообщение
    alert(`Текст отправлен!\nСрок хранения: ${expirationDays} дней`);
    
    if (onTextShare) {
      onTextShare('mock_short_url');
    }
  };

  if (!settings) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Текст
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg min-h-[200px]"
            placeholder="Введите текст для обмена..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Срок хранения
          </label>
          <div className="flex flex-wrap gap-2">
            {settings.expirationButtons.map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setExpirationDays(days)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  expirationDays === days
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {days} {days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Доступно: от {settings.minExpirationDays} до {settings.maxExpirationDays} дней
          </p>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
        >
          Поделиться текстом
        </button>
      </form>
    </div>
  );
}

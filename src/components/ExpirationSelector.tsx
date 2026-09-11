import { useState, useEffect } from 'react';
import { getAdminSettings, type AdminSettings } from '../services/adminService';

interface ExpirationSelectorProps {
  value: number;
  onChange: (days: number) => void;
}

export default function ExpirationSelector({ value, onChange }: ExpirationSelectorProps) {
  const [settings, setSettings] = useState<AdminSettings | null>(null);

  useEffect(() => {
    getAdminSettings().then(setSettings);
  }, []);

  if (!settings) {
    return <div>Загрузка...</div>;
  }

  const buttons = settings.expirationButtons;

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Срок хранения
      </label>
      <div className="flex flex-wrap gap-2">
        {buttons.map((days: number) => (
          <button
            key={days}
            onClick={() => onChange(days)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              value === days
                ? 'bg-indigo-600 text-white'
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
  );
}

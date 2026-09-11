import { useState, useRef, useEffect } from 'react';
import { Upload, X, AlertCircle } from 'lucide-react';
import { getAdminSettings, formatFileSize, type AdminSettings } from '../services/adminService';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

export default function FileUpload({ onFileSelect }: FileUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getAdminSettings().then(setSettings);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !settings) return;

    if (file.size > settings.maxFileSize) {
      const maxSizeFormatted = formatFileSize(settings.maxFileSize);
      const fileSizeFormatted = formatFileSize(file.size);
      setError(
        `Файл слишком большой\n\n` +
        `Размер файла: ${fileSizeFormatted}\n` +
        `Максимальный размер: ${maxSizeFormatted}\n\n` +
        `Пожалуйста, выберите файл меньшего размера.`
      );
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setError(null);
    onFileSelect(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  if (!settings) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  return (
    <div className="w-full">
      <div
        onClick={handleClick}
        className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-200"
      >
        <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <p className="text-lg font-medium text-gray-700 mb-2">
          Нажмите для выбора файла
        </p>
        <p className="text-sm text-gray-500">
          Максимум {formatFileSize(settings.maxFileSize)}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-red-900 mb-2">Не удалось загрузить файл</p>
              <p className="text-sm text-red-700 whitespace-pre-line">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

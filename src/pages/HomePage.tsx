import { useState } from 'react';
import FileUpload from '../components/FileUpload';
import ExpirationSelector from '../components/ExpirationSelector';
import { getAdminSettings } from '../services/adminService';

export default function HomePage() {
  const settings = getAdminSettings();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [expirationDays, setExpirationDays] = useState(settings.defaultExpirationDays);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    // Здесь будет логика загрузки файла
    console.log('Выбран файл:', file.name, 'Срок хранения:', expirationDays, 'дней');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-6 text-center">FileShare</h1>
        
        <div className="space-y-6">
          <FileUpload onFileSelect={handleFileSelect} />
          
          {selectedFile && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="font-medium">Выбранный файл:</p>
              <p className="text-sm text-gray-600">{selectedFile.name}</p>
            </div>
          )}
          
          <ExpirationSelector value={expirationDays} onChange={setExpirationDays} />
        </div>
      </div>
    </div>
  );
}

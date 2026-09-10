import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, File as FileIcon, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShareItem, UploadOptions } from '../types';
import { saveFile, formatFileSize } from '../services/storageService';
import { getAdminSettings } from '../services/adminService';
import { ToastContainer, useToast } from './Toast';

interface FileUploadProps {
  onUploadComplete: (item: ShareItem) => void;
}

export default function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedItems, setUploadedItems] = useState<ShareItem[]>([]);
  const [adminSettings, setAdminSettings] = useState(getAdminSettings());
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  useEffect(() => {
    const settings = getAdminSettings();
    setAdminSettings(settings);
    setExpiresInDays(settings.defaultExpirationDays);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateFiles = (fileList: File[]): File[] => {
    const validFiles: File[] = [];
    for (const file of fileList) {
      if (file.size > adminSettings.maxFileSize) {
        toast.error(
          'Файл слишком большой',
          `"${file.name}" превышает максимальный размер ${formatFileSize(adminSettings.maxFileSize)}`
        );
      } else {
        validFiles.push(file);
      }
    }
    return validFiles;
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    const validFiles = validateFiles(droppedFiles);
    setFiles(prev => [...prev, ...validFiles]);
  }, [adminSettings.maxFileSize]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation(); // Предотвращаем всплытие события к родительскому элементу
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const validFiles = validateFiles(selectedFiles);
      setFiles(prev => [...prev, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    setIsUploading(true);
    const options: UploadOptions = { expiresInDays };
    const newItems: ShareItem[] = [];
    const progress: Record<string, number> = {};

    // Инициализируем прогресс для всех файлов
    files.forEach(file => {
      progress[file.name] = 0;
    });
    setUploadProgress(progress);

    for (const file of files) {
      try {
        const item = await saveFile(file, options, (fileProgress) => {
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: fileProgress
          }));
        });
        newItems.push(item);
      } catch (error) {
        console.error(`Ошибка загрузки файла ${file.name}:`, error);
      }
    }

    setUploadedItems(prev => [...newItems, ...prev]);
    newItems.forEach(item => onUploadComplete(item));
    setFiles([]);
    setUploadProgress({});
    setIsUploading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50 scale-[1.02]'
            : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
        }`}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          onClick={(e) => e.stopPropagation()}
          className="hidden"
        />
        <motion.div
          animate={{ y: isDragging ? -5 : 0 }}
          className="flex flex-col items-center gap-4"
        >
          <div className={`p-4 rounded-full ${isDragging ? 'bg-indigo-100' : 'bg-gray-100'}`}>
            <Upload className={`w-8 h-8 ${isDragging ? 'text-indigo-600' : 'text-gray-500'}`} />
          </div>
          <div>
            <p className="text-lg font-medium text-gray-700">
              {isDragging ? 'Отпустите файлы здесь' : 'Перетащите файлы или нажмите для выбора'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Максимум 100 МБ на файл
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* Expiration Setting */}
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Срок хранения
        </label>
        <div className="flex gap-2 flex-wrap">
          {(() => {
            const options: number[] = [];
            const presets = [1, 3, 7, 14, 30];
            
            for (const preset of presets) {
              if (preset >= adminSettings.minExpirationDays && preset <= adminSettings.maxExpirationDays) {
                options.push(preset);
              }
            }
            
            // Если ни один пресет не подходит, добавляем минимальное и максимальное значения
            if (options.length === 0) {
              options.push(adminSettings.minExpirationDays);
              if (adminSettings.maxExpirationDays !== adminSettings.minExpirationDays) {
                options.push(adminSettings.maxExpirationDays);
              }
            }
            
            return options.map(days => (
              <button
                key={days}
                onClick={() => setExpiresInDays(days)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  expiresInDays === days
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {days} {days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'}
              </button>
            ));
          })()}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Доступно: от {adminSettings.minExpirationDays} до {adminSettings.maxExpirationDays} дней
        </p>
      </div>

      {/* Selected Files */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <h3 className="text-sm font-medium text-gray-700">
              Выбрано файлов: {files.length}
            </h3>
            <div className="space-y-2">
              {files.map((file, index) => {
                const progress = uploadProgress[file.name] || 0;
                const isUploadingFile = isUploading && progress > 0;
                
                return (
                  <motion.div
                    key={`${file.name}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="bg-white rounded-lg p-3 border border-gray-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isUploadingFile ? 'bg-indigo-100' : 'bg-indigo-50'}`}>
                        <FileIcon className={`w-4 h-4 ${isUploadingFile ? 'text-indigo-700' : 'text-indigo-600'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.size)}
                          {isUploadingFile && ` • ${Math.round(progress)}%`}
                        </p>
                      </div>
                      {!isUploading && (
                        <button
                          onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                          className="p-1 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4 text-red-500" />
                        </button>
                      )}
                    </div>
                    
                    {/* Progress Bar */}
                    {isUploadingFile && (
                      <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                        />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Загрузка {Object.keys(uploadProgress).length > 0 
                    ? `${Object.values(uploadProgress).filter(p => p === 100).length}/${files.length}` 
                    : '...'}
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Загрузить {files.length} {files.length === 1 ? 'файл' : files.length < 5 ? 'файла' : 'файлов'}
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Uploaded Items */}
      <AnimatePresence>
        {uploadedItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            <h3 className="text-sm font-medium text-green-700 flex items-center gap-2">
              <Check className="w-4 h-4" />
              Загружено успешно
            </h3>
            {uploadedItems.map(item => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-50 border border-green-200 rounded-xl p-4"
              >
                <p className="text-sm font-medium text-gray-800 mb-2">{item.name}</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-white px-3 py-2 rounded-lg border border-green-200 text-indigo-700 font-mono truncate">
                    {window.location.origin}/#/s/{item.shortUrl}
                  </code>
                  <button
                    onClick={() => copyToClipboard(`${window.location.origin}/#/s/${item.shortUrl}`)}
                    className="px-3 py-2 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap"
                  >
                    Копировать
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Toast Notifications */}
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </div>
  );
}

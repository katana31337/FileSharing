import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, FileText, Image, File as FileIcon, Clock, ArrowLeft, Copy, Check, Zap } from 'lucide-react';
import { getFileByShortUrl, getTextByShortUrl, formatFileSize, formatExpiration } from '../services/storageService';
import { getAdminSettings } from '../services/adminService';

export default function ShareView() {
  const { shortUrl } = useParams<{ shortUrl: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [logo, setLogo] = useState<string>('');

  useEffect(() => {
    const settings = getAdminSettings();
    setLogo(settings.logo);
  }, []);

  // File state
  const [fileData, setFileData] = useState<{ dataUrl: string; name: string; size: number; mimeType: string; type: string; expiresAt: string } | null>(null);
  
  // Text state
  const [textData, setTextData] = useState<{ content: string; title: string; language: string; expiresAt: string } | null>(null);

  useEffect(() => {
    if (!shortUrl) return;

    // Try file first
    const fileResult = getFileByShortUrl(shortUrl);
    if (fileResult) {
      setFileData({
        dataUrl: fileResult.dataUrl,
        name: fileResult.item.name,
        size: fileResult.item.size,
        mimeType: fileResult.item.mimeType,
        type: fileResult.item.type,
        expiresAt: fileResult.item.expiresAt,
      });
      setLoading(false);
      return;
    }

    // Try text
    const textResult = getTextByShortUrl(shortUrl);
    if (textResult) {
      setTextData({
        content: textResult.content,
        title: textResult.title,
        language: textResult.language,
        expiresAt: textResult.expiresAt,
      });
      setLoading(false);
      return;
    }

    setError('Ссылка не найдена или срок хранения истёк');
    setLoading(false);
  }, [shortUrl]);

  const handleDownload = () => {
    if (!fileData) return;
    const link = document.createElement('a');
    link.href = fileData.dataUrl;
    link.download = fileData.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyText = () => {
    if (!textData) return;
    navigator.clipboard.writeText(textData.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderHeader = () => (
    <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
        {logo ? (
          <img src={logo} alt="Логотип" className="h-9 w-auto object-contain" />
        ) : (
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
        )}
        <div>
          <h1 className="text-lg font-bold text-gray-900">FileShare</h1>
          <p className="text-xs text-gray-500">Быстрый обмен файлами</p>
        </div>
      </div>
    </header>
  );

  if (loading) {
    return (
      <div className="min-h-screen">
        {renderHeader()}
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        {renderHeader()}
        <div className="flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md"
          >
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileIcon className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Не найдено</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              На главную
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Render file view
  if (fileData) {
    return (
      <div className="min-h-screen">
        {renderHeader()}
        <div className="flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 max-w-lg w-full"
        >
          {/* File Preview */}
          {fileData.type === 'image' && (
            <div className="mb-6 rounded-xl overflow-hidden border border-gray-200">
              <img src={fileData.dataUrl} alt={fileData.name} className="w-full max-h-80 object-contain bg-gray-50" />
            </div>
          )}

          {/* File Info */}
          <div className="flex items-center gap-4 mb-6">
            <div className={`p-3 rounded-xl ${fileData.type === 'image' ? 'bg-purple-100' : 'bg-blue-100'}`}>
              {fileData.type === 'image' ? (
                <Image className="w-6 h-6 text-purple-600" />
              ) : (
                <FileText className="w-6 h-6 text-blue-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-800 truncate">{fileData.name}</p>
              <p className="text-sm text-gray-500">{formatFileSize(fileData.size)}</p>
            </div>
          </div>

          {/* Expiration */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-6 bg-gray-50 rounded-lg p-3">
            <Clock className="w-4 h-4" />
            <span>Истекает через {formatExpiration(fileData.expiresAt)}</span>
          </div>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Скачать файл
          </button>

          <button
            onClick={() => navigate('/')}
            className="w-full mt-3 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            На главную
          </button>
        </motion.div>
        </div>
      </div>
    );
  }

  // Render text view
  if (textData) {
    return (
      <div className="min-h-screen">
        {renderHeader()}
        <div className="p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-800">{textData.title}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md font-medium">
                  {textData.language}
                </span>
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatExpiration(textData.expiresAt)}
                </span>
              </div>
            </div>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Назад
            </button>
          </div>

          {/* Content */}
          <div className="bg-gray-900 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
              <span className="text-xs text-gray-400 font-mono">{textData.language}</span>
              <button
                onClick={copyText}
                className={`flex items-center gap-1 px-3 py-1 rounded text-xs transition-all ${
                  copied ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Скопировано' : 'Копировать'}
              </button>
            </div>
            <pre className="p-4 overflow-x-auto text-sm text-gray-100 font-mono leading-relaxed">
              <code>{textData.content}</code>
            </pre>
          </div>
        </motion.div>
        </div>
      </div>
    );
  }

  return null;
}

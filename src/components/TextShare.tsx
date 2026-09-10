import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Copy, Check, Code } from 'lucide-react';
import { TextSnippet, UploadOptions } from '../types';
import { saveTextSnippet } from '../services/storageService';
import { getAdminSettings } from '../services/adminService';

interface TextShareProps {
  onShareComplete: (snippet: TextSnippet) => void;
}

const LANGUAGES = [
  { value: 'text', label: 'Обычный текст' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'json', label: 'JSON' },
  { value: 'sql', label: 'SQL' },
  { value: 'bash', label: 'Bash' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'java', label: 'Java' },
];

export default function TextShare({ onShareComplete }: TextShareProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [language, setLanguage] = useState('text');
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [isSharing, setIsSharing] = useState(false);
  const [sharedSnippet, setSharedSnippet] = useState<TextSnippet | null>(null);
  const [copied, setCopied] = useState(false);
  const [adminSettings, setAdminSettings] = useState(getAdminSettings());

  useEffect(() => {
    const settings = getAdminSettings();
    setAdminSettings(settings);
    setExpiresInDays(settings.defaultExpirationDays);
  }, []);

  const handleShare = async () => {
    if (!content.trim()) return;
    setIsSharing(true);

    try {
      const options: UploadOptions = { expiresInDays };
      const snippet = await saveTextSnippet(content, title, language, options);
      
      setSharedSnippet(snippet);
      onShareComplete(snippet);
    } catch (error) {
      console.error('Ошибка создания сниппета:', error);
      alert('Ошибка при создании сниппета. Попробуйте ещё раз.');
    } finally {
      setIsSharing(false);
    }
  };

  const handleNewSnippet = () => {
    setTitle('');
    setContent('');
    setLanguage('text');
    setSharedSnippet(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {!sharedSnippet ? (
          <motion.div
            key="editor"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Заголовок (необязательно)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Мой код..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Язык
              </label>
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-gray-500" />
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white"
                >
                  {LANGUAGES.map(lang => (
                    <option key={lang.value} value={lang.value}>{lang.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Содержимое
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Вставьте код или текст..."
                rows={12}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-mono text-sm resize-y bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">
                {content.length} символов
              </p>
            </div>

            {/* Expiration */}
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

            {/* Share Button */}
            <button
              onClick={handleShare}
              disabled={isSharing || !content.trim()}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Создать ссылку
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">Ссылка создана!</h3>
              <p className="text-sm text-gray-600 mb-4">
                {sharedSnippet.title} • {sharedSnippet.language}
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm bg-white px-4 py-3 rounded-lg border border-green-200 text-indigo-700 font-mono truncate">
                  {window.location.origin}/#/s/{sharedSnippet.shortUrl}
                </code>
                <button
                  onClick={() => copyToClipboard(`${window.location.origin}/#/s/${sharedSnippet.shortUrl}`)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    copied ? 'bg-green-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button
              onClick={handleNewSnippet}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              Создать ещё одну ссылку
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

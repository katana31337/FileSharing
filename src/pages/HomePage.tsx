import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FileUp, FileText, Clock, Shield, Zap, History, Trash2, Settings } from 'lucide-react';
import FileUpload from '../components/FileUpload';
import TextShare from '../components/TextShare';
import { ShareItem, TextSnippet } from '../types';
import { getAllFiles, getAllTexts, deleteItem, formatFileSize, formatExpiration } from '../services/storageService';

type Tab = 'files' | 'text' | 'history';

export default function HomePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('files');
  const [uploadedFiles, setUploadedFiles] = useState<ShareItem[]>([]);
  const [sharedTexts, setSharedTexts] = useState<TextSnippet[]>([]);
  const [historyFiles, setHistoryFiles] = useState<ShareItem[]>([]);
  const [historyTexts, setHistoryTexts] = useState<TextSnippet[]>([]);

  const handleFileUpload = (item: ShareItem) => {
    setUploadedFiles(prev => [item, ...prev]);
    refreshHistory();
  };

  const handleTextShare = (snippet: TextSnippet) => {
    setSharedTexts(prev => [snippet, ...prev]);
    refreshHistory();
  };

  const refreshHistory = () => {
    setHistoryFiles(getAllFiles());
    setHistoryTexts(getAllTexts());
  };

  const handleDelete = (id: string, type: 'file' | 'text') => {
    deleteItem(id, type);
    refreshHistory();
  };

  const copyLink = (shortUrl: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/#/s/${shortUrl}`);
  };

  const tabs = [
    { id: 'files' as Tab, label: 'Файлы', icon: FileUp },
    { id: 'text' as Tab, label: 'Текст', icon: FileText },
    { id: 'history' as Tab, label: 'История', icon: History },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">FileShare</h1>
              <p className="text-xs text-gray-500">Быстрый обмен файлами</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
              <Shield className="w-3 h-3" />
              <span>Без регистрации</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
              <Clock className="w-3 h-3" />
              <span>До 30 дней</span>
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

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-4 pt-12 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Делитесь файлами <span className="text-indigo-600">мгновенно</span>
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Загружайте файлы, делитесь кодом и текстом. Получайте короткие ссылки для быстрого доступа.
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-white rounded-xl p-1.5 shadow-sm border border-gray-200">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="max-w-2xl mx-auto"
        >
          {activeTab === 'files' && <FileUpload onUploadComplete={handleFileUpload} />}
          {activeTab === 'text' && <TextShare onShareComplete={handleTextShare} />}
          {activeTab === 'history' && (
            <div className="space-y-6">
              {/* Files History */}
              {historyFiles.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <FileUp className="w-4 h-4" />
                    Файлы ({historyFiles.length})
                  </h3>
                  <div className="space-y-2">
                    <AnimatePresence>
                      {historyFiles.map(item => (
                        <motion.div
                          key={item.id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="bg-white rounded-xl p-4 border border-gray-200 flex items-center gap-3"
                        >
                          <div className="p-2 bg-indigo-50 rounded-lg">
                            <FileUp className="w-4 h-4 text-indigo-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(item.size)} • {formatExpiration(item.expiresAt)}
                            </p>
                          </div>
                          <button
                            onClick={() => copyLink(item.shortUrl)}
                            className="px-3 py-1.5 text-xs bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors font-medium"
                          >
                            Копировать
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, 'file')}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* Texts History */}
              {historyTexts.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Тексты ({historyTexts.length})
                  </h3>
                  <div className="space-y-2">
                    <AnimatePresence>
                      {historyTexts.map(item => (
                        <motion.div
                          key={item.id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="bg-white rounded-xl p-4 border border-gray-200 flex items-center gap-3"
                        >
                          <div className="p-2 bg-green-50 rounded-lg">
                            <FileText className="w-4 h-4 text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{item.title}</p>
                            <p className="text-xs text-gray-500">
                              {item.language} • {formatExpiration(item.expiresAt)}
                            </p>
                          </div>
                          <button
                            onClick={() => copyLink(item.shortUrl)}
                            className="px-3 py-1.5 text-xs bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors font-medium"
                          >
                            Копировать
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, 'text')}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {historyFiles.length === 0 && historyTexts.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <History className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium">История пуста</p>
                  <p className="text-sm text-gray-500 mt-1">Загруженные файлы и тексты появятся здесь</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Zap,
              title: 'Мгновенный обмен',
              desc: 'Загрузите файл и получите короткую ссылку за секунды',
              color: 'indigo',
            },
            {
              icon: Shield,
              title: 'Безопасно',
              desc: 'Файлы автоматически удаляются по истечении срока хранения',
              color: 'green',
            },
            {
              icon: Clock,
              title: 'Гибкие сроки',
              desc: 'Выберите срок хранения от 1 до 30 дней',
              color: 'purple',
            },
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
                feature.color === 'indigo' ? 'bg-indigo-100' :
                feature.color === 'green' ? 'bg-green-100' : 'bg-purple-100'
              }`}>
                <feature.icon className={`w-5 h-5 ${
                  feature.color === 'indigo' ? 'text-indigo-600' :
                  feature.color === 'green' ? 'text-green-600' : 'text-purple-600'
                }`} />
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">{feature.title}</h3>
              <p className="text-sm text-gray-600">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white/50">
        <div className="max-w-5xl mx-auto px-4 py-6 text-center">
          <p className="text-sm text-gray-500">
            FileShare — сервис для быстрого обмена файлами, текстом и изображениями
          </p>
        </div>
      </footer>
    </div>
  );
}

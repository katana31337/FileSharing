// ============================================
// Сервис сессий пользователей
// ============================================
// Управляет сессиями через cookie
// Привязывает историю загрузок к сессии
// История хранится в localStorage
// ============================================

import { getAdminSettings } from './adminService';

const SESSION_COOKIE_NAME = 'fileshare_session_id';
const SESSION_HISTORY_KEY = 'fileshare_session_history';

export interface Session {
  id: string;
  createdAt: string;
  expiresAt: string;
}

export interface SessionHistory {
  sessionId: string;
  files: Array<{
    shortUrl: string;
    name: string;
    size: number;
    uploadedAt: string;
    expiresAt: string;
  }>;
  texts: Array<{
    shortUrl: string;
    title: string;
    uploadedAt: string;
    expiresAt: string;
  }>;
}

// ============================================
// Генерация уникального ID сессии
// ============================================
function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  return `sess_${timestamp}_${random}`;
}

// ============================================
// Работа с cookie
// ============================================
function setCookie(name: string, value: string, days: number): void {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value};${expires};path=/;SameSite=Strict`;
}

function getCookie(name: string): string | null {
  const nameEQ = `${name}=`;
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

function deleteCookie(name: string): void {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
}

// ============================================
// Управление сессией
// ============================================

/**
 * Получить текущую сессию или создать новую
 */
export function getCurrentSession(): Session {
  const settings = getAdminSettings();
  const sessionDays = settings.sessionDurationDays || 7;
  
  // Проверяем существующую сессию
  const sessionId = getCookie(SESSION_COOKIE_NAME);
  
  if (sessionId) {
    // Загружаем существующую сессию
    const sessionData = localStorage.getItem(`session_${sessionId}`);
    if (sessionData) {
      const session: Session = JSON.parse(sessionData);
      
      // Проверяем, не истекла ли сессия
      if (new Date(session.expiresAt) > new Date()) {
        return session;
      }
    }
  }
  
  // Создаём новую сессию
  const newSessionId = generateSessionId();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + (sessionDays * 24 * 60 * 60 * 1000));
  
  const newSession: Session = {
    id: newSessionId,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
  
  // Сохраняем сессию
  setCookie(SESSION_COOKIE_NAME, newSessionId, sessionDays);
  localStorage.setItem(`session_${newSessionId}`, JSON.stringify(newSession));
  
  // Инициализируем историю для новой сессии
  const history: SessionHistory = {
    sessionId: newSessionId,
    files: [],
    texts: [],
  };
  localStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify(history));
  
  console.log(`%c[Session] 🆕 Создана новая сессия:`, 'color: green; font-weight: bold;', newSessionId);
  
  return newSession;
}

/**
 * Получить историю загрузок текущей сессии
 */
export function getSessionHistory(): SessionHistory {
  const session = getCurrentSession();
  const historyData = localStorage.getItem(SESSION_HISTORY_KEY);
  
  if (historyData) {
    const history: SessionHistory = JSON.parse(historyData);
    
    // Проверяем, что история принадлежит текущей сессии
    if (history.sessionId === session.id) {
      return history;
    }
  }
  
  // Создаём новую историю
  const newHistory: SessionHistory = {
    sessionId: session.id,
    files: [],
    texts: [],
  };
  
  localStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify(newHistory));
  return newHistory;
}

/**
 * Добавить файл в историю сессии
 */
export function addFileToHistory(file: {
  shortUrl: string;
  name: string;
  size: number;
  expiresAt: string;
}): void {
  const history = getSessionHistory();
  
  history.files.push({
    ...file,
    uploadedAt: new Date().toISOString(),
  });
  
  localStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify(history));
  console.log(`%c[Session] 📁 Файл добавлен в историю:`, 'color: blue;', file.shortUrl);
}

/**
 * Добавить текст в историю сессии
 */
export function addTextToHistory(text: {
  shortUrl: string;
  title: string;
  expiresAt: string;
}): void {
  const history = getSessionHistory();
  
  history.texts.push({
    ...text,
    uploadedAt: new Date().toISOString(),
  });
  
  localStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify(history));
  console.log(`%c[Session] 📝 Текст добавлен в историю:`, 'color: blue;', text.shortUrl);
}

/**
 * Удалить файл из истории сессии
 */
export function removeFileFromHistory(shortUrl: string): void {
  const history = getSessionHistory();
  history.files = history.files.filter(f => f.shortUrl !== shortUrl);
  localStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify(history));
  console.log(`%c[Session] 🗑️ Файл удалён из истории:`, 'color: red;', shortUrl);
}

/**
 * Удалить текст из истории сессии
 */
export function removeTextFromHistory(shortUrl: string): void {
  const history = getSessionHistory();
  history.texts = history.texts.filter(t => t.shortUrl !== shortUrl);
  localStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify(history));
  console.log(`%c[Session] 🗑️ Текст удалён из истории:`, 'color: red;', shortUrl);
}

/**
 * Очистить всю историю сессии
 */
export function clearSessionHistory(): void {
  const history = getSessionHistory();
  history.files = [];
  history.texts = [];
  localStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify(history));
  console.log(`%c[Session] 🧹 История сессии очищена`, 'color: orange;');
}

/**
 * Удалить сессию (logout)
 */
export function destroySession(): void {
  const session = getCurrentSession();
  
  // Удаляем cookie
  deleteCookie(SESSION_COOKIE_NAME);
  
  // Удаляем данные сессии из localStorage
  localStorage.removeItem(`session_${session.id}`);
  localStorage.removeItem(SESSION_HISTORY_KEY);
  
  console.log(`%c[Session] 🔒 Сессия завершена:`, 'color: red; font-weight: bold;', session.id);
}

/**
 * Получить информацию о сессии для отображения
 */
export function getSessionInfo(): {
  id: string;
  createdAt: string;
  expiresAt: string;
  filesCount: number;
  textsCount: number;
} {
  const session = getCurrentSession();
  const history = getSessionHistory();
  
  return {
    id: session.id,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
    filesCount: history.files.length,
    textsCount: history.texts.length,
  };
}

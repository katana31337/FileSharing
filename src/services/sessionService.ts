// ============================================
// Сервис сессий пользователей
// ============================================
// Управляет сессиями через cookie
// История хранится в PostgreSQL через API
// ============================================

import { getAdminSettings } from './adminService';

const SESSION_COOKIE_NAME = 'fileshare_session_id';
const API_BASE_URL = '/api';

export interface Session {
  id: string;
  createdAt: string;
  expiresAt: string;
}

export interface SessionFile {
  id: string;
  session_id: string;
  short_url: string;
  file_name: string;
  file_size: number;
  uploaded_at: string;
  expires_at: string;
}

export interface SessionText {
  id: string;
  session_id: string;
  short_url: string;
  title: string;
  uploaded_at: string;
  expires_at: string;
}

export interface SessionHistory {
  files: SessionFile[];
  texts: SessionText[];
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
export async function getCurrentSession(): Promise<Session> {
  const settings = await getAdminSettings();
  const sessionDays = settings.sessionDurationDays || 7;
  
  // Проверяем существующую сессию
  const sessionId = getCookie(SESSION_COOKIE_NAME);
  
  if (sessionId) {
    // Сессия существует в cookie
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (sessionDays * 24 * 60 * 60 * 1000));
    
    return {
      id: sessionId,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };
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
  
  // Сохраняем сессию в cookie
  setCookie(SESSION_COOKIE_NAME, newSessionId, sessionDays);
  
  console.log(`%c[Session] 🆕 Создана новая сессия:`, 'color: green; font-weight: bold;', newSessionId);
  
  return newSession;
}

/**
 * Получить историю загрузок текущей сессии из API
 */
export async function getSessionHistory(): Promise<SessionHistory> {
  const session = await getCurrentSession();
  
  try {
    const response = await fetch(`${API_BASE_URL}/session/history`, {
      credentials: 'include', // Включаем cookie
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch session history');
    }
    
    const history: SessionHistory = await response.json();
    return history;
  } catch (error) {
    console.error('Error fetching session history:', error);
    // Возвращаем пустую историю при ошибке
    return { files: [], texts: [] };
  }
}

/**
 * Добавить файл в историю сессии через API
 */
export async function addFileToHistory(file: {
  shortUrl: string;
  name: string;
  size: number;
  expiresAt: string;
}): Promise<SessionFile | null> {
  const session = await getCurrentSession();
  
  try {
    const response = await fetch(`${API_BASE_URL}/session/history/file`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        shortUrl: file.shortUrl,
        fileName: file.name,
        fileSize: file.size,
        expiresInDays: Math.ceil(
          (new Date(file.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        ),
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to add file to history');
    }
    
    const savedFile: SessionFile = await response.json();
    console.log(`%c[Session] 📁 Файл добавлен в историю:`, 'color: blue;', savedFile.short_url);
    return savedFile;
  } catch (error) {
    console.error('Error adding file to history:', error);
    return null;
  }
}

/**
 * Добавить текст в историю сессии через API
 */
export async function addTextToHistory(text: {
  shortUrl: string;
  title: string;
  expiresAt: string;
}): Promise<SessionText | null> {
  const session = await getCurrentSession();
  
  try {
    const response = await fetch(`${API_BASE_URL}/session/history/text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        shortUrl: text.shortUrl,
        title: text.title,
        expiresInDays: Math.ceil(
          (new Date(text.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        ),
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to add text to history');
    }
    
    const savedText: SessionText = await response.json();
    console.log(`%c[Session] 📝 Текст добавлен в историю:`, 'color: blue;', savedText.short_url);
    return savedText;
  } catch (error) {
    console.error('Error adding text to history:', error);
    return null;
  }
}

/**
 * Удалить файл из истории сессии через API
 */
export async function removeFileFromHistory(shortUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/session/history/file/${shortUrl}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to remove file from history');
    }
    
    console.log(`%c[Session] 🗑️ Файл удалён из истории:`, 'color: red;', shortUrl);
    return true;
  } catch (error) {
    console.error('Error removing file from history:', error);
    return false;
  }
}

/**
 * Удалить текст из истории сессии через API
 */
export async function removeTextFromHistory(shortUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/session/history/text/${shortUrl}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to remove text from history');
    }
    
    console.log(`%c[Session] 🗑️ Текст удалён из истории:`, 'color: red;', shortUrl);
    return true;
  } catch (error) {
    console.error('Error removing text from history:', error);
    return false;
  }
}

/**
 * Очистить всю историю сессии через API
 */
export async function clearSessionHistory(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/session/history`, {
      method: 'DELETE',
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to clear session history');
    }
    
    console.log(`%c[Session] 🧹 История сессии очищена`, 'color: orange;');
    return true;
  } catch (error) {
    console.error('Error clearing session history:', error);
    return false;
  }
}

/**
 * Удалить сессию (logout)
 */
export async function destroySession(): Promise<void> {
  const session = await getCurrentSession();
  
  // Удаляем cookie
  deleteCookie(SESSION_COOKIE_NAME);
  
  console.log(`%c[Session] 🔒 Сессия завершена:`, 'color: red; font-weight: bold;', session.id);
}

/**
 * Получить информацию о сессии для отображения
 */
export async function getSessionInfo(): Promise<{
  id: string;
  createdAt: string;
  expiresAt: string;
  filesCount: number;
  textsCount: number;
}> {
  const session = await getCurrentSession();
  const history = await getSessionHistory();
  
  return {
    id: session.id,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
    filesCount: history.files.length,
    textsCount: history.texts.length,
  };
}

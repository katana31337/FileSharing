// API клиент для взаимодействия с backend
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export interface FileUploadResponse {
  id: string;
  shortUrl: string;
  name: string;
  size: number;
  mimeType: string;
  expiresAt: string;
  downloadUrl: string;
}

export interface FileInfo {
  id: string;
  shortUrl: string;
  name: string;
  size: number;
  mimeType: string;
  type: 'file' | 'image';
  createdAt: string;
  expiresAt: string;
  downloadCount: number;
}

export interface TextSnippetResponse {
  id: string;
  shortUrl: string;
  title: string;
  language: string;
  expiresAt: string;
  viewUrl: string;
}

export interface TextSnippetInfo {
  id: string;
  shortUrl: string;
  title: string;
  content: string;
  language: string;
  createdAt: string;
  expiresAt: string;
}

// Загрузка файла
export async function uploadFile(
  file: File,
  expiresInDays: number,
  onProgress?: (progress: number) => void
): Promise<FileUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('expiresInDays', expiresInDays.toString());

  const response = await fetch(`${API_BASE_URL}/files`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Ошибка загрузки файла');
  }

  return response.json();
}

// Получение информации о файле
export async function getFileInfo(shortUrl: string): Promise<FileInfo> {
  const response = await fetch(`${API_BASE_URL}/files/${shortUrl}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Файл не найден или срок хранения истёк');
    }
    throw new Error('Ошибка получения информации о файле');
  }

  return response.json();
}

// Скачивание файла
export async function downloadFile(shortUrl: string): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/files/${shortUrl}/download`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Файл не найден или срок хранения истёк');
    }
    throw new Error('Ошибка скачивания файла');
  }

  return response.blob();
}

// Создание текстового сниппета
export async function createTextSnippet(
  title: string,
  content: string,
  language: string,
  expiresInDays: number
): Promise<TextSnippetResponse> {
  const response = await fetch(`${API_BASE_URL}/texts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title,
      content,
      language,
      expiresInDays,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Ошибка создания сниппета');
  }

  return response.json();
}

// Получение текстового сниппета
export async function getTextSnippet(shortUrl: string): Promise<TextSnippetInfo> {
  const response = await fetch(`${API_BASE_URL}/texts/${shortUrl}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Сниппет не найден или срок хранения истёк');
    }
    throw new Error('Ошибка получения сниппета');
  }

  return response.json();
}

// Проверка здоровья API
export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

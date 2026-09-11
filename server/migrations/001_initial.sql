-- Миграция 001: Создание таблиц для файлов и текстовых сниппетов

-- Таблица для хранения файлов
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_url VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  storage_path VARCHAR(500) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  download_count INTEGER DEFAULT 0
);

-- Таблица для хранения текстовых сниппетов
CREATE TABLE IF NOT EXISTS text_snippets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_url VARCHAR(10) UNIQUE NOT NULL,
  title VARCHAR(255),
  content TEXT NOT NULL,
  language VARCHAR(50) DEFAULT 'plaintext',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  view_count INTEGER DEFAULT 0
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_files_short_url ON files(short_url);
CREATE INDEX IF NOT EXISTS idx_files_expires_at ON files(expires_at);
CREATE INDEX IF NOT EXISTS idx_text_snippets_short_url ON text_snippets(short_url);
CREATE INDEX IF NOT EXISTS idx_text_snippets_expires_at ON text_snippets(expires_at);

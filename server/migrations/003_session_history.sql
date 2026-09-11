-- ==========================================
-- Миграция: Таблица истории сессий
-- ==========================================
-- Хранит историю загрузок файлов и текстов
-- Привязана к сессии через session_id
-- ==========================================

-- Таблица для хранения истории файлов
CREATE TABLE IF NOT EXISTS session_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(100) NOT NULL,
  short_url VARCHAR(10) NOT NULL,
  file_name VARCHAR(500) NOT NULL,
  file_size BIGINT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Таблица для хранения истории текстов
CREATE TABLE IF NOT EXISTS session_texts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(100) NOT NULL,
  short_url VARCHAR(10) NOT NULL,
  title VARCHAR(255) NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Индексы для быстрого поиска по session_id
CREATE INDEX IF NOT EXISTS idx_session_files_session_id ON session_files(session_id);
CREATE INDEX IF NOT EXISTS idx_session_texts_session_id ON session_texts(session_id);

-- Индексы для быстрого поиска по short_url
CREATE INDEX IF NOT EXISTS idx_session_files_short_url ON session_files(short_url);
CREATE INDEX IF NOT EXISTS idx_session_texts_short_url ON session_texts(short_url);

-- Функция для очистки старых записей (опционально)
CREATE OR REPLACE FUNCTION cleanup_session_history() RETURNS void AS $$
BEGIN
  -- Удаляем записи, где срок хранения истёк
  DELETE FROM session_files WHERE expires_at < NOW();
  DELETE FROM session_texts WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

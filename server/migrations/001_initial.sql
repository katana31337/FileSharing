-- ==========================================
-- FileShare Database Schema
-- ==========================================

-- Files table
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_url VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(500) NOT NULL,
  size BIGINT NOT NULL,
  mime_type VARCHAR(255) NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  max_downloads INTEGER,
  download_count INTEGER DEFAULT 0,
  password VARCHAR(255)
);

-- Text snippets table
CREATE TABLE IF NOT EXISTS text_snippets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_url VARCHAR(10) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL DEFAULT 'Untitled',
  content TEXT NOT NULL,
  language VARCHAR(50) NOT NULL DEFAULT 'text',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_files_short_url ON files(short_url);
CREATE INDEX IF NOT EXISTS idx_files_expires_at ON files(expires_at);
CREATE INDEX IF NOT EXISTS idx_texts_short_url ON text_snippets(short_url);
CREATE INDEX IF NOT EXISTS idx_texts_expires_at ON text_snippets(expires_at);

-- Cleanup function (can be used with pg_cron)
CREATE OR REPLACE FUNCTION cleanup_expired() RETURNS void AS $$
BEGIN
  -- Delete expired files (storage cleanup handled by app)
  DELETE FROM files WHERE expires_at < NOW();
  -- Delete expired texts
  DELETE FROM text_snippets WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

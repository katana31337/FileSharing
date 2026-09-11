-- Миграция 002: Создание таблицы для настроек админ-панели

-- Таблица для хранения настроек админ-панели
CREATE TABLE IF NOT EXISTS admin_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индекс для быстрого поиска по ключу
CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON admin_settings(key);

-- Начальные значения по умолчанию
INSERT INTO admin_settings (key, value) VALUES
  ('max_file_size', '104857600'),
  ('min_expiration_days', '1'),
  ('max_expiration_days', '30'),
  ('default_expiration_days', '7'),
  ('expiration_buttons', '[1,3,7,14,30]'),
  ('session_duration_days', '7'),
  ('admin_secret_path', 'admin'),
  ('logo', ''),
  ('logo_type', 'none')
ON CONFLICT (key) DO NOTHING;

-- ==========================================
-- Миграция: Таблица настроек админки
-- ==========================================
-- Хранит конфигурацию админ-панели:
-- - Максимальный размер файла
-- - Минимальный/максимальный срок хранения
-- - Срок хранения по умолчанию
-- - Логотип сайта
-- - Секретный путь к админке
-- ==========================================

CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индекс для быстрого поиска по ключу
CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON admin_settings(key);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_admin_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического обновления updated_at
DROP TRIGGER IF EXISTS trigger_admin_settings_updated_at ON admin_settings;
CREATE TRIGGER trigger_admin_settings_updated_at
  BEFORE UPDATE ON admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_settings_updated_at();

-- Вставляем начальные значения по умолчанию
INSERT INTO admin_settings (key, value) VALUES
  ('max_file_size', '104857600'),           -- 100 MB в байтах
  ('min_expiration_days', '1'),
  ('max_expiration_days', '30'),
  ('default_expiration_days', '7'),
  ('admin_secret_path', 'admin'),
  ('logo', ''),
  ('logo_type', 'none')
ON CONFLICT (key) DO NOTHING;

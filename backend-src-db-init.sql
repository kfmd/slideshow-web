-- RSU Islam Group Slideshow Database Schema
-- PostgreSQL 16

-- Enable UUID extension (optional, for future use)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  full_name VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Slideshows table (folders/collections)
CREATE TABLE IF NOT EXISTS slideshows (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  folder_name VARCHAR(255) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for slideshows
CREATE INDEX IF NOT EXISTS idx_slideshows_active ON slideshows(is_active);
CREATE INDEX IF NOT EXISTS idx_slideshows_folder ON slideshows(folder_name);
CREATE INDEX IF NOT EXISTS idx_slideshows_order ON slideshows(display_order);

-- Slides table (individual images)
CREATE TABLE IF NOT EXISTS slides (
  id SERIAL PRIMARY KEY,
  slideshow_id INTEGER NOT NULL REFERENCES slideshows(id) ON DELETE CASCADE,
  title VARCHAR(255),
  description TEXT,
  file_path TEXT NOT NULL,
  file_type VARCHAR(50),
  file_size INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for slides
CREATE INDEX IF NOT EXISTS idx_slides_slideshow ON slides(slideshow_id);
CREATE INDEX IF NOT EXISTS idx_slides_active ON slides(is_active);
CREATE INDEX IF NOT EXISTS idx_slides_order ON slides(slideshow_id, display_order);

-- Settings table (key-value pairs for application configuration)
CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(255) PRIMARY KEY,
  value TEXT,
  description TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Slide statistics table
CREATE TABLE IF NOT EXISTS slide_stats (
  slide_id INTEGER PRIMARY KEY REFERENCES slides(id) ON DELETE CASCADE,
  display_count BIGINT DEFAULT 0,
  last_displayed TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for stats queries
CREATE INDEX IF NOT EXISTS idx_stats_count ON slide_stats(display_count DESC);

-- Audit log table (optional, for tracking changes)
CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(100),
  record_id INTEGER,
  changes JSONB,
  ip_address INET,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for audit log
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_slideshows_updated_at ON slideshows;
CREATE TRIGGER update_slideshows_updated_at BEFORE UPDATE ON slideshows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_slides_updated_at ON slides;
CREATE TRIGGER update_slides_updated_at BEFORE UPDATE ON slides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (if using specific user)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO rsu_admin;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO rsu_admin;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Database schema initialized successfully';
END $$;

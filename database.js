
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbDir = join(__dirname, 'database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = join(dbDir, 'slideshow.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const initSchema = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'user')),
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS slideshows (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL CHECK(status IN ('active', 'inactive')) DEFAULT 'active',
    display_count INTEGER NOT NULL DEFAULT 0,
    created_by TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS slides (
    id TEXT PRIMARY KEY,
    slideshow_id TEXT NOT NULL,
    image_path TEXT NOT NULL,
    image_url TEXT,
    title TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_loaded INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (slideshow_id) REFERENCES slideshows(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
  );

  CREATE INDEX IF NOT EXISTS idx_slideshows_status ON slideshows(status);
  CREATE INDEX IF NOT EXISTS idx_slideshows_created_by ON slideshows(created_by);
  CREATE INDEX IF NOT EXISTS idx_slides_slideshow ON slides(slideshow_id);
  CREATE INDEX IF NOT EXISTS idx_slides_order ON slides(slideshow_id, sort_order);
`;

db.exec(initSchema);

const defaultSettings = [
  { key: 'font_family', value: 'Arial, sans-serif' },
  { key: 'title_font_size', value: '48' },
  { key: 'description_font_size', value: '24' },
  { key: 'transition_duration', value: '5000' },
  { key: 'company_logo', value: '' }
];

const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
for (const setting of defaultSettings) {
  insertSetting.run(setting.key, setting.value);
}

const queries = {
  createUser: db.prepare('INSERT INTO users (id, username, password, role) VALUES (?, ?, ?, ?)'),
  getUserByUsername: db.prepare('SELECT * FROM users WHERE username = ?'),
  getUserById: db.prepare('SELECT * FROM users WHERE id = ?'),
  getAllUsers: db.prepare('SELECT id, username, role, created_at FROM users ORDER BY created_at DESC'),
  updateUser: db.prepare('UPDATE users SET username = ?, role = ? WHERE id = ?'),
  updatePassword: db.prepare('UPDATE users SET password = ? WHERE id = ?'),
  deleteUser: db.prepare('DELETE FROM users WHERE id = ?'),

  createSlideshow: db.prepare('INSERT INTO slideshows (id, title, description, status, created_by) VALUES (?, ?, ?, ?, ?)'),
  getSlideshow: db.prepare('SELECT * FROM slideshows WHERE id = ?'),
  getAllSlideshows: db.prepare('SELECT * FROM slideshows ORDER BY created_at DESC'),
  getActiveSlideshows: db.prepare("SELECT * FROM slideshows WHERE status = 'active' ORDER BY created_at DESC"),
  getSlideshowsByUser: db.prepare('SELECT * FROM slideshows WHERE created_by = ? ORDER BY created_at DESC'),
  updateSlideshow: db.prepare("UPDATE slideshows SET title = ?, description = ?, status = ?, updated_at = strftime('%s', 'now') WHERE id = ?"),
  incrementDisplayCount: db.prepare('UPDATE slideshows SET display_count = display_count + 1 WHERE id = ?'),
  deleteSlideshow: db.prepare('DELETE FROM slideshows WHERE id = ?'),

  createSlide: db.prepare('INSERT INTO slides (id, slideshow_id, image_path, image_url, title, description, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)'),
  getSlide: db.prepare('SELECT * FROM slides WHERE id = ?'),
  getSlidesBySlideshow: db.prepare('SELECT * FROM slides WHERE slideshow_id = ? ORDER BY sort_order ASC'),
  updateSlide: db.prepare('UPDATE slides SET title = ?, description = ?, image_path = ?, image_url = ?, is_loaded = ? WHERE id = ?'),
  updateSlideOrder: db.prepare('UPDATE slides SET sort_order = ? WHERE id = ?'),
  deleteSlide: db.prepare('DELETE FROM slides WHERE id = ?'),
  deleteSlidesBySlideshow: db.prepare('DELETE FROM slides WHERE slideshow_id = ?'),
  markSlideAsNotLoaded: db.prepare('UPDATE slides SET is_loaded = 0 WHERE id = ?'),
  getNotLoadedSlides: db.prepare('SELECT * FROM slides WHERE is_loaded = 0'),

  getSetting: db.prepare('SELECT value FROM settings WHERE key = ?'),
  getAllSettings: db.prepare('SELECT * FROM settings'),
  updateSetting: db.prepare("INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, strftime('%s', 'now'))"),

  getStats: db.prepare(`
    SELECT 
      (SELECT COUNT(*) FROM slideshows) as total_slideshows,
      (SELECT COUNT(*) FROM slideshows WHERE status = 'active') as active_slideshows,
      (SELECT COUNT(*) FROM slideshows WHERE status = 'inactive') as inactive_slideshows,
      (SELECT SUM(display_count) FROM slideshows) as total_displays,
      (SELECT COUNT(*) FROM slides) as total_slides
  `),
  getSlideshowStats: db.prepare(`
    SELECT 
      s.id, s.title, s.status, s.display_count,
      COUNT(sl.id) as slide_count, s.created_at
    FROM slideshows s
    LEFT JOIN slides sl ON s.id = sl.slideshow_id
    GROUP BY s.id
    ORDER BY s.display_count DESC
  `)
};

export { db, queries };


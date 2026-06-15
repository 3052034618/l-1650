import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
const bcrypt = require('bcryptjs');

const dbDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'poetry.db');
export const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const initSql = `
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar VARCHAR(255),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    meter_rules TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS poems (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    category_id INTEGER,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    genre VARCHAR(50) NOT NULL,
    tone_pattern TEXT,
    rhyme_pattern TEXT,
    audio_url VARCHAR(255),
    audio_duration INTEGER,
    waveform_data TEXT,
    is_shared BOOLEAN DEFAULT 0,
    is_approved BOOLEAN DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    favorites_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    poem_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (poem_id) REFERENCES poems(id) ON DELETE CASCADE,
    UNIQUE(user_id, poem_id)
);

CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    poem_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (poem_id) REFERENCES poems(id) ON DELETE CASCADE,
    UNIQUE(user_id, poem_id)
);

CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    poem_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (poem_id) REFERENCES poems(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    reminder_time TIME DEFAULT '09:00:00',
    is_enabled BOOLEAN DEFAULT 1,
    timezone VARCHAR(50) DEFAULT 'Asia/Shanghai',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_poems_user_id ON poems(user_id);
CREATE INDEX IF NOT EXISTS idx_poems_category_id ON poems(category_id);
CREATE INDEX IF NOT EXISTS idx_poems_is_shared ON poems(is_shared);
CREATE INDEX IF NOT EXISTS idx_poems_is_approved ON poems(is_approved);
CREATE INDEX IF NOT EXISTS idx_poems_created_at ON poems(created_at);
CREATE INDEX IF NOT EXISTS idx_likes_poem_id ON likes(poem_id);
CREATE INDEX IF NOT EXISTS idx_comments_poem_id ON comments(poem_id);
CREATE INDEX IF NOT EXISTS idx_favorites_poem_id ON favorites(poem_id);
`;

db.exec(initSql);

const insertCategories = db.prepare(`
  INSERT OR IGNORE INTO categories (name, description, meter_rules) VALUES
  ('五言绝句', '四句，每句五字，共20字', '{"lines": 4, "charsPerLine": 5, "pattern": ["仄仄平平仄", "平平仄仄平", "平平平仄仄", "仄仄仄平平"]}'),
  ('七言绝句', '四句，每句七字，共28字', '{"lines": 4, "charsPerLine": 7, "pattern": ["平平仄仄仄平平", "仄仄平平仄仄平", "仄仄平平平仄仄", "平平仄仄仄平平"]}'),
  ('五言律诗', '八句，每句五字，共40字', '{"lines": 8, "charsPerLine": 5, "pattern": ["仄仄平平仄", "平平仄仄平", "平平平仄仄", "仄仄仄平平", "仄仄平平仄", "平平仄仄平", "平平平仄仄", "仄仄仄平平"]}'),
  ('七言律诗', '八句，每句七字，共56字', '{"lines": 8, "charsPerLine": 7, "pattern": ["平平仄仄仄平平", "仄仄平平仄仄平", "仄仄平平平仄仄", "平平仄仄仄平平", "平平仄仄平平仄", "仄仄平平仄仄平", "仄仄平平平仄仄", "平平仄仄仄平平"]}'),
  ('词', '长短句，依词牌格律', '{"custom": true}'),
  ('曲', '元曲体裁', '{"custom": true}'),
  ('现代诗', '自由体，无严格格律', '{"custom": true}'),
  ('古风', '古体诗，格律较宽', '{"custom": true}')
`);
insertCategories.run();

export function initAdminUser() {
  const checkAdmin = db.prepare('SELECT id FROM users WHERE username = ?');
  const adminExists = checkAdmin.get('admin');

  if (!adminExists) {
    const passwordHash = bcrypt.hashSync('admin123', 10);
    const insertAdmin = db.prepare(`
      INSERT INTO users (username, email, password_hash, role) VALUES
      ('admin', 'admin@poetry.com', ?, 'admin')
    `);
    insertAdmin.run(passwordHash);
  }
}

export default db;

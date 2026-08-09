import SQLite from 'react-native-sqlite-storage';

SQLite.enablePromise(true);

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDB(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  dbInstance = await SQLite.openDatabase({ name: 'ish_daftarim.db', location: 'default' });
  await initSchema(dbInstance);
  return dbInstance;
}

async function initSchema(db: SQLite.SQLiteDatabase) {
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      icon TEXT,
      sort_order INTEGER DEFAULT 0
    );
  `);

  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT DEFAULT 'medium',
      due_at TEXT,
      reminder_rule TEXT,
      location_lat REAL,
      location_lng REAL,
      location_radius INTEGER,
      location_label TEXT,
      repeat_rule TEXT,
      status TEXT DEFAULT 'pending',
      source TEXT DEFAULT 'manual',
      audio_file_path TEXT,
      transcript_text TEXT,
      location_notified INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      completed_at TEXT,
      FOREIGN KEY (category_id) REFERENCES categories (id)
    );
  `);

  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS task_completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      completed_at TEXT NOT NULL
    );
  `);

  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      default_time TEXT,
      icon TEXT,
      category_id INTEGER
    );
  `);

  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS scratchpad (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS meeting_recordings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      audio_file_path TEXT NOT NULL,
      full_transcript TEXT,
      duration_sec INTEGER,
      created_at TEXT NOT NULL
    );
  `);

  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS focus_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER,
      duration_min INTEGER DEFAULT 25,
      completed INTEGER DEFAULT 0,
      started_at TEXT NOT NULL
    );
  `);

  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS stats_daily (
      date TEXT PRIMARY KEY,
      tasks_planned INTEGER DEFAULT 0,
      tasks_done INTEGER DEFAULT 0,
      focus_minutes INTEGER DEFAULT 0
    );
  `);

  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS app_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      pin_hash TEXT,
      biometric_enabled INTEGER DEFAULT 0,
      backup_last_at TEXT
    );
  `);

  // Standart kategoriyalarni bir marta yaratish
  const [result] = await db.executeSql('SELECT COUNT(*) as cnt FROM categories');
  if (result.rows.item(0).cnt === 0) {
    const defaults = [
      ['Ish', '#1B9C85', '💼'],
      ['Majlislar', '#4FC7AE', '🗓️'],
      ['Shaxsiy', '#F5A623', '🏠'],
    ];
    for (const [name, color, icon] of defaults) {
      await db.executeSql(
        'INSERT INTO categories (name, color, icon, sort_order) VALUES (?, ?, ?, 0)',
        [name, color, icon]
      );
    }
  }
}

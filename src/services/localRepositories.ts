import { getDB } from '../db/database';

export interface Category {
  id: number;
  name: string;
  color: string;
  icon: string | null;
  sort_order: number;
}

export interface ScratchpadNote {
  id: number;
  text: string;
  created_at: string;
}

function rowsToArray<T>(rows: any): T[] {
  const arr: T[] = [];
  for (let i = 0; i < rows.length; i++) arr.push(rows.item(i));
  return arr;
}

export const CategoryRepository = {
  async list(): Promise<Category[]> {
    const db = await getDB();
    const [res] = await db.executeSql('SELECT * FROM categories ORDER BY sort_order ASC, id ASC');
    return rowsToArray<Category>(res.rows);
  },

  async create(name: string, color: string, icon?: string): Promise<number> {
    const db = await getDB();
    const [res] = await db.executeSql(
      'INSERT INTO categories (name, color, icon, sort_order) VALUES (?, ?, ?, 0)',
      [name, color, icon ?? '📁']
    );
    return res.insertId;
  },

  async remove(id: number): Promise<void> {
    const db = await getDB();
    await db.executeSql('UPDATE tasks SET category_id = NULL WHERE category_id = ?', [id]);
    await db.executeSql('DELETE FROM categories WHERE id = ?', [id]);
  },
};

export const ScratchpadRepository = {
  async list(): Promise<ScratchpadNote[]> {
    const db = await getDB();
    const [res] = await db.executeSql('SELECT * FROM scratchpad ORDER BY created_at DESC');
    return rowsToArray<ScratchpadNote>(res.rows);
  },

  async create(text: string): Promise<number> {
    const db = await getDB();
    const [res] = await db.executeSql('INSERT INTO scratchpad (text, created_at) VALUES (?, ?)', [
      text,
      new Date().toISOString(),
    ]);
    return res.insertId;
  },

  async remove(id: number): Promise<void> {
    const db = await getDB();
    await db.executeSql('DELETE FROM scratchpad WHERE id = ?', [id]);
  },
};

export const SettingsRepository = {
  async get(): Promise<{ pin_hash: string | null; biometric_enabled: boolean; backup_last_at: string | null }> {
    const db = await getDB();
    const [res] = await db.executeSql('SELECT * FROM app_settings WHERE id = 1');
    if (res.rows.length === 0) {
      await db.executeSql('INSERT INTO app_settings (id, biometric_enabled) VALUES (1, 0)');
      return { pin_hash: null, biometric_enabled: false, backup_last_at: null };
    }
    const row = res.rows.item(0);
    return {
      pin_hash: row.pin_hash,
      biometric_enabled: !!row.biometric_enabled,
      backup_last_at: row.backup_last_at,
    };
  },

  async setPin(pinHash: string | null): Promise<void> {
    const db = await getDB();
    await db.executeSql('UPDATE app_settings SET pin_hash = ? WHERE id = 1', [pinHash]);
  },

  async setBiometric(enabled: boolean): Promise<void> {
    const db = await getDB();
    await db.executeSql('UPDATE app_settings SET biometric_enabled = ? WHERE id = 1', [
      enabled ? 1 : 0,
    ]);
  },

  async markBackupDone(): Promise<void> {
    const db = await getDB();
    await db.executeSql('UPDATE app_settings SET backup_last_at = ? WHERE id = 1', [
      new Date().toISOString(),
    ]);
  },
};

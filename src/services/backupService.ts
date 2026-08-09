import RNFS from 'react-native-fs';
import { getDB } from '../db/database';

const TABLES = [
  'categories',
  'tasks',
  'templates',
  'scratchpad',
  'meeting_recordings',
  'focus_sessions',
  'stats_daily',
];

/**
 * Barcha ma'lumotni bitta JSON faylga eksport qiladi va qurilma xotirasiga
 * (Documents papkasiga) saqlaydi. Hech qanday bulut xizmati ishlatilmaydi —
 * foydalanuvchi shu faylni USB/Bluetooth orqali o'zi ko'chirishi mumkin.
 */
export async function exportBackupToFile(): Promise<string> {
  const db = await getDB();
  const backup: Record<string, any[]> = {};

  for (const table of TABLES) {
    const [res] = await db.executeSql(`SELECT * FROM ${table}`);
    const rows: any[] = [];
    for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
    backup[table] = rows;
  }

  const fileName = `ish_daftarim_backup_${Date.now()}.json`;
  const path = `${RNFS.DownloadDirectoryPath}/${fileName}`;
  await RNFS.writeFile(path, JSON.stringify(backup, null, 2), 'utf8');
  return path;
}

/**
 * Eng so'nggi backup faylni Downloads papkasidan topib tiklaydi.
 * (Kelajakda fayl tanlash dialogini qo'shish mumkin — hozircha eng oxirgi
 * backup faylini avtomatik oladi.)
 */
export async function importBackupFromFile(filePath?: string): Promise<void> {
  let targetPath = filePath;

  if (!targetPath) {
    const files = await RNFS.readDir(RNFS.DownloadDirectoryPath);
    const backups = files
      .filter((f) => f.name.startsWith('ish_daftarim_backup_'))
      .sort((a, b) => (b.mtime?.getTime() ?? 0) - (a.mtime?.getTime() ?? 0));
    if (backups.length === 0) throw new Error('Zaxira fayl topilmadi');
    targetPath = backups[0].path;
  }

  const content = await RNFS.readFile(targetPath, 'utf8');
  const backup = JSON.parse(content);
  const db = await getDB();

  await db.transaction(async (tx) => {
    for (const table of TABLES) {
      await tx.executeSql(`DELETE FROM ${table}`);
      const rows: any[] = backup[table] ?? [];
      for (const row of rows) {
        const columns = Object.keys(row);
        const placeholders = columns.map(() => '?').join(', ');
        const values = columns.map((c) => row[c]);
        await tx.executeSql(
          `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`,
          values
        );
      }
    }
  });
}

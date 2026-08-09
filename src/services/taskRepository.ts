import { getDB } from '../db/database';
import { computeNextOccurrence, rollForwardToFuture, RepeatRule } from './recurrenceService';
import { scheduleTaskReminder, cancelTaskReminder } from './notificationService';

export type TaskStatus = 'pending' | 'done' | 'snoozed' | 'archived';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskSource = 'manual' | 'voice' | 'meeting' | 'template';

export interface Task {
  id: number;
  category_id: number | null;
  title: string;
  description: string | null;
  priority: TaskPriority;
  due_at: string | null;
  reminder_rule: string | null;
  location_lat: number | null;
  location_lng: number | null;
  location_radius: number | null;
  location_label: string | null;
  repeat_rule: string | null;
  status: TaskStatus;
  source: TaskSource;
  audio_file_path: string | null;
  transcript_text: string | null;
  location_notified?: number;
  created_at: string;
  completed_at: string | null;
}

export interface NewTaskInput {
  title: string;
  description?: string;
  category_id?: number | null;
  priority?: TaskPriority;
  due_at?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  location_radius?: number | null;
  location_label?: string | null;
  repeat_rule?: string | null;
  source?: TaskSource;
  audio_file_path?: string | null;
  transcript_text?: string | null;
}

function rowsToArray<T>(rows: any): T[] {
  const arr: T[] = [];
  for (let i = 0; i < rows.length; i++) arr.push(rows.item(i));
  return arr;
}

export const TaskRepository = {
  async listByDate(dateISO: string): Promise<Task[]> {
    const db = await getDB();
    const start = `${dateISO}T00:00:00`;
    const end = `${dateISO}T23:59:59`;
    const [res] = await db.executeSql(
      `SELECT * FROM tasks WHERE due_at BETWEEN ? AND ? AND status != 'archived' ORDER BY due_at ASC`,
      [start, end]
    );
    return rowsToArray<Task>(res.rows);
  },

  async listByCategory(categoryId: number): Promise<Task[]> {
    const db = await getDB();
    const [res] = await db.executeSql(
      `SELECT * FROM tasks WHERE category_id = ? AND status != 'archived' ORDER BY due_at ASC`,
      [categoryId]
    );
    return rowsToArray<Task>(res.rows);
  },

  async search(query: string): Promise<Task[]> {
    const db = await getDB();
    const like = `%${query}%`;
    const [res] = await db.executeSql(
      `SELECT * FROM tasks WHERE title LIKE ? OR transcript_text LIKE ? OR description LIKE ? ORDER BY created_at DESC`,
      [like, like, like]
    );
    return rowsToArray<Task>(res.rows);
  },

  async create(input: NewTaskInput): Promise<number> {
    const db = await getDB();
    const now = new Date().toISOString();
    const [res] = await db.executeSql(
      `INSERT INTO tasks
        (category_id, title, description, priority, due_at, location_lat, location_lng,
         location_radius, location_label, repeat_rule, status, source, audio_file_path,
         transcript_text, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)`,
      [
        input.category_id ?? null,
        input.title,
        input.description ?? null,
        input.priority ?? 'medium',
        input.due_at ?? null,
        input.location_lat ?? null,
        input.location_lng ?? null,
        input.location_radius ?? null,
        input.location_label ?? null,
        input.repeat_rule ?? null,
        input.source ?? 'manual',
        input.audio_file_path ?? null,
        input.transcript_text ?? null,
        now,
      ]
    );
    const insertedId = res.insertId;
    // Vaqtga bog'langan vazifa uchun lokal bildirishnoma rejalashtiriladi
    if (input.due_at) {
      await scheduleTaskReminder(insertedId, input.title, input.due_at).catch(() => {});
    }
    return insertedId;
  },

  /**
   * Vazifa holatini yangilaydi. Agar vazifa takrorlanuvchi bo'lsa (repeat_rule
   * mavjud) va "bajarildi" deb belgilansa — bajarilish tarixga yoziladi va
   * vazifaning o'zi keyingi sanaga avtomatik suriladi (qayta "pending" holatga
   * qaytadi), shu bilan cheksiz takrorlanish ta'minlanadi.
   */
  async updateStatus(id: number, status: TaskStatus): Promise<void> {
    const db = await getDB();

    if (status === 'done') {
      const [taskRes] = await db.executeSql('SELECT * FROM tasks WHERE id = ?', [id]);
      if (taskRes.rows.length === 0) return;
      const task: Task = taskRes.rows.item(0);
      const now = new Date().toISOString();

      // Bajarilganlik tarixga yoziladi (statistika uchun)
      await db.executeSql(
        'INSERT INTO task_completions (task_id, title, completed_at) VALUES (?, ?, ?)',
        [id, task.title, now]
      );

      if (task.repeat_rule && task.due_at) {
        const nextDue = computeNextOccurrence(task.due_at, task.repeat_rule as RepeatRule);
        await db.executeSql(
          `UPDATE tasks SET status = 'pending', due_at = ?, completed_at = NULL WHERE id = ?`,
          [nextDue, id]
        );
        await cancelTaskReminder(id).catch(() => {});
        await scheduleTaskReminder(id, task.title, nextDue).catch(() => {});
        return;
      }

      await db.executeSql(`UPDATE tasks SET status = 'done', completed_at = ? WHERE id = ?`, [
        now,
        id,
      ]);
      await cancelTaskReminder(id).catch(() => {});
      return;
    }

    const completedAt = null;
    await db.executeSql(`UPDATE tasks SET status = ?, completed_at = ? WHERE id = ?`, [
      status,
      completedAt,
      id,
    ]);
  },

  /**
   * Ilova ochilganda chaqiriladi: foydalanuvchi bir necha kun ilovani
   * ochmagan bo'lsa, o'tib ketgan takrorlanuvchi vazifalarni eng yaqin
   * kelajakdagi sanaga suradi (masalan "har kuni" vazifa 3 kun oldingi
   * sanada qolib ketmasligi uchun).
   */
  async rollForwardOverdueRecurringTasks(): Promise<void> {
    const db = await getDB();
    const [res] = await db.executeSql(
      `SELECT * FROM tasks WHERE repeat_rule IS NOT NULL AND status = 'pending' AND due_at < ?`,
      [new Date().toISOString()]
    );
    for (let i = 0; i < res.rows.length; i++) {
      const task: Task = res.rows.item(i);
      if (!task.due_at || !task.repeat_rule) continue;
      const rolled = rollForwardToFuture(task.due_at, task.repeat_rule as RepeatRule);
      if (rolled !== task.due_at) {
        await db.executeSql('UPDATE tasks SET due_at = ? WHERE id = ?', [rolled, task.id]);
        await cancelTaskReminder(task.id).catch(() => {});
        await scheduleTaskReminder(task.id, task.title, rolled).catch(() => {});
      }
    }
  },

  async moveToCategory(id: number, categoryId: number): Promise<void> {
    const db = await getDB();
    await db.executeSql(`UPDATE tasks SET category_id = ? WHERE id = ?`, [categoryId, id]);
  },

  async remove(id: number): Promise<void> {
    const db = await getDB();
    await db.executeSql(`DELETE FROM tasks WHERE id = ?`, [id]);
  },

  async weeklyStats(): Promise<{ tasksDone: number; tasksPlanned: number }> {
    const db = await getDB();
    const since = new Date(Date.now() - 7 * 86400000).toISOString();
    const [doneRes] = await db.executeSql(
      `SELECT COUNT(*) as cnt FROM tasks WHERE status = 'done' AND completed_at >= ?`,
      [since]
    );
    const [plannedRes] = await db.executeSql(
      `SELECT COUNT(*) as cnt FROM tasks WHERE created_at >= ?`,
      [since]
    );
    return {
      tasksDone: doneRes.rows.item(0).cnt,
      tasksPlanned: plannedRes.rows.item(0).cnt,
    };
  },
};

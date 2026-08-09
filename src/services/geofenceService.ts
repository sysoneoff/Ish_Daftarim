import Geolocation from '@react-native-community/geolocation';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { getDB } from '../db/database';
import { Task } from './taskRepository';

/**
 * Joyga bog'langan eslatmalar — butunlay lokal, hech qanday server yoki
 * bulut xizmati ishlatilmaydi.
 *
 * ESLATMA (chegara): Bu servis ilova ochiq/fon rejimida ishlaydi (foreground
 * watch). To'liq background (ilova yopilganda ham) geofencing uchun Android
 * native Geofencing API'siga chuqurroq integratsiya (masalan
 * react-native-background-geolocation kabi maxsus kutubxona) kerak bo'ladi —
 * bu keyingi versiya uchun qoldirilgan. Hozirgi yechim ilova ochiq bo'lganda
 * (yoki OS ruxsat bergan fon boshqaruv oynasida) ishonchli ishlaydi.
 */

let watchId: number | null = null;
const notifiedTaskIds = new Set<number>();

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function getGeofencedPendingTasks(): Promise<Task[]> {
  const db = await getDB();
  const [res] = await db.executeSql(
    `SELECT * FROM tasks
     WHERE status = 'pending' AND location_lat IS NOT NULL AND location_lng IS NOT NULL
       AND location_notified = 0`
  );
  const arr: Task[] = [];
  for (let i = 0; i < res.rows.length; i++) arr.push(res.rows.item(i));
  return arr;
}

async function markLocationNotified(taskId: number) {
  const db = await getDB();
  await db.executeSql('UPDATE tasks SET location_notified = 1 WHERE id = ?', [taskId]);
}

async function fireLocationNotification(task: Task) {
  await notifee.createChannel({
    id: 'location',
    name: 'Joy asosidagi eslatmalar',
    importance: AndroidImportance.HIGH,
  });
  await notifee.displayNotification({
    title: task.location_label ? `📍 ${task.location_label}` : '📍 Joy eslatmasi',
    body: task.title,
    android: { channelId: 'location', pressAction: { id: 'default' } },
  });
}

async function checkGeofences(lat: number, lng: number) {
  const tasks = await getGeofencedPendingTasks();
  for (const task of tasks) {
    if (notifiedTaskIds.has(task.id)) continue;
    if (task.location_lat == null || task.location_lng == null) continue;

    const distance = haversineMeters(lat, lng, task.location_lat, task.location_lng);
    const radius = task.location_radius ?? 150;

    if (distance <= radius) {
      notifiedTaskIds.add(task.id);
      await fireLocationNotification(task);
      await markLocationNotified(task.id);
    }
  }
}

/**
 * Joy kuzatuvini boshlaydi. App.tsx ichida ilova ochilganda chaqiriladi.
 */
export function startGeofenceWatch() {
  if (watchId !== null) return;

  watchId = Geolocation.watchPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      checkGeofences(latitude, longitude).catch(() => {});
    },
    () => {},
    {
      enableHighAccuracy: false,
      distanceFilter: 50, // faqat 50m dan ko'p siljiganda qayta tekshiradi (batareyani tejash)
      interval: 60000,
    }
  );
}

export function stopGeofenceWatch() {
  if (watchId !== null) {
    Geolocation.clearWatch(watchId);
    watchId = null;
  }
}

/**
 * Vazifa qayta tahrirlanganda (masalan joy o'zgartirilganda) eslatma
 * qayta faollashtirilishi uchun location_notified bayrog'ini tiklaydi.
 */
export async function resetLocationNotification(taskId: number) {
  const db = await getDB();
  await db.executeSql('UPDATE tasks SET location_notified = 0 WHERE id = ?', [taskId]);
  notifiedTaskIds.delete(taskId);
}

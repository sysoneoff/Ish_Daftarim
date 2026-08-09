import notifee, { TimestampTrigger, TriggerType, AndroidImportance } from '@notifee/react-native';

/**
 * To'liq lokal (device-only) rejalashtirilgan bildirishnomalar.
 * Firebase yoki boshqa bulut xizmati ishlatilmaydi.
 */

export async function ensureNotificationChannel() {
  await notifee.createChannel({
    id: 'tasks',
    name: 'Vazifa eslatmalari',
    importance: AndroidImportance.HIGH,
  });
}

export async function scheduleTaskReminder(taskId: number, title: string, dueAtISO: string) {
  await ensureNotificationChannel();
  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: new Date(dueAtISO).getTime(),
  };

  await notifee.createTriggerNotification(
    {
      id: `task-${taskId}`,
      title: "Vazifa eslatmasi",
      body: title,
      android: { channelId: 'tasks', pressAction: { id: 'default' } },
    },
    trigger
  );
}

export async function cancelTaskReminder(taskId: number) {
  await notifee.cancelTriggerNotification(`task-${taskId}`);
}

export async function scheduleDailyBriefing(hour: number, minute: number, isMorning: boolean) {
  await ensureNotificationChannel();
  const now = new Date();
  const fireDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0);
  if (fireDate.getTime() < now.getTime()) fireDate.setDate(fireDate.getDate() + 1);

  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: fireDate.getTime(),
    repeatFrequency: 1, // kunlik takrorlanish
  };

  await notifee.createTriggerNotification(
    {
      id: isMorning ? 'morning-briefing' : 'evening-briefing',
      title: isMorning ? "Xayrli tong!" : 'Kun yakuni',
      body: isMorning
        ? "Bugungi rejalaringizni ko'rib chiqing"
        : "Bugun nimalar bajarildi? Ko'rib chiqing",
      android: { channelId: 'tasks', pressAction: { id: 'default' } },
    },
    trigger
  );
}

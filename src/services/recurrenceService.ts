export type RepeatRule = 'daily' | 'weekly' | 'monthly';

export const repeatRuleLabels: Record<RepeatRule, string> = {
  daily: 'Har kuni',
  weekly: 'Har hafta',
  monthly: 'Har oy',
};

/**
 * Berilgan sanadan keyingi takrorlanish sanasini hisoblaydi.
 * Vaqt (soat:daqiqa) saqlanib qoladi, faqat kun o'zgaradi.
 */
export function computeNextOccurrence(currentDueAt: string, rule: RepeatRule): string {
  const d = new Date(currentDueAt);

  switch (rule) {
    case 'daily':
      d.setDate(d.getDate() + 1);
      break;
    case 'weekly':
      d.setDate(d.getDate() + 7);
      break;
    case 'monthly':
      d.setMonth(d.getMonth() + 1);
      break;
  }

  return d.toISOString();
}

/**
 * Sana o'tib ketgan takrorlanuvchi vazifalar uchun bugungi/eng yaqin
 * kelajakdagi sanaga yetguncha oldinga suradi (masalan foydalanuvchi
 * ilovani bir necha kun ochmagan bo'lsa).
 */
export function rollForwardToFuture(dueAt: string, rule: RepeatRule): string {
  let next = dueAt;
  const now = Date.now();
  let guard = 0;
  while (new Date(next).getTime() < now && guard < 366) {
    next = computeNextOccurrence(next, rule);
    guard += 1;
  }
  return next;
}

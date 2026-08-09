import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import GradientHeader from '../components/GradientHeader';
import PoweredBySysOne from '../components/PoweredBySysOne';
import { colors, typography, spacing, radius, priorityColors, priorityLabels } from '../theme/theme';
import { Task, TaskRepository } from '../services/taskRepository';

function formatTime(iso: string | null) {
  if (!iso) return '--:--';
  const d = new Date(iso);
  return d.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
}

export default function TimelineScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);

  const load = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];
    const data = await TaskRepository.listByDate(today);
    setTasks(data);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const doneCount = tasks.filter((t) => t.status === 'done').length;
  const progress = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;

  const toggleDone = async (task: Task) => {
    await TaskRepository.updateStatus(task.id, task.status === 'done' ? 'pending' : 'done');
    load();
  };

  return (
    <View style={styles.screen}>
      <GradientHeader title="Bugungi rejalar" subtitle={`${doneCount}/${tasks.length} bajarildi`} />

      <View style={styles.progressCard}>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressPercent}>{progress}% bajarildi</Text>
      </View>

      <FlatList
        data={tasks}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: 16 }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Bugun uchun rejalar yo'q. Yangi vazifa qo'shing.</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.taskCard} onPress={() => toggleDone(item)}>
            <View style={[styles.checkbox, item.status === 'done' && styles.checkboxDone]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.taskTitle, item.status === 'done' && styles.taskTitleDone]}>
                {item.title}
              </Text>
              <Text style={styles.taskTime}>{formatTime(item.due_at)}</Text>
            </View>
            <View
              style={[
                styles.priorityBadge,
                { backgroundColor: priorityColors[item.priority] + '22' },
              ]}
            >
              <Text style={[styles.priorityText, { color: priorityColors[item.priority] }]}>
                {priorityLabels[item.priority]}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
      <PoweredBySysOne />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  progressCard: {
    marginHorizontal: spacing.md,
    marginTop: -spacing.lg,
    backgroundColor: colors.cardBackground,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  progressBarBg: { height: 10, backgroundColor: colors.border, borderRadius: 6, overflow: 'hidden' },
  progressBarFill: { height: 10, backgroundColor: colors.teal, borderRadius: 6 },
  progressPercent: { ...typography.caption, marginTop: 8 },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.teal,
    marginRight: spacing.sm,
  },
  checkboxDone: { backgroundColor: colors.teal },
  taskTitle: { ...typography.body, fontWeight: '600' },
  taskTitleDone: { textDecorationLine: 'line-through', color: colors.textSecondary },
  taskTime: { ...typography.caption, marginTop: 2 },
  priorityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  priorityText: { fontSize: 11, fontWeight: '700' },
  emptyText: { textAlign: 'center', color: colors.textSecondary, marginTop: 40 },
});

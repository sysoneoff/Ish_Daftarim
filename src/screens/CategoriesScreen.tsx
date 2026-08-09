import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import GradientHeader from '../components/GradientHeader';
import PoweredBySysOne from '../components/PoweredBySysOne';
import { colors, typography, spacing, radius } from '../theme/theme';
import { Category, CategoryRepository } from '../services/localRepositories';
import { Task, TaskRepository } from '../services/taskRepository';

const PALETTE = ['#1B9C85', '#4FC7AE', '#F5A623', '#FF6B6B', '#7C6FEE', '#0D1B2A'];

export default function CategoriesScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selected, setSelected] = useState<Category | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PALETTE[0]);

  const loadCategories = useCallback(async () => {
    const data = await CategoryRepository.list();
    setCategories(data);
  }, []);

  useFocusEffect(useCallback(() => { loadCategories(); }, [loadCategories]));

  const openCategory = async (cat: Category) => {
    setSelected(cat);
    const data = await TaskRepository.listByCategory(cat.id);
    setTasks(data);
  };

  const createCategory = async () => {
    if (!newName.trim()) return;
    await CategoryRepository.create(newName.trim(), newColor);
    setNewName('');
    setModalVisible(false);
    loadCategories();
  };

  if (selected) {
    return (
      <View style={styles.screen}>
        <GradientHeader
          title={selected.name}
          subtitle={`${tasks.length} ta vazifa`}
          right={
            <TouchableOpacity onPress={() => setSelected(null)}>
              <Text style={{ color: '#fff', fontSize: 15 }}>◀ Orqaga</Text>
            </TouchableOpacity>
          }
        />
        <FlatList
          data={tasks}
          keyExtractor={(t) => String(t.id)}
          contentContainerStyle={{ padding: spacing.md }}
          ListEmptyComponent={<Text style={styles.emptyText}>Bu kategoriyada vazifa yo'q.</Text>}
          renderItem={({ item }) => (
            <View style={styles.taskRow}>
              <Text style={typography.body}>{item.title}</Text>
            </View>
          )}
        />
        <PoweredBySysOne />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <GradientHeader title="Kategoriyalar" subtitle="Vazifalaringizni tartibga soling" />

      <FlatList
        data={categories}
        keyExtractor={(c) => String(c.id)}
        numColumns={2}
        contentContainerStyle={{ padding: spacing.md }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.categoryCard, { borderLeftColor: item.color }]}
            onPress={() => openCategory(item)}
          >
            <Text style={styles.categoryIcon}>{item.icon}</Text>
            <Text style={styles.categoryName}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
        <Text style={typography.button}>+ Yangi kategoriya</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.sectionTitle}>Yangi kategoriya</Text>
            <TextInput
              style={styles.input}
              placeholder="Kategoriya nomi"
              placeholderTextColor={colors.textSecondary}
              value={newName}
              onChangeText={setNewName}
            />
            <View style={styles.colorRow}>
              {PALETTE.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: c },
                    newColor === c && styles.colorSwatchSelected,
                  ]}
                  onPress={() => setNewColor(c)}
                />
              ))}
            </View>
            <TouchableOpacity style={styles.primaryButton} onPress={createCategory}>
              <Text style={typography.button}>Yaratish</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelText}>Bekor qilish</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <PoweredBySysOne />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  categoryCard: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    borderRadius: radius.md,
    borderLeftWidth: 4,
    padding: spacing.md,
    margin: spacing.xs,
    minHeight: 90,
    justifyContent: 'center',
  },
  categoryIcon: { fontSize: 24, marginBottom: 6 },
  categoryName: { ...typography.body, fontWeight: '600' },
  taskRow: {
    backgroundColor: colors.cardBackground,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  addButton: {
    backgroundColor: colors.teal,
    marginHorizontal: spacing.md,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  emptyText: { textAlign: 'center', color: colors.textSecondary, marginTop: 40 },
  modalBackdrop: { flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: colors.cardBackground,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
  },
  sectionTitle: { ...typography.h2, marginBottom: spacing.md },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: spacing.md,
  },
  colorRow: { flexDirection: 'row', marginBottom: spacing.lg },
  colorSwatch: { width: 32, height: 32, borderRadius: 16, marginRight: 10 },
  colorSwatchSelected: { borderWidth: 3, borderColor: colors.navy },
  primaryButton: {
    backgroundColor: colors.teal,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cancelText: { textAlign: 'center', color: colors.textSecondary, paddingVertical: 8 },
});

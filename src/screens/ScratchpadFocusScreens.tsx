import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import GradientHeader from '../components/GradientHeader';
import PoweredBySysOne from '../components/PoweredBySysOne';
import { colors, typography, spacing, radius } from '../theme/theme';
import { ScratchpadNote, ScratchpadRepository } from '../services/localRepositories';

export function ScratchpadScreen() {
  const [text, setText] = useState('');
  const [notes, setNotes] = useState<ScratchpadNote[]>([]);

  const load = useCallback(async () => {
    setNotes(await ScratchpadRepository.list());
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const save = async () => {
    if (!text.trim()) return;
    await ScratchpadRepository.create(text.trim());
    setText('');
    load();
  };

  return (
    <View style={styles.screen}>
      <GradientHeader title="Qoralama" subtitle="Tez fikrlaringizni yozib qo'ying" />
      <View style={styles.content}>
        <TextInput
          style={styles.textArea}
          placeholder="Miyangizga kelgan fikrni shu yerga yozing..."
          placeholderTextColor={colors.textSecondary}
          value={text}
          onChangeText={setText}
          multiline
        />
        <TouchableOpacity style={styles.saveBtn} onPress={save}>
          <Text style={typography.button}>Saqlash</Text>
        </TouchableOpacity>

        <FlatList
          style={{ marginTop: spacing.md }}
          data={notes}
          keyExtractor={(i) => String(i.id)}
          renderItem={({ item }) => (
            <View style={styles.noteCard}>
              <Text style={typography.body}>{item.text}</Text>
            </View>
          )}
        />
      </View>
      <PoweredBySysOne />
    </View>
  );
}

export function FocusScreen() {
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s <= 1) {
            clearInterval(intervalRef.current!);
            setRunning(false);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <View style={styles.screen}>
      <GradientHeader title="Diqqat rejimi" subtitle="Pomodoro usuli" />
      <View style={[styles.content, { alignItems: 'center', justifyContent: 'center', flex: 1 }]}>
        <Text style={styles.timerText}>{mm}:{ss}</Text>
        <Text style={styles.focusHint}>
          {running ? 'Diqqat rejimi faol — bezovta qilinmaysiz' : "Boshlash uchun tugmani bosing"}
        </Text>
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={() => {
            if (!running) setSeconds(25 * 60);
            setRunning(!running);
          }}
        >
          <Text style={typography.button}>{running ? "To'xtatish" : 'Boshlash (25 daqiqa)'}</Text>
        </TouchableOpacity>
      </View>
      <PoweredBySysOne />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.md, paddingTop: spacing.md, flex: 1 },
  textArea: {
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 15,
    color: colors.textPrimary,
  },
  saveBtn: {
    backgroundColor: colors.teal,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  noteCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  timerText: { fontSize: 56, fontWeight: '700', color: colors.textPrimary },
  focusHint: { ...typography.bodyMuted, marginTop: 12, marginBottom: 24, textAlign: 'center' },
});

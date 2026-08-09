import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import RNFS from 'react-native-fs';
import GradientHeader from '../components/GradientHeader';
import PoweredBySysOne from '../components/PoweredBySysOne';
import { colors, typography, spacing, radius } from '../theme/theme';
import { transcribeChunks } from '../services/sttService';
import { getDB } from '../db/database';
import { TaskRepository } from '../services/taskRepository';

const recorder = new AudioRecorderPlayer();
const CHUNK_DURATION_MS = 30000; // 30 soniyalik bo'laklar

type Phase = 'idle' | 'recording' | 'transcribing' | 'result';

export default function MeetingModeScreen() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [elapsedSec, setElapsedSec] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [sentences, setSentences] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const chunkPathsRef = useRef<string[]>([]);
  const chunkTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isStoppingRef = useRef(false);

  useEffect(() => {
    return () => {
      if (chunkTimerRef.current) clearInterval(chunkTimerRef.current);
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    };
  }, []);

  const startNewChunk = async () => {
    const path = `${RNFS.DocumentDirectoryPath}/meeting_chunk_${Date.now()}.m4a`;
    await recorder.startRecorder(path);
  };

  const rotateChunk = async () => {
    if (isStoppingRef.current) return;
    const finishedPath = await recorder.stopRecorder();
    chunkPathsRef.current.push(finishedPath);
    await startNewChunk();
  };

  const startMeeting = async () => {
    chunkPathsRef.current = [];
    setElapsedSec(0);
    setPhase('recording');
    await startNewChunk();

    chunkTimerRef.current = setInterval(() => {
      rotateChunk().catch(() => {});
    }, CHUNK_DURATION_MS);

    elapsedTimerRef.current = setInterval(() => {
      setElapsedSec((s) => s + 1);
    }, 1000);
  };

  const stopMeeting = async () => {
    isStoppingRef.current = true;
    if (chunkTimerRef.current) clearInterval(chunkTimerRef.current);
    if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);

    const lastPath = await recorder.stopRecorder();
    chunkPathsRef.current.push(lastPath);
    isStoppingRef.current = false;

    setPhase('transcribing');
    try {
      // Barcha bo'laklar ketma-ket on-device transkripsiya qilinadi
      const fullText = await transcribeChunks(chunkPathsRef.current);
      setTranscript(fullText);

      const parts = fullText
        .split(/(?<=[.!?])\s+|\n+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 3);
      setSentences(parts);
      setSelected(new Set());

      const db = await getDB();
      await db.executeSql(
        'INSERT INTO meeting_recordings (audio_file_path, full_transcript, duration_sec, created_at) VALUES (?, ?, ?, ?)',
        [chunkPathsRef.current.join(','), fullText, elapsedSec, new Date().toISOString()]
      );

      setPhase('result');
    } catch (e) {
      Alert.alert('Xatolik', "Majlisni matnga o'girishda muammo yuz berdi.");
      setPhase('idle');
    }
  };

  const toggleSentence = (i: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const createTasksFromSelected = async () => {
    const chosen = sentences.filter((_, i) => selected.has(i));
    if (chosen.length === 0) return;
    for (const text of chosen) {
      await TaskRepository.create({ title: text, source: 'meeting' });
    }
    Alert.alert('Bajarildi', `${chosen.length} ta vazifa qo'shildi.`);
    setPhase('idle');
    setSentences([]);
    setTranscript('');
  };

  const mm = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
  const ss = String(elapsedSec % 60).padStart(2, '0');

  return (
    <View style={styles.screen}>
      <GradientHeader title="Majlis rejimi" subtitle="Uzoq audio yozib, matnga o'giring" />

      <View style={styles.content}>
        {phase === 'idle' && (
          <>
            <Text style={styles.hint}>
              Majlis davomida yozib boring. Yakunlaganingizdan so'ng butun audio
              30 soniyalik bo'laklarga bo'lib, offline matnga o'giriladi.
            </Text>
            <TouchableOpacity style={styles.startButton} onPress={startMeeting}>
              <Text style={typography.button}>🎙️ Majlisni boshlash</Text>
            </TouchableOpacity>
          </>
        )}

        {phase === 'recording' && (
          <View style={styles.center}>
            <Text style={styles.timerText}>{mm}:{ss}</Text>
            <Text style={styles.hint}>Yozib olinmoqda...</Text>
            <TouchableOpacity style={styles.stopButton} onPress={stopMeeting}>
              <Text style={typography.button}>⏹ Yakunlash va matnga o'girish</Text>
            </TouchableOpacity>
          </View>
        )}

        {phase === 'transcribing' && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.teal} />
            <Text style={styles.hint}>Audio matnga o'girilmoqda (offline)...</Text>
          </View>
        )}

        {phase === 'result' && (
          <ScrollView>
            <Text style={styles.sectionTitle}>Aniqlangan matn</Text>
            <Text style={styles.transcriptText}>{transcript || 'Matn aniqlanmadi.'}</Text>

            <Text style={styles.sectionTitle}>Vazifaga aylantirish uchun tanlang</Text>
            {sentences.map((s, i) => (
              <TouchableOpacity key={i} style={styles.sentenceRow} onPress={() => toggleSentence(i)}>
                <View style={[styles.checkboxSquare, selected.has(i) && styles.checkboxSquareChecked]} />
                <Text style={styles.sentenceText}>{s}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.startButton} onPress={createTasksFromSelected}>
              <Text style={typography.button}>Tanlanganlarni vazifaga aylantirish</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>

      <PoweredBySysOne />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, paddingHorizontal: spacing.md, paddingTop: spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hint: { ...typography.bodyMuted, textAlign: 'center', marginVertical: spacing.md },
  startButton: {
    backgroundColor: colors.teal,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  stopButton: {
    backgroundColor: colors.danger,
    borderRadius: radius.md,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  timerText: { fontSize: 48, fontWeight: '700', color: colors.textPrimary },
  sectionTitle: { ...typography.h2, marginTop: spacing.md, marginBottom: spacing.sm },
  transcriptText: {
    ...typography.body,
    backgroundColor: colors.cardBackground,
    borderRadius: radius.md,
    padding: spacing.md,
    lineHeight: 22,
  },
  sentenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginTop: spacing.xs,
  },
  checkboxSquare: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.teal,
    marginRight: spacing.sm,
  },
  checkboxSquareChecked: { backgroundColor: colors.teal },
  sentenceText: { ...typography.body, flex: 1 },
});

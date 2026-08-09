import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import RNFS from 'react-native-fs';
import GradientHeader from '../components/GradientHeader';
import PoweredBySysOne from '../components/PoweredBySysOne';
import { colors, typography, spacing, radius, priorityColors, priorityLabels } from '../theme/theme';
import { Task, TaskRepository } from '../services/taskRepository';
import { transcribeAudioFile } from '../services/sttService';

const recorder = new AudioRecorderPlayer();

function formatDate(iso: string | null) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Task[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [searched, setSearched] = useState(false);

  const runSearch = async (text: string) => {
    if (!text.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    const data = await TaskRepository.search(text.trim());
    setResults(data);
    setSearched(true);
  };

  const onChangeText = (text: string) => {
    setQuery(text);
    runSearch(text);
  };

  const startVoiceSearch = async () => {
    setIsRecording(true);
    const path = `${RNFS.DocumentDirectoryPath}/search_${Date.now()}.m4a`;
    await recorder.startRecorder(path);
  };

  const stopVoiceSearch = async () => {
    const uri = await recorder.stopRecorder();
    setIsRecording(false);
    setIsTranscribing(true);
    try {
      const text = await transcribeAudioFile(uri);
      setQuery(text);
      await runSearch(text);
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <View style={styles.screen}>
      <GradientHeader title="Qidiruv" subtitle="Matn yoki ovoz orqali qidiring" />

      <View style={styles.content}>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.input}
            placeholder="Vazifa yoki eski yozuv nomini qidiring..."
            placeholderTextColor={colors.textSecondary}
            value={query}
            onChangeText={onChangeText}
          />
          <TouchableOpacity
            style={[styles.micButton, isRecording && styles.micButtonActive]}
            onPressIn={startVoiceSearch}
            onPressOut={stopVoiceSearch}
            disabled={isTranscribing}
          >
            {isTranscribing ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.micIcon}>🎙️</Text>
            )}
          </TouchableOpacity>
        </View>
        <Text style={styles.hint}>
          {isRecording
            ? "Gapiring... qo'yib yuborganda qidiriladi"
            : "Mikrofon tugmasini ushlab turib qidiruv so'zini ayting"}
        </Text>

        <FlatList
          data={results}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingTop: spacing.md, paddingBottom: 24 }}
          ListEmptyComponent={
            searched ? (
              <Text style={styles.emptyText}>Hech narsa topilmadi.</Text>
            ) : null
          }
          renderItem={({ item }) => (
            <View style={styles.resultCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.resultTitle}>{item.title}</Text>
                {item.transcript_text ? (
                  <Text style={styles.resultTranscript} numberOfLines={2}>
                    {item.transcript_text}
                  </Text>
                ) : null}
                <Text style={styles.resultDate}>{formatDate(item.due_at ?? item.created_at)}</Text>
              </View>
              <View
                style={[styles.priorityBadge, { backgroundColor: priorityColors[item.priority] + '22' }]}
              >
                <Text style={[styles.priorityText, { color: priorityColors[item.priority] }]}>
                  {priorityLabels[item.priority]}
                </Text>
              </View>
            </View>
          )}
        />
      </View>

      <PoweredBySysOne />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, paddingHorizontal: spacing.md, paddingTop: spacing.md },
  searchRow: { flexDirection: 'row', alignItems: 'center' },
  input: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  micButton: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micButtonActive: { backgroundColor: colors.danger },
  micIcon: { fontSize: 18 },
  hint: { ...typography.caption, marginTop: 8 },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  resultTitle: { ...typography.body, fontWeight: '600' },
  resultTranscript: { ...typography.bodyMuted, marginTop: 4 },
  resultDate: { ...typography.caption, marginTop: 4 },
  priorityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  priorityText: { fontSize: 11, fontWeight: '700' },
  emptyText: { textAlign: 'center', color: colors.textSecondary, marginTop: 40 },
});

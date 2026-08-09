import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import RNFS from 'react-native-fs';
import GradientHeader from '../components/GradientHeader';
import PoweredBySysOne from '../components/PoweredBySysOne';
import { colors, typography, spacing, radius } from '../theme/theme';
import { TaskRepository } from '../services/taskRepository';
import { transcribeAudioFile } from '../services/sttService';
import { RepeatRule, repeatRuleLabels } from '../services/recurrenceService';
import LocationPickerScreen, { PickedLocation } from './LocationPickerScreen';

const audioRecorderPlayer = new AudioRecorderPlayer();
const REPEAT_OPTIONS: (RepeatRule | null)[] = [null, 'daily', 'weekly', 'monthly'];

export default function QuickCaptureScreen() {
  const [title, setTitle] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [repeatRule, setRepeatRule] = useState<RepeatRule | null>(null);
  const [location, setLocation] = useState<PickedLocation | null>(null);
  const [mapVisible, setMapVisible] = useState(false);

  const submitText = async () => {
    if (!title.trim()) return;
    const dueAt = repeatRule ? new Date().toISOString() : undefined;
    await TaskRepository.create({
      title,
      source: 'manual',
      repeat_rule: repeatRule,
      due_at: dueAt,
      location_lat: location?.lat ?? null,
      location_lng: location?.lng ?? null,
      location_radius: location?.radius ?? null,
      location_label: location?.label ?? null,
    });
    setTitle('');
    setRepeatRule(null);
    setLocation(null);
    Alert.alert('Saqlandi', "Vazifa qo'shildi.");
  };

  const startRecording = async () => {
    setIsRecording(true);
    const path = `${RNFS.DocumentDirectoryPath}/voice_${Date.now()}.m4a`;
    await audioRecorderPlayer.startRecorder(path);
  };

  const stopRecording = async () => {
    const uri = await audioRecorderPlayer.stopRecorder();
    setIsRecording(false);
    setIsTranscribing(true);
    try {
      // Butunlay on-device — internetga hech narsa yuborilmaydi
      const text = await transcribeAudioFile(uri);
      await TaskRepository.create({
        title: text || 'Ovozli vazifa (matn aniqlanmadi)',
        source: 'voice',
        audio_file_path: uri,
        transcript_text: text,
      });
      Alert.alert('Saqlandi', 'Ovozli vazifa matnga o\'girildi va qo\'shildi.');
    } catch (e) {
      Alert.alert('Xatolik', "Ovozni matnga o'girishda muammo yuz berdi.");
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <View style={styles.screen}>
      <GradientHeader title="Tezkor qo'shish" subtitle="Yozing yoki gapiring" />

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Matn orqali</Text>
        <TextInput
          style={styles.input}
          placeholder="Masalan: Ertaga 11:00 da hisobot topshirish"
          placeholderTextColor={colors.textSecondary}
          value={title}
          onChangeText={setTitle}
          onSubmitEditing={submitText}
        />
        <Text style={styles.repeatLabel}>Takrorlanish</Text>
        <View style={styles.repeatRow}>
          {REPEAT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt ?? 'none'}
              style={[styles.repeatChip, repeatRule === opt && styles.repeatChipActive]}
              onPress={() => setRepeatRule(opt)}
            >
              <Text
                style={[styles.repeatChipText, repeatRule === opt && styles.repeatChipTextActive]}
              >
                {opt ? repeatRuleLabels[opt] : 'Yo\'q'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.locationButton}
          onPress={() => setMapVisible(true)}
        >
          <Text style={styles.locationButtonText}>
            {location ? `📍 ${location.label} (${location.radius}m)` : '📍 Joy tanlash (ixtiyoriy)'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.primaryButton} onPress={submitText}>
          <Text style={typography.button}>Qo'shish</Text>
        </TouchableOpacity>

        <Modal visible={mapVisible} animationType="slide">
          <LocationPickerScreen
            initial={location}
            onCancel={() => setMapVisible(false)}
            onConfirm={(loc) => {
              setLocation(loc);
              setMapVisible(false);
            }}
          />
        </Modal>

        <Text style={styles.sectionTitle}>Ovoz orqali</Text>
        <TouchableOpacity
          style={[styles.voiceButton, isRecording && styles.voiceButtonActive]}
          onPressIn={startRecording}
          onPressOut={stopRecording}
          disabled={isTranscribing}
        >
          {isTranscribing ? (
            <ActivityIndicator color={colors.teal} />
          ) : (
            <Text style={styles.voiceButtonText}>
              {isRecording ? "🎙️ Yozilmoqda... (qo'yib yuboring)" : "🎙️ Ushlab turib gapiring"}
            </Text>
          )}
        </TouchableOpacity>
        <Text style={styles.hint}>Butunlay offline ishlaydi — internet talab qilinmaydi</Text>
      </View>

      <PoweredBySysOne />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
  sectionTitle: { ...typography.h2, marginTop: spacing.lg, marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
  },
  primaryButton: {
    backgroundColor: colors.teal,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  voiceButton: {
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: 26,
    alignItems: 'center',
  },
  voiceButtonActive: { backgroundColor: '#FFEAEA', borderColor: colors.danger },
  voiceButtonText: { fontSize: 15, color: colors.textPrimary, fontWeight: '600' },
  hint: { ...typography.caption, textAlign: 'center', marginTop: spacing.sm },
  repeatLabel: { ...typography.caption, marginTop: spacing.sm, marginBottom: 6 },
  repeatRow: { flexDirection: 'row', flexWrap: 'wrap' },
  repeatChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  repeatChipActive: { backgroundColor: colors.teal, borderColor: colors.teal },
  repeatChipText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  repeatChipTextActive: { color: '#fff' },
  locationButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: spacing.sm,
    backgroundColor: colors.cardBackground,
  },
  locationButtonText: { fontSize: 14, color: colors.textPrimary, fontWeight: '600' },
});

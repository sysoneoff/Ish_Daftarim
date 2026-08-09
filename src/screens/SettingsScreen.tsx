import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Switch } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import GradientHeader from '../components/GradientHeader';
import PoweredBySysOne from '../components/PoweredBySysOne';
import { colors, typography, spacing, radius } from '../theme/theme';
import { SettingsRepository } from '../services/localRepositories';
import { exportBackupToFile, importBackupFromFile } from '../services/backupService';

export default function SettingsScreen() {
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(null);

  const load = useCallback(async () => {
    const s = await SettingsRepository.get();
    setBiometricEnabled(s.biometric_enabled);
    setLastBackup(s.backup_last_at);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const toggleBiometric = async (value: boolean) => {
    await SettingsRepository.setBiometric(value);
    setBiometricEnabled(value);
  };

  const doBackup = async () => {
    try {
      const path = await exportBackupToFile();
      await SettingsRepository.markBackupDone();
      load();
      Alert.alert('Bajarildi', `Zaxira nusxa saqlandi:\n${path}`);
    } catch (e) {
      Alert.alert('Xatolik', 'Zaxira nusxa yaratib bo\'lmadi.');
    }
  };

  const doRestore = async () => {
    Alert.alert(
      "Tiklashni tasdiqlang",
      "Joriy ma'lumotlar zaxira nusxadagi bilan almashtiriladi. Davom etasizmi?",
      [
        { text: 'Bekor qilish', style: 'cancel' },
        {
          text: 'Tiklash',
          style: 'destructive',
          onPress: async () => {
            try {
              await importBackupFromFile();
              Alert.alert('Bajarildi', "Ma'lumotlar tiklandi.");
            } catch (e) {
              Alert.alert('Xatolik', "Zaxira nusxani tiklab bo'lmadi.");
            }
          },
        },
      ]
    );
  };

  if (showAbout) {
    return (
      <View style={styles.screen}>
        <GradientHeader
          title="Ilova haqida"
          right={
            <TouchableOpacity onPress={() => setShowAbout(false)}>
              <Text style={{ color: '#fff', fontSize: 15 }}>◀ Orqaga</Text>
            </TouchableOpacity>
          }
        />
        <ScrollView style={styles.content}>
          <Text style={styles.aboutTitle}>"Ish Daftarim"</Text>
          <Text style={styles.aboutBody}>
            "Ish Daftarim" — SysOne Digital Solutions tomonidan ishlab chiqilgan
            shaxsiy ish quroli. Ilova xodimning kundalik vazifalarini
            tizimlashtirish, ovozli eslatmalar orqali hech narsani unutmaslik
            va o'z ish jarayonini qulay boshqarish uchun mo'ljallangan.
          </Text>
          <Text style={styles.aboutBody}>
            Ilova to'liq offline ishlaydi — barcha matn, ovozli yozuvlar va
            sozlamalar faqat sizning qurilmangizda saqlanadi. Hech qanday
            ma'lumot tashqi serverga yuborilmaydi.
          </Text>
          <Text style={styles.aboutSectionTitle}>SysOne haqida</Text>
          <Text style={styles.aboutBody}>
            SysOne — veb, desktop, mobil va bot platformalarida zamonaviy
            dasturiy yechimlar yaratuvchi brend. Muallif: Qobilbek.
          </Text>
          <Text style={styles.versionText}>Versiya 1.0.0</Text>
        </ScrollView>
        <PoweredBySysOne />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <GradientHeader title="Sozlamalar" />
      <ScrollView style={styles.content}>
        <View style={styles.row}>
          <Text style={typography.body}>Barmoq izi / Face qulf</Text>
          <Switch value={biometricEnabled} onValueChange={toggleBiometric} trackColor={{ true: colors.teal }} />
        </View>

        <TouchableOpacity style={styles.actionRow} onPress={doBackup}>
          <Text style={typography.body}>Zaxira nusxa olish (lokal)</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
        {lastBackup && (
          <Text style={styles.caption}>
            Oxirgi zaxira: {new Date(lastBackup).toLocaleString('uz-UZ')}
          </Text>
        )}

        <TouchableOpacity style={styles.actionRow} onPress={doRestore}>
          <Text style={typography.body}>Zaxira nusxadan tiklash</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionRow} onPress={() => setShowAbout(true)}>
          <Text style={typography.body}>Ilova haqida</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </ScrollView>
      <PoweredBySysOne />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.xs,
  },
  chevron: { fontSize: 18, color: colors.textSecondary },
  caption: { ...typography.caption, marginBottom: spacing.sm, marginLeft: 4 },
  aboutTitle: { ...typography.h1, marginBottom: spacing.md },
  aboutSectionTitle: { ...typography.h2, marginTop: spacing.lg, marginBottom: spacing.sm },
  aboutBody: { ...typography.body, lineHeight: 22, marginBottom: spacing.sm },
  versionText: { ...typography.caption, marginTop: spacing.lg, marginBottom: spacing.lg },
});

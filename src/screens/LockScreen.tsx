import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors, typography, spacing, radius } from '../theme/theme';

interface Props {
  correctPin: string;
  onUnlock: () => void;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

export default function LockScreen({ correctPin, onUnlock }: Props) {
  const [entered, setEntered] = useState('');
  const [error, setError] = useState(false);

  const handleKey = (key: string) => {
    if (key === '') return;
    if (key === '⌫') {
      setEntered((prev) => prev.slice(0, -1));
      return;
    }
    const next = entered + key;
    setEntered(next);
    if (next.length === correctPin.length) {
      if (next === correctPin) {
        onUnlock();
      } else {
        setError(true);
        setTimeout(() => {
          setEntered('');
          setError(false);
        }, 600);
      }
    }
  };

  return (
    <LinearGradient colors={[colors.navy, colors.tealDark]} style={styles.container}>
      <Text style={styles.title}>Ish Daftarim</Text>
      <Text style={styles.subtitle}>Davom etish uchun PIN kodni kiriting</Text>

      <View style={styles.dotsRow}>
        {Array.from({ length: correctPin.length }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i < entered.length && styles.dotFilled,
              error && styles.dotError,
            ]}
          />
        ))}
      </View>

      <View style={styles.keypad}>
        {KEYS.map((key, i) => (
          <TouchableOpacity
            key={i}
            style={styles.key}
            onPress={() => handleKey(key)}
            disabled={key === ''}
          >
            <Text style={styles.keyText}>{key}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  title: { ...typography.h1, color: '#fff', marginBottom: spacing.xs },
  subtitle: { ...typography.bodyMuted, color: '#C8D6E5', marginBottom: spacing.xl },
  dotsRow: { flexDirection: 'row', marginBottom: spacing.xl },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#fff',
    marginHorizontal: 8,
  },
  dotFilled: { backgroundColor: '#fff' },
  dotError: { borderColor: colors.danger, backgroundColor: colors.danger },
  keypad: { flexDirection: 'row', flexWrap: 'wrap', width: 260, justifyContent: 'center' },
  key: {
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 6,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF22',
  },
  keyText: { fontSize: 24, color: '#fff', fontWeight: '600' },
});

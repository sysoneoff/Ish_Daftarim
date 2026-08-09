import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors, typography, spacing, radius } from '../theme/theme';

interface Props {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}

/**
 * Har bir ekran tepasidagi signature gradient "blob" header.
 * Dizayn tizimidagi navy → teal gradient shu yerda qo'llanadi.
 */
export default function GradientHeader({ title, subtitle, right }: Props) {
  return (
    <LinearGradient
      colors={[colors.navy, colors.tealDark, colors.teal]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {right}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 56,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  title: { ...typography.h1, color: colors.textOnDark },
  subtitle: { ...typography.bodyMuted, color: '#C8D6E5', marginTop: 4 },
});

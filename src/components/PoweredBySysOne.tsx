import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '../theme/theme';

/**
 * Brendlash talabi: har ekranda ko'rinadigan "Powered by SysOne" belgisi.
 * Doimiy joylashuv: ekran pastida, tab-bar ustida yoki Sozlamalar ostida.
 */
export default function PoweredBySysOne() {
  return (
    <View style={styles.container}>
      <View style={styles.dot} />
      <Text style={styles.text}>SysOne tomonidan qo'llab-quvvatlanadi</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.teal,
    marginRight: 6,
  },
  text: { ...typography.caption, color: colors.textSecondary },
});

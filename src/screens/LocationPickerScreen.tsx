import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import MapView, { Marker, Circle, LatLng } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import GradientHeader from '../components/GradientHeader';
import { colors, typography, spacing, radius } from '../theme/theme';

export interface PickedLocation {
  lat: number;
  lng: number;
  radius: number;
  label: string;
}

interface Props {
  initial?: PickedLocation | null;
  onConfirm: (loc: PickedLocation) => void;
  onCancel: () => void;
}

const RADIUS_OPTIONS = [100, 150, 300, 500];

export default function LocationPickerScreen({ initial, onConfirm, onCancel }: Props) {
  const [marker, setMarker] = useState<LatLng | null>(
    initial ? { latitude: initial.lat, longitude: initial.lng } : null
  );
  const [radius, setRadius] = useState(initial?.radius ?? 150);
  const [label, setLabel] = useState(initial?.label ?? '');
  const [region, setRegion] = useState({
    latitude: initial?.lat ?? 41.311081,
    longitude: initial?.lng ?? 69.240562, // standart: Toshkent, GPS topilmasa
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  });

  const useCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setMarker({ latitude, longitude });
        setRegion((r) => ({ ...r, latitude, longitude }));
      },
      () => Alert.alert('Xatolik', "Joriy joylashuvni aniqlab bo'lmadi.")
    );
  };

  const confirm = () => {
    if (!marker) {
      Alert.alert("Diqqat", "Xaritada joyni belgilang.");
      return;
    }
    if (!label.trim()) {
      Alert.alert("Diqqat", "Joy uchun nom kiriting (masalan: Ofis).");
      return;
    }
    onConfirm({ lat: marker.latitude, lng: marker.longitude, radius, label: label.trim() });
  };

  return (
    <View style={styles.screen}>
      <GradientHeader
        title="Joy tanlash"
        subtitle="Vazifa uchun eslatma nuqtasini belgilang"
        right={
          <TouchableOpacity onPress={onCancel}>
            <Text style={{ color: '#fff', fontSize: 15 }}>✕ Bekor qilish</Text>
          </TouchableOpacity>
        }
      />

      <MapView
        style={styles.map}
        region={region}
        onPress={(e) => setMarker(e.nativeEvent.coordinate)}
      >
        {marker && (
          <>
            <Marker coordinate={marker} />
            <Circle
              center={marker}
              radius={radius}
              strokeColor={colors.teal}
              fillColor="rgba(27,156,133,0.15)"
            />
          </>
        )}
      </MapView>

      <View style={styles.panel}>
        <TouchableOpacity style={styles.currentLocationBtn} onPress={useCurrentLocation}>
          <Text style={styles.currentLocationText}>📍 Joriy joylashuvimni ishlatish</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Joy nomi (masalan: Ofis, Sotuv bo'limi)"
          placeholderTextColor={colors.textSecondary}
          value={label}
          onChangeText={setLabel}
        />

        <Text style={styles.radiusLabel}>Radius: {radius} metr</Text>
        <View style={styles.radiusRow}>
          {RADIUS_OPTIONS.map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.radiusChip, radius === r && styles.radiusChipActive]}
              onPress={() => setRadius(r)}
            >
              <Text style={[styles.radiusChipText, radius === r && styles.radiusChipTextActive]}>
                {r}m
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.confirmBtn} onPress={confirm}>
          <Text style={typography.button}>Tasdiqlash</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  map: { flex: 1 },
  panel: {
    backgroundColor: colors.cardBackground,
    padding: spacing.md,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  currentLocationBtn: { alignItems: 'center', paddingVertical: 8, marginBottom: spacing.sm },
  currentLocationText: { color: colors.teal, fontWeight: '600', fontSize: 14 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: spacing.sm,
  },
  radiusLabel: { ...typography.caption, marginBottom: 6 },
  radiusRow: { flexDirection: 'row', marginBottom: spacing.md },
  radiusChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
  },
  radiusChipActive: { backgroundColor: colors.teal, borderColor: colors.teal },
  radiusChipText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  radiusChipTextActive: { color: '#fff' },
  confirmBtn: {
    backgroundColor: colors.teal,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
});

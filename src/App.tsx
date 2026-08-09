import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text } from 'react-native';

import TimelineScreen from './screens/TimelineScreen';
import QuickCaptureScreen from './screens/QuickCaptureScreen';
import CategoriesScreen from './screens/CategoriesScreen';
import { ScratchpadScreen, FocusScreen } from './screens/ScratchpadFocusScreens';
import MeetingModeScreen from './screens/MeetingModeScreen';
import SearchScreen from './screens/SearchScreen';
import SettingsScreen from './screens/SettingsScreen';
import LockScreen from './screens/LockScreen';
import { SettingsRepository } from './services/localRepositories';
import { TaskRepository } from './services/taskRepository';
import { startGeofenceWatch, stopGeofenceWatch } from './services/geofenceService';
import { colors } from './theme/theme';

const Tab = createBottomTabNavigator();

const icons: Record<string, string> = {
  Bugun: '📅',
  Qoshish: '➕',
  Kategoriyalar: '🗂️',
  Majlis: '🎤',
  Qidiruv: '🔍',
  Qoralama: '📝',
  Fokus: '🎯',
  Sozlamalar: '⚙️',
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: () => <Text style={{ fontSize: 20 }}>{icons[route.name]}</Text>,
        tabBarActiveTintColor: colors.teal,
        tabBarInactiveTintColor: colors.textSecondary,
      })}
    >
      <Tab.Screen name="Bugun" component={TimelineScreen} />
      <Tab.Screen name="Qoshish" component={QuickCaptureScreen} />
      <Tab.Screen name="Kategoriyalar" component={CategoriesScreen} />
      <Tab.Screen name="Majlis" component={MeetingModeScreen} />
      <Tab.Screen name="Qidiruv" component={SearchScreen} />
      <Tab.Screen name="Qoralama" component={ScratchpadScreen} />
      <Tab.Screen name="Fokus" component={FocusScreen} />
      <Tab.Screen name="Sozlamalar" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [pinHash, setPinHash] = useState<string | null | undefined>(undefined);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    SettingsRepository.get().then((s) => setPinHash(s.pin_hash));
    // Ilova ochilganda: o'tib ketgan takrorlanuvchi vazifalarni suradi
    // va joyga bog'langan eslatmalar uchun kuzatuvni boshlaydi.
    TaskRepository.rollForwardOverdueRecurringTasks().catch(() => {});
    startGeofenceWatch();
    return () => stopGeofenceWatch();
  }, []);

  // Sozlamalar hali yuklanmoqda
  if (pinHash === undefined) return null;

  // PIN o'rnatilmagan bo'lsa yoki qulf ochilgan bo'lsa — asosiy ilova
  if (!pinHash || unlocked) {
    return (
      <SafeAreaProvider>
        <NavigationContainer>
          <MainTabs />
        </NavigationContainer>
      </SafeAreaProvider>
    );
  }

  return <LockScreen correctPin={pinHash} onUnlock={() => setUnlocked(true)} />;
}

import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import PagerView from 'react-native-pager-view';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts, Creepster_400Regular } from '@expo-google-fonts/creepster';
import {
  Oswald_400Regular,
  Oswald_500Medium,
  Oswald_600SemiBold,
  Oswald_700Bold,
} from '@expo-google-fonts/oswald';
import TallyScreen from './screens/TallyScreen';
import HistoryScreen from './screens/HistoryScreen';
import { HOUSES } from './constants/houses';
import { COLORS, FONTS } from './constants/theme';
import type { Visit } from './types';

const STORAGE_KEY = 'hhn_visits';
const TABS = [
  { key: 'tally', label: 'Tally', icon: '🏚️' },
  { key: 'history', label: 'History', icon: '🗓️' },
];

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Migrates records saved by the old { house, timestamp } schema to { id, houseId, timestamp }.
function migrateVisit(visit: any): Visit {
  if (visit.houseId) return visit;
  const match = HOUSES.find((h) => h.name === visit.house);
  return {
    id: visit.id ?? makeId(),
    houseId: match?.id ?? visit.house,
    timestamp: visit.timestamp,
  };
}

export default function App() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const pagerRef = useRef<PagerView>(null);

  const [fontsLoaded] = useFonts({
    Creepster_400Regular,
    Oswald_400Regular,
    Oswald_500Medium,
    Oswald_600SemiBold,
    Oswald_700Bold,
  });

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) setVisits(JSON.parse(raw).map(migrateVisit));
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(visits));
  }, [visits, loaded]);

  const addVisit = (houseId: string, timestamp: string = new Date().toISOString()) => {
    setVisits((prev) => [...prev, { id: makeId(), houseId, timestamp }]);
  };

  const removeVisit = (visitId: string) => {
    setVisits((prev) => prev.filter((v) => v.id !== visitId));
  };

  const goToPage = (index: number) => {
    pagerRef.current?.setPage(index);
  };

  if (!fontsLoaded) {
    return <View style={styles.container} />;
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <PagerView
          ref={pagerRef}
          style={styles.content}
          initialPage={0}
          onPageSelected={(e) => setPageIndex(e.nativeEvent.position)}
        >
          <View key="tally" style={styles.page}>
            <TallyScreen visits={visits} onTally={addVisit} />
          </View>
          <View key="history" style={styles.page}>
            <HistoryScreen
              visits={visits}
              onAddVisit={addVisit}
              onRemoveVisit={removeVisit}
            />
          </View>
        </PagerView>
        <View style={styles.tabBar}>
          {TABS.map((tab, index) => (
            <Pressable
              key={tab.key}
              style={styles.tabButton}
              onPress={() => goToPage(index)}
            >
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text
                style={[
                  styles.tabText,
                  pageIndex === index && styles.tabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <StatusBar style="light" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  tabText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontFamily: FONTS.semiBold,
  },
  tabTextActive: {
    color: COLORS.neonRed,
  },
});

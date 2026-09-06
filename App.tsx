import { useEffect, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
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
const MAX_CONTENT_WIDTH = 480;
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
  const scrollRef = useRef<ScrollView>(null);
  const { width } = useWindowDimensions();
  const pageWidth = Math.min(width, MAX_CONTENT_WIDTH);

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
    scrollRef.current?.scrollTo({ x: index * pageWidth, animated: true });
    // Set immediately rather than waiting on a scroll-end event: react-native-web
    // never fires onMomentumScrollEnd, so a tab click would otherwise never
    // update the highlight on web.
    setPageIndex(index);
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
    setPageIndex(newIndex);
  };

  if (!fontsLoaded) {
    return <View style={styles.container} />;
  }

  return (
    <SafeAreaProvider>
      <View style={styles.outer}>
        <SafeAreaView style={styles.container}>
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            style={styles.content}
          >
            <View key="tally" style={[styles.page, { width: pageWidth }]}>
              <TallyScreen visits={visits} onTally={addVisit} />
            </View>
            <View key="history" style={[styles.page, { width: pageWidth }]}>
              <HistoryScreen
                visits={visits}
                onAddVisit={addVisit}
                onRemoveVisit={removeVisit}
              />
            </View>
          </ScrollView>
          <View style={styles.tabBar}>
            {TABS.map((tab, index) => (
              <Pressable
                key={tab.key}
                style={[
                  styles.tabButton,
                  pageIndex === index && styles.tabButtonActive,
                ]}
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
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  tabBar: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 16,
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 26,
  },
  tabButtonActive: {
    backgroundColor: COLORS.neonRedTint,
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

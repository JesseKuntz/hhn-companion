import { useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  ImageBackground,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { HOUSES_ALPHABETICAL, HOUSE_BY_ID } from '../constants/houses';
import { COLORS, FONTS } from '../constants/theme';
import { exportVisitsAsJson } from '../utils/export';
import type { Visit } from '../types';

type DayGroup = {
  key: string;
  visits: Visit[];
};

function dayKeyFor(isoString: string): string {
  const d = new Date(isoString);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDayHeader(dayKey: string): string {
  const [y, m, d] = dayKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

type HistoryScreenProps = {
  visits: Visit[];
  onAddVisit: (houseId: string, timestamp?: string) => void;
  onRemoveVisit: (visitId: string) => void;
};

export default function HistoryScreen({
  visits,
  onAddVisit,
  onRemoveVisit,
}: HistoryScreenProps) {
  const [addingForDay, setAddingForDay] = useState<string | null>(null);

  const days = useMemo<DayGroup[]>(() => {
    const groups: Record<string, Visit[]> = {};
    visits.forEach((visit) => {
      const key = dayKeyFor(visit.timestamp);
      if (!groups[key]) groups[key] = [];
      groups[key].push(visit);
    });
    Object.values(groups).forEach((list) =>
      list.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )
    );
    return Object.keys(groups)
      .sort()
      .reverse()
      .map((key) => ({ key, visits: groups[key] }));
  }, [visits]);

  const handleAddHouse = (houseId: string) => {
    const dayVisits = days.find((d) => d.key === addingForDay)?.visits ?? [];
    const lastTimestamp = dayVisits.length
      ? new Date(dayVisits[dayVisits.length - 1].timestamp)
      : new Date();
    const timestamp = new Date(lastTimestamp.getTime() + 1000).toISOString();
    onAddVisit(houseId, timestamp);
    setAddingForDay(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>History</Text>
      <Pressable
        style={[styles.exportButton, visits.length === 0 && styles.exportButtonDisabled]}
        onPress={() => exportVisitsAsJson(visits)}
        disabled={visits.length === 0}
      >
        <Text style={styles.exportButtonText}>📤 Export Data (JSON)</Text>
      </Pressable>
      <FlatList
        data={days}
        keyExtractor={(day) => day.key}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No visits logged yet.</Text>
        }
        renderItem={({ item: day }) => (
          <View style={styles.dayGroup}>
            <Text style={styles.dayHeader}>{formatDayHeader(day.key)}</Text>
            {day.visits.map((visit) => {
              const house = HOUSE_BY_ID[visit.houseId];
              return (
                <View key={visit.id} style={styles.visitRow}>
                  <ImageBackground
                    source={house?.image}
                    style={styles.imageFill}
                    resizeMode="cover"
                  >
                    <View style={styles.overlay} />
                  </ImageBackground>
                  <View style={styles.visitContent}>
                    <View style={styles.visitInfo}>
                      <Text style={styles.visitName}>
                        {house?.name ?? 'Unknown house'}
                      </Text>
                      <Text style={styles.visitTime}>
                        {formatTime(visit.timestamp)}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => onRemoveVisit(visit.id)}
                      style={styles.deleteButton}
                      hitSlop={8}
                    >
                      <Text style={styles.deleteText}>×</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
            <Pressable
              style={styles.addButton}
              onPress={() => setAddingForDay(day.key)}
            >
              <Text style={styles.addButtonText}>+ Add missed house</Text>
            </Pressable>
          </View>
        )}
      />

      <Modal
        visible={addingForDay !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setAddingForDay(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Which house?</Text>
            <FlatList
              data={HOUSES_ALPHABETICAL}
              keyExtractor={(house) => house.id}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.modalRow}
                  onPress={() => handleAddHouse(item.id)}
                >
                  <Image source={item.image} style={styles.modalThumbnail} />
                  <Text style={styles.modalRowText}>{item.name}</Text>
                </Pressable>
              )}
            />
            <Pressable
              style={styles.modalCancel}
              onPress={() => setAddingForDay(null)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 30,
    color: COLORS.neonRed,
    fontFamily: FONTS.display,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 12,
  },
  exportButton: {
    borderWidth: 1,
    borderColor: COLORS.neonTeal,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  exportButtonDisabled: {
    opacity: 0.4,
  },
  exportButtonText: {
    color: COLORS.neonTeal,
    fontFamily: FONTS.semiBold,
    fontSize: 14,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  empty: {
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginTop: 32,
  },
  dayGroup: {
    marginBottom: 22,
  },
  dayHeader: {
    fontSize: 15,
    fontFamily: FONTS.semiBold,
    color: COLORS.neonTeal,
    marginBottom: 8,
  },
  visitRow: {
    minHeight: 76,
    justifyContent: 'flex-end',
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  imageFill: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: COLORS.overlay,
  },
  visitContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  visitInfo: {
    flex: 1,
  },
  visitName: {
    fontSize: 14,
    color: COLORS.text,
    fontFamily: FONTS.semiBold,
  },
  visitTime: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  deleteButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    fontSize: 20,
    color: COLORS.textMuted,
  },
  addButton: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 2,
  },
  addButtonText: {
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    maxHeight: '75%',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: FONTS.display,
    color: COLORS.neonRed,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  modalThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginRight: 12,
  },
  modalRowText: {
    fontSize: 15,
    color: COLORS.text,
    fontFamily: FONTS.regular,
    flex: 1,
  },
  modalCancel: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
    fontSize: 15,
  },
});

import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { HOUSES } from '../constants/houses';
import { COLORS, FONTS } from '../constants/theme';
import { groupVisitsIntoNights } from '../utils/nights';
import type { Visit } from '../types';

type TotalCardProps = {
  label: string;
  value: number;
  detail?: string;
};

function TotalCard({ label, value, detail }: TotalCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardValue}>{value}</Text>
      <Text style={styles.cardLabel}>{label}</Text>
      {detail ? <Text style={styles.cardDetail}>{detail}</Text> : null}
    </View>
  );
}

type TotalsScreenProps = {
  visits: Visit[];
};

export default function TotalsScreen({ visits }: TotalsScreenProps) {
  const nightCount = useMemo(() => groupVisitsIntoNights(visits).length, [visits]);
  const uniqueHouseCount = useMemo(
    () => new Set(visits.map((v) => v.houseId)).size,
    [visits]
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Totals</Text>
      <ScrollView contentContainerStyle={styles.list}>
        <TotalCard
          label="Houses Visited"
          value={visits.length}
          detail={`${uniqueHouseCount} of ${HOUSES.length} unique houses`}
        />
        <TotalCard label={nightCount === 1 ? 'Night' : 'Nights'} value={nightCount} />
      </ScrollView>
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
  list: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  cardValue: {
    fontSize: 56,
    color: COLORS.neonRed,
    fontFamily: FONTS.bold,
  },
  cardLabel: {
    fontSize: 16,
    color: COLORS.text,
    fontFamily: FONTS.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardDetail: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
    marginTop: 4,
  },
});

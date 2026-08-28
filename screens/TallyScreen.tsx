import { useRef } from 'react';
import {
  Animated,
  Easing,
  FlatList,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { HOUSES_ALPHABETICAL, type House } from '../constants/houses';
import { COLORS, FONTS } from '../constants/theme';
import type { Visit } from '../types';

const HOLD_DURATION_MS = 1200;
// Swallows the first moments of a touch so a scroll gesture never triggers a tally
// or even the initial haptic tick. Scroll recognition can take a little while to
// kick in on a real device, so this needs real margin, not just a token delay.
const ARM_DELAY_MS = 280;

type HouseRowProps = {
  house: House;
  count: number;
  onTally: (houseId: string) => void;
  setActiveCancel: (cancelFn: (() => void) | null) => void;
};

function HouseRow({ house, count, onTally, setActiveCancel }: HouseRowProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const firedRef = useRef(false);
  const armTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelHold = () => {
    if (armTimeoutRef.current) {
      clearTimeout(armTimeoutRef.current);
      armTimeoutRef.current = null;
    }
    if (!firedRef.current) {
      Animated.timing(progress, {
        toValue: 0,
        duration: 150,
        useNativeDriver: false,
      }).start();
    }
    setActiveCancel(null);
  };

  const startPress = () => {
    firedRef.current = false;
    armTimeoutRef.current = setTimeout(() => {
      armTimeoutRef.current = null;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      progress.setValue(0);
      Animated.timing(progress, {
        toValue: 1,
        duration: HOLD_DURATION_MS,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) {
          firedRef.current = true;
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onTally(house.id);
          progress.setValue(0);
          setActiveCancel(null);
        }
      });
    }, ARM_DELAY_MS);
    setActiveCancel(() => cancelHold);
  };

  const endPress = () => {
    cancelHold();
  };

  return (
    <Pressable onPressIn={startPress} onPressOut={endPress} style={styles.row}>
      <ImageBackground
        source={house.image}
        style={StyleSheet.absoluteFillObject}
        imageStyle={styles.rowImage}
      >
        <View style={styles.overlay} />
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: progress.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </ImageBackground>
      <View style={styles.rowContent}>
        <Text style={styles.houseName}>{house.name}</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{count}</Text>
        </View>
      </View>
    </Pressable>
  );
}

type TallyScreenProps = {
  visits: Visit[];
  onTally: (houseId: string) => void;
};

export default function TallyScreen({ visits, onTally }: TallyScreenProps) {
  const activeCancelRef = useRef<(() => void) | null>(null);

  const setActiveCancel = (cancelFn: (() => void) | null) => {
    activeCancelRef.current = cancelFn;
  };

  const handleScrollBeginDrag = () => {
    if (activeCancelRef.current) {
      activeCancelRef.current();
      activeCancelRef.current = null;
    }
  };

  const countFor = (houseId: string) =>
    visits.filter((v) => v.houseId === houseId).length;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>HHN Companion</Text>
      <Text style={styles.subtitle}>Press and hold a house to tally a visit</Text>
      <FlatList
        data={HOUSES_ALPHABETICAL}
        keyExtractor={(house) => house.id}
        contentContainerStyle={styles.list}
        onScrollBeginDrag={handleScrollBeginDrag}
        renderItem={({ item }) => (
          <HouseRow
            house={item}
            count={countFor(item.id)}
            onTally={onTally}
            setActiveCancel={setActiveCancel}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 34,
    color: COLORS.neonRed,
    fontFamily: FONTS.display,
    textAlign: 'center',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 16,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  row: {
    minHeight: 100,
    justifyContent: 'flex-end',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rowImage: {
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlay,
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: COLORS.neonRedSoft,
  },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  houseName: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    fontFamily: FONTS.semiBold,
    marginRight: 10,
  },
  countBadge: {
    minWidth: 30,
    alignItems: 'center',
  },
  countText: {
    fontSize: 20,
    color: COLORS.neonTeal,
    fontFamily: FONTS.bold,
  },
});

import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { HOUSE_BY_ID } from '../constants/houses';
import type { Visit } from '../types';

export async function exportVisitsAsJson(visits: Visit[]): Promise<void> {
  try {
    const sorted = [...visits].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const payload = {
      exportedAt: new Date().toISOString(),
      visits: sorted.map((v) => ({
        id: v.id,
        houseId: v.houseId,
        houseName: HOUSE_BY_ID[v.houseId]?.name ?? null,
        timestamp: v.timestamp,
      })),
    };

    const file = new File(Paths.cache, `hhn-companion-export-${Date.now()}.json`);
    file.create();
    file.write(JSON.stringify(payload, null, 2));

    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      Alert.alert('Sharing unavailable', 'This device cannot open the share sheet.');
      return;
    }

    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle: 'Export HHN Companion Data',
    });
  } catch (error) {
    console.error('Export failed', error);
    Alert.alert('Export failed', 'Something went wrong while exporting your data.');
  }
}

import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';
import { HOUSE_BY_ID } from '../constants/houses';
import type { Visit } from '../types';

function buildExportPayload(visits: Visit[]) {
  const sorted = [...visits].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return {
    exportedAt: new Date().toISOString(),
    visits: sorted.map((v) => ({
      id: v.id,
      houseId: v.houseId,
      houseName: HOUSE_BY_ID[v.houseId]?.name ?? null,
      timestamp: v.timestamp,
    })),
  };
}

// expo-file-system's File/Paths API has no web implementation, and expo-sharing's
// web fallback (navigator.share) can't share arbitrary local files. Browsers
// download files via a Blob + temporary anchor click instead.
function exportOnWeb(visits: Visit[]): void {
  const payload = buildExportPayload(visits);
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `hhn-companion-export-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function exportOnNative(visits: Visit[]): Promise<void> {
  const payload = buildExportPayload(visits);

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
}

export async function exportVisitsAsJson(visits: Visit[]): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      exportOnWeb(visits);
    } else {
      await exportOnNative(visits);
    }
  } catch (error) {
    console.error('Export failed', error);
    Alert.alert('Export failed', 'Something went wrong while exporting your data.');
  }
}

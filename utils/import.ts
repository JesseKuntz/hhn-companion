import { File } from 'expo-file-system';
import { Alert, Platform } from 'react-native';
import type { Visit } from '../types';

// accepts the shape written by exportVisitsAsJson: { exportedAt, visits: [...] }
function parseVisits(raw: string): Visit[] {
  const parsed = JSON.parse(raw);
  const list = Array.isArray(parsed) ? parsed : parsed?.visits;
  if (!Array.isArray(list)) throw new Error('No visits array found');

  return list
    .filter(
      (v: any) =>
        typeof v?.id === 'string' &&
        typeof v?.houseId === 'string' &&
        !Number.isNaN(new Date(v?.timestamp).getTime())
    )
    .map((v: any) => ({ id: v.id, houseId: v.houseId, timestamp: v.timestamp }));
}

// no native picker on web, so open a hidden file input instead
function pickTextOnWeb(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      file.text().then(resolve, () => resolve(null));
    };
    input.oncancel = () => resolve(null);
    input.click();
  });
}

async function pickTextOnNative(): Promise<string | null> {
  const picked = await File.pickFileAsync({ mimeTypes: 'application/json' });
  if (picked.canceled) return null;
  return picked.result.text();
}

export function notifyImportResult(title: string, message: string): void {
  // Alert.alert is a no-op on react-native-web
  if (Platform.OS === 'web') window.alert(`${title}\n\n${message}`);
  else Alert.alert(title, message);
}

// returns the visits from a picked export file, or null if canceled or invalid
export async function importVisitsFromJson(): Promise<Visit[] | null> {
  try {
    const raw = Platform.OS === 'web' ? await pickTextOnWeb() : await pickTextOnNative();
    if (raw === null) return null;
    return parseVisits(raw);
  } catch (error) {
    console.error('Import failed', error);
    notifyImportResult('Import failed', 'That file doesn’t look like an HHN Companion export.');
    return null;
  }
}

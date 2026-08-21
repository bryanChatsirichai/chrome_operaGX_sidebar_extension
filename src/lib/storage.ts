import { gxGetDefaultStorageData } from './defaults';
import type { Pin, Settings, StorageData } from './types';

export async function gxGetStorageData(): Promise<StorageData> {
  const defaults = gxGetDefaultStorageData();
  const stored = await chrome.storage.sync.get(['pins', 'settings', 'lastActivePinId', 'sidebarHidden']);

  return {
    pins: stored.pins ?? defaults.pins,
    settings: { ...defaults.settings, ...(stored.settings ?? {}) },
    lastActivePinId: stored.lastActivePinId ?? defaults.lastActivePinId,
    sidebarHidden: stored.sidebarHidden ?? defaults.sidebarHidden
  };
}

export async function gxSavePins(pins: Pin[]): Promise<void> {
  await chrome.storage.sync.set({ pins });
}

export async function gxSaveSettings(settings: Settings): Promise<void> {
  await chrome.storage.sync.set({ settings });
}

export async function gxSaveLastActivePinId(lastActivePinId: string): Promise<void> {
  await chrome.storage.sync.set({ lastActivePinId });
}

export async function gxSaveSidebarHidden(sidebarHidden: boolean): Promise<void> {
  await chrome.storage.sync.set({ sidebarHidden });
}

export async function gxInitializeStorage(): Promise<void> {
  const stored = await chrome.storage.sync.get(['pins', 'settings']);
  const defaults = gxGetDefaultStorageData();

  if (!stored.pins) {
    await chrome.storage.sync.set({
      pins: defaults.pins,
      settings: defaults.settings,
      lastActivePinId: defaults.lastActivePinId,
      sidebarHidden: defaults.sidebarHidden
    });
  }
}

export async function gxResetStorageToDefaults(): Promise<StorageData> {
  const defaults = gxGetDefaultStorageData();
  await chrome.storage.sync.set(defaults);
  return defaults;
}

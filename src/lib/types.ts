/** A pinned website shown as an icon in the sidebar strip. */
export interface Pin {
  id: string;
  name: string;
  url: string;
  /** Absolute http(s) URL, or an extension-relative path (e.g. `icons/apps/x.svg`). */
  iconUrl: string;
  /** Position in the strip; kept contiguous (0..n-1) by `reindexPins`. */
  order: number;
}

/** User-configurable sidebar preferences. */
export interface Settings {
  panelWidth: number;
  /** Persisted but not yet read by the UI — only the dark theme exists. */
  theme: string;
}

/** Full persisted extension state in chrome.storage.sync. */
export interface StorageData {
  pins: Pin[];
  settings: Settings;
  lastActivePinId: string | null;
  sidebarHidden: boolean;
}

/** Editable fields of the add/edit pin form. */
export interface PinFormState {
  name: string;
  url: string;
  iconUrl: string;
}

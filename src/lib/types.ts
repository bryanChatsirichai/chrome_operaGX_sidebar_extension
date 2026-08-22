/** How the companion popup window resolves its vertical size. */
export type CompanionHeightMode = 'match' | 'fixed';

/** Where the companion window is placed relative to the browser or screen. */
export type CompanionPosition = 'right' | 'left' | 'screen-right' | 'screen-left';

/** A pinned website shown as an icon in the sidebar strip. */
export interface Pin {
  id: string;
  name: string;
  url: string;
  iconUrl: string;
  order: number;
}

/** User-configurable sidebar and companion window preferences. */
export interface Settings {
  panelWidth: number;
  theme: string;
  companionWidth: number;
  companionHeightMode: CompanionHeightMode;
  companionHeight: number;
  companionPosition: CompanionPosition;
}

/** Resolved size and placement used when opening the companion window. */
export interface CompanionLayout {
  width: number;
  heightMode: CompanionHeightMode;
  height: number;
  position: CompanionPosition;
}

/** Full persisted extension state in chrome.storage.sync. */
export interface StorageData {
  pins: Pin[];
  settings: Settings;
  lastActivePinId: string | null;
  sidebarHidden: boolean;
}

/** In-memory and session-persisted companion window tracking state. */
export interface CompanionState {
  windowId: number | null;
  pinId: string | null;
  anchorWindowId: number | null;
  layout: CompanionLayout;
}

/** Result returned when opening, reusing, or closing the companion window. */
export interface CompanionOpenResult {
  ok: boolean;
  open?: boolean;
  pinId?: string;
  reused?: boolean;
  navigatedInPlace?: boolean;
  skipped?: boolean;
  error?: string;
}

/** Usable screen area excluding OS taskbars and docks. */
export interface DisplayWorkArea {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Pixel bounds for positioning a Chrome window. */
export interface WindowBounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

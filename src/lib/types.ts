export type CompanionHeightMode = 'match' | 'fixed';

export type CompanionPosition = 'right' | 'left' | 'screen-right' | 'screen-left';

export interface Pin {
  id: string;
  name: string;
  url: string;
  iconUrl: string;
  order: number;
}

export interface Settings {
  panelWidth: number;
  theme: string;
  companionWidth: number;
  companionHeightMode: CompanionHeightMode;
  companionHeight: number;
  companionPosition: CompanionPosition;
}

export interface CompanionLayout {
  width: number;
  heightMode: CompanionHeightMode;
  height: number;
  position: CompanionPosition;
}

export interface StorageData {
  pins: Pin[];
  settings: Settings;
  lastActivePinId: string | null;
  sidebarHidden: boolean;
}

export interface CompanionState {
  windowId: number | null;
  pinId: string | null;
  anchorWindowId: number | null;
  layout: CompanionLayout;
}

export interface CompanionOpenResult {
  ok: boolean;
  open?: boolean;
  pinId?: string;
  reused?: boolean;
  navigatedInPlace?: boolean;
  skipped?: boolean;
  error?: string;
}

export interface DisplayWorkArea {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface WindowBounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

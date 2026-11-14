/**
 * Appearance presets for the in-page sidebar. Only ids and display names
 * live here; each preset's colours are CSS custom properties keyed by
 * `[data-theme='<id>']` in sidebar.module.scss, so the Settings swatches
 * render with the exact colours they apply.
 */
export const THEME_PRESETS = [
  { id: 'gx-red', name: 'GX Red' },
  { id: 'ultraviolet', name: 'Ultraviolet' },
  { id: 'rose-quartz', name: 'Rose Quartz' },
  { id: 'ocean', name: 'Ocean' },
  { id: 'toxic', name: 'Toxic' },
  { id: 'light', name: 'Light' }
] as const;

export type ThemeId = (typeof THEME_PRESETS)[number]['id'];

export const DEFAULT_THEME_ID: ThemeId = 'gx-red';

/**
 * Maps a stored theme value to a known preset. Older installs stored
 * 'dark' (the only theme before presets existed); that and any other
 * unknown value fall back to the default preset, which is the original look.
 */
export function resolveThemeId(value: unknown): ThemeId {
  return THEME_PRESETS.some((preset) => preset.id === value) ? (value as ThemeId) : DEFAULT_THEME_ID;
}

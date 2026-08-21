import type { CompanionLayout, Pin, Settings, StorageData } from './types';

export const GX_DEFAULTS = {
  STRIP_WIDTH: 48,
  PANEL_WIDTH: 400,
  PANEL_MIN_WIDTH: 300,
  PANEL_MAX_WIDTH: 600,
  COMPANION_MIN_WIDTH: 300,
  COMPANION_MAX_WIDTH: 900,
  COMPANION_MIN_HEIGHT: 400,
  COMPANION_MAX_HEIGHT: 1200,
  COMPANION_POSITIONS: ['right', 'left', 'screen-right', 'screen-left'] as const,
  COMPANION_HEIGHT_MODES: ['match', 'fixed'] as const,
  IFRAME_LOAD_TIMEOUT_MS: 5000,

  BLOCKED_DOMAINS: [
    'discord.com',
    'web.whatsapp.com',
    'web.telegram.org',
    'x.com',
    'twitter.com',
    'instagram.com',
    'messenger.com',
    'facebook.com',
    'accounts.google.com',
    'google.com',
    'github.com',
    'linkedin.com',
    'reddit.com'
  ],

  DEFAULT_PINS: [
    {
      id: 'discord',
      name: 'Discord',
      url: 'https://discord.com/app',
      iconUrl: 'icons/apps/discord.svg',
      order: 0
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      url: 'https://web.whatsapp.com',
      iconUrl: 'icons/apps/whatsapp.svg',
      order: 1
    },
    {
      id: 'telegram',
      name: 'Telegram',
      url: 'https://web.telegram.org',
      iconUrl: 'icons/apps/telegram.svg',
      order: 2
    },
    {
      id: 'twitch',
      name: 'Twitch',
      url: 'https://www.twitch.tv',
      iconUrl: 'icons/apps/twitch.svg',
      order: 3
    },
    {
      id: 'spotify',
      name: 'Spotify',
      url: 'https://open.spotify.com',
      iconUrl: 'icons/apps/spotify.svg',
      order: 4
    },
    {
      id: 'x',
      name: 'X',
      url: 'https://x.com',
      iconUrl: 'icons/apps/x.svg',
      order: 5
    },
    {
      id: 'instagram',
      name: 'Instagram',
      url: 'https://www.instagram.com',
      iconUrl: 'icons/apps/instagram.svg',
      order: 6
    },
    {
      id: 'messenger',
      name: 'Messenger',
      url: 'https://www.messenger.com',
      iconUrl: 'icons/apps/messenger.svg',
      order: 7
    },
    {
      id: 'example',
      name: 'Example',
      url: 'https://example.com',
      iconUrl: 'icons/apps/example.svg',
      order: 8
    }
  ] satisfies Pin[],

  DEFAULT_SETTINGS: {
    panelWidth: 400,
    theme: 'dark',
    companionWidth: 400,
    companionHeightMode: 'match',
    companionHeight: 800,
    companionPosition: 'right'
  } satisfies Settings
} as const;

export function gxClamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function gxIsNormalizedCompanionLayout(value: unknown): value is CompanionLayout {
  return (
    typeof value === 'object' &&
    value !== null &&
    Number.isFinite(Number((value as CompanionLayout).width)) &&
    GX_DEFAULTS.COMPANION_HEIGHT_MODES.includes((value as CompanionLayout).heightMode) &&
    GX_DEFAULTS.COMPANION_POSITIONS.includes((value as CompanionLayout).position)
  );
}

export function gxGetCompanionLayoutFromSettings(settings: Partial<Settings & CompanionLayout> = {}): CompanionLayout {
  const defaults = GX_DEFAULTS.DEFAULT_SETTINGS;

  if (gxIsNormalizedCompanionLayout(settings)) {
    return {
      width: gxClamp(
        Math.round(Number(settings.width)),
        GX_DEFAULTS.COMPANION_MIN_WIDTH,
        GX_DEFAULTS.COMPANION_MAX_WIDTH
      ),
      heightMode: settings.heightMode,
      height: gxClamp(
        Math.round(Number(settings.height ?? defaults.companionHeight)),
        GX_DEFAULTS.COMPANION_MIN_HEIGHT,
        GX_DEFAULTS.COMPANION_MAX_HEIGHT
      ),
      position: settings.position
    };
  }

  const heightMode = GX_DEFAULTS.COMPANION_HEIGHT_MODES.includes(
    settings.companionHeightMode as (typeof GX_DEFAULTS.COMPANION_HEIGHT_MODES)[number]
  )
    ? (settings.companionHeightMode as (typeof GX_DEFAULTS.COMPANION_HEIGHT_MODES)[number])
    : defaults.companionHeightMode;
  const position = GX_DEFAULTS.COMPANION_POSITIONS.includes(
    settings.companionPosition as (typeof GX_DEFAULTS.COMPANION_POSITIONS)[number]
  )
    ? (settings.companionPosition as (typeof GX_DEFAULTS.COMPANION_POSITIONS)[number])
    : defaults.companionPosition;

  return {
    width: gxClamp(
      Math.round(Number(settings.companionWidth ?? defaults.companionWidth)),
      GX_DEFAULTS.COMPANION_MIN_WIDTH,
      GX_DEFAULTS.COMPANION_MAX_WIDTH
    ),
    heightMode,
    height: gxClamp(
      Math.round(Number(settings.companionHeight ?? defaults.companionHeight)),
      GX_DEFAULTS.COMPANION_MIN_HEIGHT,
      GX_DEFAULTS.COMPANION_MAX_HEIGHT
    ),
    position
  };
}

export function gxIsDomainBlocked(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    return GX_DEFAULTS.BLOCKED_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith('.' + domain)
    );
  } catch {
    return false;
  }
}

export function gxGetDefaultStorageData(): StorageData {
  return {
    pins: GX_DEFAULTS.DEFAULT_PINS.map((pin) => ({ ...pin })),
    settings: { ...GX_DEFAULTS.DEFAULT_SETTINGS },
    lastActivePinId: GX_DEFAULTS.DEFAULT_PINS[0].id,
    sidebarHidden: false
  };
}

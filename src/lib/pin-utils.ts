/**
 * Pure helpers shared by the content script, options page, and service worker.
 */

const resolvedIconUrlCache = new Map<string, string>();

/** Resolves extension-relative icon paths to full chrome-extension:// URLs. */
export function resolveIconUrl(iconUrl: string): string {
  if (!iconUrl) {
    return '';
  }
  if (iconUrl.startsWith('http')) {
    return iconUrl;
  }
  // Cache successful resolutions: the URL string stays valid across
  // extension reloads (the extension id is stable), so cached entries keep
  // icons working even after the content script's context is invalidated.
  const cached = resolvedIconUrlCache.get(iconUrl);
  if (cached !== undefined) {
    return cached;
  }
  // chrome.runtime.getURL throws once the extension context is invalidated
  // (extension reloaded while the tab stayed open) — a throw here would
  // crash the React render of the whole strip, so fail soft instead.
  try {
    const resolved = chrome.runtime.getURL(iconUrl);
    resolvedIconUrlCache.set(iconUrl, resolved);
    return resolved;
  } catch {
    return '';
  }
}

/** Parses and validates a user-entered pin URL. Returns null when invalid. */
export function parsePinUrl(url: string): URL | null {
  try {
    return new URL(url.trim());
  } catch {
    return null;
  }
}

/** Origin of a URL string, or null when the URL is malformed. */
export function getUrlOrigin(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

/**
 * Order-independent fingerprint of the pinned URL set. Embed-bypass rules
 * only need re-syncing when this changes.
 */
export function computePinUrlSignature(pins: { url: string }[]): string {
  return pins
    .map((pin) => pin.url)
    .sort()
    .join('|');
}

/** Default name, URL, and favicon for pinning the active page. */
export function getCurrentPagePinDefaults(): { name: string; url: string; iconUrl: string } {
  const url = window.location.href;

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace(/^www\./, '');
    const title = document.title.trim();
    const name = (title || hostname).slice(0, 32);
    const iconLink = document.querySelector<HTMLLinkElement>(
      'link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]'
    );

    return {
      name,
      url,
      iconUrl: iconLink?.href || `${parsed.origin}/favicon.ico`
    };
  } catch {
    return {
      name: document.title.trim().slice(0, 32) || 'Website',
      url,
      iconUrl: ''
    };
  }
}

/**
 * Rewrites each pin's `order` to match its array index (after drag-and-drop
 * or deletion). Mutates the given pins in place and returns the same array.
 */
export function reindexPins<T extends { order: number }>(pins: T[]): T[] {
  pins.forEach((pin, index) => {
    pin.order = index;
  });
  return pins;
}

/** Resolves extension-relative icon paths to full chrome-extension:// URLs. */
export function resolveIconUrl(iconUrl: string): string {
  if (!iconUrl) {
    return '';
  }
  if (iconUrl.startsWith('http')) {
    return iconUrl;
  }
  return chrome.runtime.getURL(iconUrl);
}

/** Parses and validates a user-entered pin URL. Returns null when invalid. */
export function parsePinUrl(url: string): URL | null {
  try {
    return new URL(url.trim());
  } catch {
    return null;
  }
}

/** Re-sorts pins by order field after drag-and-drop or deletion. */
export function reindexPins<T extends { order: number }>(pins: T[]): T[] {
  pins.forEach((pin, index) => {
    pin.order = index;
  });
  return pins;
}

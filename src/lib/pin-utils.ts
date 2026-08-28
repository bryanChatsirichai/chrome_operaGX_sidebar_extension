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

/** Re-sorts pins by order field after drag-and-drop or deletion. */
export function reindexPins<T extends { order: number }>(pins: T[]): T[] {
  pins.forEach((pin, index) => {
    pin.order = index;
  });
  return pins;
}

# GX Sidebar — Opera GX-Style Chrome Extension

A Chrome extension that injects an Opera GX-style sidebar into web pages: a vertical icon strip on the left with an expandable panel for pinned web apps.

## Features

- Persistent 48px icon strip on the left edge of every page
- Expandable panel (300–600px, resizable) that loads pinned sites
- 8 default apps: Discord, WhatsApp, Telegram, Twitch, Spotify, X, Instagram, Messenger
- Add custom pins with name, URL, and optional icon
- Drag-to-reorder pins in settings
- Iframe-block detection with "Open in new tab" fallback
- Dark Opera GX-inspired theme
- Settings sync across devices via `chrome.storage.sync`

## Install (Unpacked)

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Build the extension, then select the `dist` folder:
   ```bash
   npm install
   npm run build
   ```
5. Visit any website — the icon strip appears on the left

## Usage

| Action | How |
|--------|-----|
| Open an app | Click its icon in the left strip |
| Close panel | Click the same icon again, or the ✕ button |
| Hide/show sidebar | Click the extension toolbar icon |
| Refresh app | Click the refresh button in the panel header |
| Resize panel | Drag the red handle on the right edge of the panel |
| Settings | Click the gear icon at the bottom of the strip, or right-click the extension → Options |

## Project Structure

```
manifest.json              MV3 config (source; build outputs to dist/)
src/
  background.ts            Service worker (toggle, storage, messaging)
  content/
    sidebar.ts             Shadow DOM sidebar injection
    sidebar.module.scss    Opera GX dark theme (shadow DOM)
    page-shift.module.scss Page margin shift styles
  popup/
    popup.html/ts          Settings page (pins, width)
    popup.module.scss      Options page styles
  lib/
    defaults.ts            Default pins, blocked domains, constants
    storage.ts             chrome.storage.sync helpers
    companion.ts           Companion popup window lifecycle
    types.ts               Shared TypeScript types
icons/                     Extension + app icons
dist/                      Built extension (load this in Chrome)
```

## Development

Requires **Node.js 20+**.

```bash
npm install
npm run dev    # watch build
npm run build  # production build to dist/
npm run typecheck
```

After editing source files, reload the extension at `chrome://extensions` (load unpacked from `dist/`).

## Known Limitations

- **In-page overlay, not browser chrome.** Chrome extensions cannot modify the area left of the address bar the way Opera GX does natively. This extension overlays the page viewport and shifts content with a CSS margin.
- **Many sites block iframes.** Discord, WhatsApp, X, Instagram, and most Google/Facebook properties refuse to load inside iframes. The extension detects this and shows an "Open in new tab" button instead.
- **Shared browser session.** Where iframe embedding works, the panel uses your normal browser cookies/session.
- **Page layout conflicts.** Sites with aggressive full-viewport layouts may not shift cleanly when the panel opens.
- **Chrome only.** Requires Chrome 114+ (Manifest V3). TypeScript + SCSS build via Vite.

### Message Protocol

| Message | Direction | Purpose |
|---------|-----------|---------|
| `toggleSidebar` | background → content | Hide/show icon strip via toolbar click |
| `togglePanel` | background → content | Open/close active panel |
| `pinsUpdated` | popup → background → all tabs | Re-render icon strip |
| `openTab` | content → background | Open blocked site in new tab |
| `getState` | popup → content | Return panel state |
| `getStorageData` | popup → background | Load pins/settings |
| `broadcastPinsUpdated` | popup → background | Sync pins to all tabs |
| `resetStorage` | popup → background | Restore defaults |

## License

MIT

# GX Sidebar — Opera GX-Style Chrome Extension

A Chrome extension that injects an Opera GX-style sidebar into web pages: a vertical icon strip on the left with an expandable panel for pinned web apps.

## Features

- Persistent 48px icon strip on the left edge of every page (hideable via toolbar icon)
- Expandable panel (300–600px, resizable) that loads pinned sites in an iframe when allowed
- **Companion popup window** for sites that block iframe embedding — opens directly beside the browser window (sidebar panel stays closed)
- **Smart embed detection** — preflight check before opening the panel; uses `X-Frame-Options` / CSP headers plus a known-blocked domain list (Twitch, Spotify, YouTube, ChatGPT, Claude, Discord, X, etc.)
- 11 default apps: Discord, WhatsApp, Telegram, Twitch, Spotify, X, Instagram, Messenger, ChatGPT, Claude, and Example (iframe test)
- **Pin current page** from settings — one-click add with title, URL, and favicon
- Add and edit custom pins with name, URL, and optional icon
- Drag-to-reorder pins in settings
- Configurable companion window: width, height (match browser or fixed), and screen position
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

> **Existing installs:** New default pins and embed/companion behavior improvements apply after **Settings → Reset to defaults**, or on first install. Reload the extension after updating.

## Usage

| Action | How |
|--------|-----|
| Open an embeddable app | Click its icon — sidebar panel opens and loads the site |
| Open a blocked app (Twitch, Discord, etc.) | Click its icon — companion popup opens directly; sidebar panel does **not** open |
| Close panel | Click the same icon again, or the ✕ button in the panel header |
| Close companion | Click the same icon again (when only the companion is open) |
| Hide/show sidebar | Click the extension toolbar icon |
| Refresh app | Click the refresh button in the panel header |
| Resize panel | Drag the handle on the right edge of the panel, or use the width slider in settings |
| Settings | Click the gear icon at the bottom of the strip, or right-click the extension → Options |
| Pin current website | Settings → **Pin current page** (or **+ Add website** to pre-fill the form) |

## How blocked sites work

Many sites refuse to load inside iframes. The extension decides **before opening the sidebar panel**:

1. **Preflight** — on pin click, the background worker checks a known-blocked domain list, then fetches the site’s headers (`X-Frame-Options`, CSP `frame-ancestors`).
2. **If embeddable** — the in-page sidebar panel opens and loads the site in an iframe.
3. **If blocked** — the **companion popup** opens directly (a narrow browser window with the full site). The sidebar panel never opens, so you never see Chrome’s “refused to connect” flash inside the panel.

Sites like **Example.com** load normally in the in-page panel. **Twitch, Discord, ChatGPT**, and similar pins skip the panel entirely and go straight to the companion window.

## Project Structure

```
manifest.json              MV3 config (source; build outputs to dist/)
src/
  background.ts            Service worker (toggle, storage, messaging, embed preflight)
  content/
    main.tsx               Bootstrap: shadow DOM mount, React root
    SidebarApp.tsx         Main UI state and iframe/companion logic
    sidebarUtils.ts        Page shift, layout classes, storage load
    keyboardIsolation.ts   Keyboard event isolation for settings forms
    components/
      IconStrip.tsx        Pin buttons + settings gear
      AppPanel.tsx         Iframe panel, loading/fallback views
      SettingsPanel.tsx    Inline settings (pins, pin current page, companion)
    sidebar.module.scss    Opera GX dark theme (shadow DOM)
    page-shift.module.scss Page margin shift styles
  popup/
    popup.html/main.tsx    Options page entry
    PopupApp.tsx           Full-page settings UI
    popup.module.scss      Options page styles
  lib/
    defaults.ts            Default pins, blocked domains, constants
    embed-check.ts         Header-based iframe embed detection
    storage.ts             chrome.storage.sync helpers
    companion.ts           Companion popup window lifecycle
    pin-utils.ts           Icon URLs, URL parsing, current-page pin defaults
    types.ts               Shared TypeScript types
icons/apps/                Default pin SVG icons (incl. chatgpt.svg, claude.svg)
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
- **Many sites block iframes.** Discord, Twitch, Spotify, YouTube, ChatGPT, Claude, WhatsApp, X, Instagram, and most major platforms refuse iframe embedding. The extension detects this via preflight (domain list + response headers) and opens a **companion popup window** directly — without opening the sidebar panel first.
- **Companion is not docked.** Unlike Opera GX’s native sidebar, the companion is a standalone popup window. You can configure its size and position in settings.
- **Shared browser session.** Both the iframe panel and companion window use your normal browser cookies/session.
- **Page layout conflicts.** Sites with aggressive full-viewport layouts may not shift cleanly when the panel opens.
- **Existing user pins.** New default pins only appear after first install or **Reset to defaults** (`chrome.storage.sync` merge behavior).
- **Chrome only.** Requires Chrome 114+ (Manifest V3). Built with TypeScript, React 19, and SCSS via Vite.

### Message Protocol

| Message | Direction | Purpose |
|---------|-----------|---------|
| `checkEmbedAllowed` | content → background | Header preflight on pin click (before panel opens) |
| `setSidebarHidden` | background → content | Hide/show icon strip via toolbar click |
| `pinsUpdated` | background → content | Re-render icon strip after settings change |
| `companionClosed` | background → content | Clear active pin when companion closes |
| `openCompanion` | content → background | Open or navigate companion popup |
| `closeCompanion` | content → background | Close companion when iframe embed succeeds |
| `broadcastPinsUpdated` | popup/settings → background | Sync pins and settings to all tabs |
| `getStorageData` | popup → background | Load pins/settings |
| `resetStorage` | popup/settings → background | Restore defaults |
| `getState` | popup → content | Return panel/sidebar state |
| `openTab` | content → background | Open URL in new tab |

See `docs/IMPLEMENTATION.md` for full architecture, embed detection layers, and debugging notes.

## License

MIT

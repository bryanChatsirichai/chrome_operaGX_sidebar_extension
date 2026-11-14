# browser-sidebar

[![Release](https://img.shields.io/github/v/release/bryanChatsirichai/chrome_operaGX_sidebar_extension?label=download)](https://github.com/bryanChatsirichai/chrome_operaGX_sidebar_extension/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](#license)

A Chrome extension that adds an Opera GX–style sidebar to any website: a slim icon strip on the left edge of the page, with a panel that opens your pinned web apps (Messenger, Discord, ChatGPT, or any site you choose) beside what you're browsing.

## Features

- **Sidebar on every page.** Hide or show it on all tabs from the toolbar icon.
- **Sites that usually block embedding still load.** X, Instagram, Messenger, ChatGPT, Claude and others open in the panel, signed in with your normal browser session.
- **Instant switching.** Up to four recently used apps stay loaded in the background, and hovering an icon preloads it.
- **Audio indicator.** A pin playing audio in the background gets a badge on its icon.
- **Resizable panel.** Drag its edge or use the slider in settings; the width syncs across tabs.
- **Plays nicely with pages.** Page content and sticky bars move clear of the strip, scrolling inside an app never scrolls the page underneath, and the sidebar keeps its size when you zoom the page.
- **Pin any page in one click.** Edit, reorder and delete pins from settings.
- **Six colour themes**: Crimson (default), Ultraviolet, Rose Quartz, Ocean, Toxic, and Light.
- **Synced.** Pins and preferences follow your Chrome profile across devices.

## Install

1. Download the latest **browser-sidebar-vX.Y.Z.zip** from [Releases](https://github.com/bryanChatsirichai/chrome_operaGX_sidebar_extension/releases/latest) and extract it. Chrome can't load the ZIP directly.
2. Go to `chrome://extensions` and turn on **Developer mode** (top-right).
3. Click **Load unpacked** and select the extracted folder, the one that directly contains `manifest.json`.
4. Visit any website. The icon strip appears on the left.

**To update:** extract the new ZIP over the old folder (or to a new folder), click **Reload** on the extension card (or remove it and load the new folder), then refresh open tabs. Until refreshed, they show "Extension reloaded — refresh this page". Your pins and settings are kept.

To build from source instead, see [Development](#development).

## Usage

| To… | Do this |
|-----|---------|
| Open a pinned app | Click its icon in the strip |
| Close the panel | Click the same icon again, the ✕, anywhere on the page, or switch tabs |
| Refresh an app | Click the refresh button in the panel header |
| Resize the panel | Drag its right edge, or use the width slider in settings |
| Hide / show the sidebar | Click the extension's toolbar icon |
| Open settings | Click the gear at the bottom of the strip |
| Change the theme | Settings → **Appearance** |
| Pin the current website | Settings → **Pin current page** (or **+ Add website** to edit first) |
| Edit, reorder, or delete pins | Settings: drag to reorder, or use ✎ / ✕ |
| Restore the default pins | Settings → **Reset to defaults** (replaces your pins) |

Pins and panel width can also be managed on the full-page options page: right-click the toolbar icon → **Options**. The theme picker is only in the in-page settings.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "This page can't be shown in the panel" | The site refuses to be embedded. This is expected for most sign-in pages. Use **Open in new tab**, or try **Repair & retry**. |
| A pinned site shows "refused to connect" | Click **Repair & retry**. It clears the cached site data that blocks the panel. It clears service workers and cache for *all* sites, not just this one. |
| The panel keeps asking me to sign in | Make sure third-party cookies aren't blocked in Chrome's settings. |
| No sidebar on a page | Chrome doesn't allow extensions on `chrome://` pages or the Chrome Web Store. Popup windows (e.g. "Sign in with Google" dialogs) also get no sidebar, by design. |
| "Extension reloaded — refresh this page" | Refresh the tab. This happens after the extension is updated or reloaded. |
| New default pins don't appear after updating | Defaults apply only to new installs. Use **Settings → Reset to defaults** (this replaces your pins). |
| "Manifest file is missing or unreadable" on install | You selected the wrong folder. Pick the folder that directly contains `manifest.json`. |

## How it works

Browsers with built-in sidebars show apps in a real browser tab. Extensions can't do that, so browser-sidebar shows each app in an embedded frame. Many sites deliberately block that, and the extension removes those blocks only for the sites you've pinned. Sites it can't handle (mostly Google or Microsoft sign-in pages) show an **Open in new tab** button instead.

### Limitations

- **It's an overlay, not part of Chrome.** The panel floats over the page instead of shrinking it.
- **Some pages can't be embedded**, mostly sign-in pages. They offer **Open in new tab**.
- **Chrome only, installed in Developer mode.** The extension isn't on the Chrome Web Store.
- **Unusual page layouts** may not shift perfectly around the strip.

The technical design and the full list of limits are in [docs/IMPLEMENTATION.md](docs/IMPLEMENTATION.md).

## Development

Requires **Node.js 20+**.

```bash
npm install
npm run dev        # rebuild dist/ on change
npm run build      # production build to dist/
npm run typecheck  # tsc --noEmit
```

Load `dist/` with **Load unpacked** at `chrome://extensions`, and click **Reload** on the extension card after each rebuild. There is no automated test suite in `npm` scripts; see [IMPLEMENTATION.md: Debugging and testing](docs/IMPLEMENTATION.md#12-debugging-and-testing).

| Doc | Read it when you… |
|-----|-------------------|
| [docs/IMPLEMENTATION.md](docs/IMPLEMENTATION.md) | Change the code: architecture, embed pipeline, message protocol, debugging |
| [docs/RELEASE.md](docs/RELEASE.md) | Publish a release (version bump, tag, CI build) |
| [docs/GITHUB-RULES.md](docs/GITHUB-RULES.md) | Configure who can push, merge, and tag on GitHub |

## License

MIT

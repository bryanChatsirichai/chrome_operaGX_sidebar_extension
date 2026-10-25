# browser-sidebar

[![Release](https://img.shields.io/github/v/release/bryanChatsirichai/chrome_operaGX_sidebar_extension?label=download)](https://github.com/bryanChatsirichai/chrome_operaGX_sidebar_extension/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](#license)

A Chrome extension that adds an Opera GX–style sidebar to any website: a slim icon strip on the left edge of the page, with a panel that opens your pinned web apps — Messenger, Discord, ChatGPT, or any site you choose — right beside what you're browsing.

## Features

- **Sidebar on every page.** Hide or show it any time from the toolbar icon.
- **Sites that usually block embedding still load.** X, Instagram, Messenger, ChatGPT, Claude and others open directly in the panel, signed in with your normal browser session.
- **Instant switching.** Recently used apps stay loaded in the background, and hovering an icon preloads it.
- **Resizable panel.** Drag its edge or use the slider in settings; the width syncs across tabs.
- **Plays nicely with pages.** Page content and sticky bars move clear of the strip, and scrolling inside an app never scrolls the page underneath.
- **Pin any page in one click.** Edit, reorder and delete pins from settings.
- **Synced.** Pins and preferences follow your Chrome profile across devices.
- Dark theme, with 7 default apps included.

## Install

1. Download the latest **browser-sidebar-vX.Y.Z.zip** from [Releases](https://github.com/bryanChatsirichai/chrome_operaGX_sidebar_extension/releases/latest) and extract it.
2. Go to `chrome://extensions` and turn on **Developer mode**.
3. Click **Load unpacked** and select the extracted folder (the one containing `manifest.json`).
4. Visit any website. The icon strip appears on the left.

For updating to a new version and fixing install problems, see [docs/INSTALL.md](docs/INSTALL.md). To build from source instead, see [Development](#development).

## Usage

| To… | Do this |
|-----|---------|
| Open a pinned app | Click its icon in the strip |
| Close the panel | Click the same icon again, the ✕, or anywhere on the page |
| Refresh an app | Click the refresh button in the panel header |
| Resize the panel | Drag its right edge, or use the width slider in settings |
| Hide / show the sidebar | Click the extension's toolbar icon |
| Open settings | Click the gear at the bottom of the strip |
| Pin the current website | Settings → **Pin current page** (or **+ Add website** to edit first) |
| Edit, reorder, or delete pins | Settings: drag to reorder, or use ✎ / ✕ |
| Restore the default pins | Settings → **Reset to defaults** |

Settings are also available on a full-page options page: right-click the toolbar icon → **Options**.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "This site could not load in the panel" | The site refuses to be embedded. Use **Open in new tab**, or try **Repair & retry**. |
| A pinned site shows "refused to connect" | Click **Repair & retry**. It clears the cached site data that blocks the panel. Note: this clears cached data for *all* sites, not just this one. |
| The panel keeps asking me to sign in | Make sure third-party cookies aren't blocked in Chrome's settings. |
| No sidebar on a page | Chrome doesn't allow extensions on `chrome://` pages or the Chrome Web Store. |
| "Extension reloaded — refresh this page" | Refresh the tab. This happens after the extension is updated or reloaded. |
| New default pins don't appear after updating | Defaults apply only to new installs. Use **Settings → Reset to defaults** (this replaces your pins). |

## How it works

Browsers with built-in sidebars show apps in a real browser tab. Extensions can't do that, so browser-sidebar shows each app in an embedded frame. Many sites deliberately block that, and the extension undoes those blocks only for the sites you've pinned. The few sites it can't handle (mostly Google or Microsoft sign-in pages) show an **Open in new tab** button instead.

The full technical design is in [docs/IMPLEMENTATION.md](docs/IMPLEMENTATION.md).

## Limitations

- **It's an overlay, not part of Chrome itself.** The panel floats over the page instead of shrinking it.
- **A few sites can't be embedded**, mostly sign-in pages. They offer **Open in new tab**.
- **Chrome only.** The extension isn't published on the Chrome Web Store, so you install it with Developer mode.
- **Unusual page layouts** may not shift perfectly around the strip.

The full list of technical limits is in [docs/IMPLEMENTATION.md § Limitations](docs/IMPLEMENTATION.md#11-limitations).

## Development

Requires **Node.js 20+**.

```bash
npm install
npm run dev        # rebuild on change
npm run build      # production build to dist/
npm run typecheck
```

Load `dist/` with **Load unpacked** at `chrome://extensions`, and click **Reload** on the extension card after each rebuild.

| Doc | Contents |
|-----|----------|
| [docs/IMPLEMENTATION.md](docs/IMPLEMENTATION.md) | Architecture, source layout, embed pipeline, message protocol, debugging and testing |
| [docs/RELEASE.md](docs/RELEASE.md) | Publishing a release (version bump, tag, CI build) |
| [docs/GITHUB-RULES.md](docs/GITHUB-RULES.md) | Repository access rules for `main` and release tags |
| [docs/INSTALL.md](docs/INSTALL.md) | End-user install and update steps |

## License

MIT

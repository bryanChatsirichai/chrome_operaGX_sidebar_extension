import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SidebarApp } from './SidebarApp';
import {
  attachHostKeyboardBubbleStop,
  registerDocumentKeyboardIsolation
} from './keyboardIsolation';
import { browserSidebarSafeSendMessage } from './runtimeGuard';
import {
  injectPageShiftStyles,
  loadSidebarStorage
} from './sidebarUtils';
import sidebarStyles from './sidebar.module.scss?inline';

/**
 * Content-script entry (top frame only, document_start). Mounts the sidebar
 * React app inside a closed shadow root so page CSS and scripts cannot reach
 * it; the page-shift stylesheet is the only thing injected into the page.
 */

let hostEl: HTMLDivElement | null = null;

registerDocumentKeyboardIsolation(() => hostEl);

void (async function initBrowserSidebar(): Promise<void> {
  // Skip iframes and re-injection (the toolbar handler may executeScript again).
  if (window.top !== window.self || document.getElementById('browser-sidebar-host')) {
    return;
  }

  // Popup windows (sign-in dialogs etc.) get no sidebar. No answer (dead
  // context / worker error) falls back to mounting, the previous behavior.
  const [mountCheck, storage] = await Promise.all([
    browserSidebarSafeSendMessage<{ ok: boolean }>({ action: 'shouldMountSidebar' }),
    loadSidebarStorage()
  ]);
  if (mountCheck?.ok === false || document.getElementById('browser-sidebar-host')) {
    return;
  }

  injectPageShiftStyles();

  hostEl = document.createElement('div');
  hostEl.id = 'browser-sidebar-host';
  document.documentElement.appendChild(hostEl);
  attachHostKeyboardBubbleStop(hostEl);

  const shadowRoot = hostEl.attachShadow({ mode: 'closed' });

  const style = document.createElement('style');
  style.textContent = sidebarStyles;
  shadowRoot.appendChild(style);

  const mount = document.createElement('div');
  shadowRoot.appendChild(mount);

  createRoot(mount).render(
    <StrictMode>
      <SidebarApp
        initialPins={storage.pins}
        initialSettings={storage.settings}
        initialSidebarHidden={storage.sidebarHidden}
        initialPanelWidth={storage.panelWidth}
      />
    </StrictMode>
  );
})();

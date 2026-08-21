import { GX_DEFAULTS, gxGetDefaultStorageData, gxIsDomainBlocked } from '../lib/defaults';
import type { CompanionOpenResult, Pin, Settings } from '../lib/types';
import sidebarStyles from './sidebar.module.scss?inline';
import pageShiftStyles from './page-shift.module.scss?inline';

interface SidebarState {
  pins: Pin[];
  settings: Settings;
  activePinId: string | null;
  panelOpen: boolean;
  settingsOpen: boolean;
  sidebarHidden: boolean;
  iframeLoadTimer: ReturnType<typeof setTimeout> | null;
  panelWidth: number;
}

(function initGxSidebar(): void {
  if (window.top !== window.self || document.getElementById('gx-sidebar-host')) {
    return;
  }

  const state: SidebarState = {
    pins: [],
    settings: { ...GX_DEFAULTS.DEFAULT_SETTINGS },
    activePinId: null,
    panelOpen: false,
    settingsOpen: false,
    sidebarHidden: false,
    iframeLoadTimer: null,
    panelWidth: GX_DEFAULTS.DEFAULT_SETTINGS.panelWidth
  };

  let shadowRoot: ShadowRoot | null = null;
  let hostEl: HTMLDivElement | null = null;
  let stripEl!: HTMLElement;
  let panelEl!: HTMLElement;
  let iframeEl!: HTMLIFrameElement;
  let fallbackEl!: HTMLElement;
  let loadingEl!: HTMLElement;
  let panelTitleEl!: HTMLElement;
  let settingsPanelEl!: HTMLElement;
  let settingsFormEl!: HTMLFormElement;
  let settingsPinsListEl!: HTMLUListElement;
  let settingsWidthInputEl!: HTMLInputElement;
  let settingsWidthValueEl!: HTMLElement;
  let settingsCompanionWidthInputEl!: HTMLInputElement;
  let settingsCompanionWidthValueEl!: HTMLElement;
  let settingsCompanionHeightModeEl!: HTMLSelectElement;
  let settingsCompanionHeightRowEl!: HTMLElement;
  let settingsCompanionHeightInputEl!: HTMLInputElement;
  let settingsCompanionHeightValueEl!: HTMLElement;
  let settingsCompanionPositionEl!: HTMLSelectElement;
  let settingsButtonEl: HTMLButtonElement | null = null;
  let settingsDraggedIndex: number | null = null;
  let iframeVerifyTimer: ReturnType<typeof setTimeout> | null = null;
  let iframeVerifyGeneration = 0;
  let embedFailureHandled = false;
  let embedFailureInFlight: Promise<CompanionOpenResult | undefined> | null = null;

  const EMBED_BLOCKED_PATTERN =
    /refused to connect|content is blocked|contact the site owner|can't be embedded|cannot be displayed|x-frame-options|frame-ancestors|failed to load|err_blocked_by/i;

  bootstrap();

  function injectPageShiftStyles() {
    if (document.getElementById('gx-page-shift-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'gx-page-shift-styles';
    style.textContent = pageShiftStyles;
    document.documentElement.appendChild(style);
  }

  async function bootstrap() {
    injectPageShiftStyles();
    if (await isCompanionContext()) {
      return;
    }

    await loadStorageData();
    createSidebar();
    applySidebarVisibility();
    registerMessageListener();
  }

  async function isCompanionContext() {
    for (let attempt = 0; attempt < 6; attempt += 1) {
      try {
        const context = await chrome.runtime.sendMessage({ action: 'getSidebarContext' });
        if (context?.isCompanionWindow) {
          return true;
        }
      } catch {
        return false;
      }

      if (attempt < 5) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }

    return false;
  }

  async function loadStorageData() {
    try {
      const stored = await chrome.storage.sync.get(['pins', 'settings', 'lastActivePinId', 'sidebarHidden']);
      const defaults = gxGetDefaultStorageData();
      state.pins = (stored.pins ?? defaults.pins).slice().sort((a: Pin, b: Pin) => a.order - b.order);
      state.settings = { ...defaults.settings, ...(stored.settings ?? {}) };
      state.panelWidth = state.settings.panelWidth ?? GX_DEFAULTS.DEFAULT_SETTINGS.panelWidth;
      state.activePinId = stored.lastActivePinId ?? null;
      state.sidebarHidden = Boolean(stored.sidebarHidden);
    } catch {
      const defaults = gxGetDefaultStorageData();
      state.pins = defaults.pins;
      state.settings = defaults.settings;
    }
  }

  function createSidebar() {
    hostEl = document.createElement('div');
    hostEl.id = 'gx-sidebar-host';
    document.documentElement.appendChild(hostEl);

    shadowRoot = hostEl.attachShadow({ mode: 'closed' });

    const style = document.createElement('style');
    style.textContent = sidebarStyles;

    const root = document.createElement('div');
    root.className = 'sidebar-root';
    root.innerHTML = buildSidebarHtml();

    shadowRoot.appendChild(style);
    shadowRoot.appendChild(root);

    cacheElements(root);
    renderPinButtons();
    bindSidebarEvents();
    setCssVariables();
  }

  function buildSidebarHtml() {
    return `
      <aside class="icon-strip" part="icon-strip"></aside>
      <section class="app-panel" part="app-panel">
        <header class="panel-header">
          <span class="panel-title"></span>
          <div class="panel-actions">
            <button class="panel-action-btn refresh-btn" type="button" title="Refresh">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            </button>
            <button class="panel-action-btn close-btn" type="button" title="Close panel">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </header>
        <div class="panel-body">
          <div class="loading-view"><span class="loading-spinner"></span>Loading...</div>
          <iframe class="panel-iframe hidden" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"></iframe>
          <div class="fallback-view">
            <div class="fallback-icon"></div>
            <h3 class="fallback-title"></h3>
            <p class="fallback-message">This site could not load in the panel. Use the companion window instead.</p>
            <button class="open-tab-btn" type="button">Open companion panel</button>
          </div>
          <div class="resize-handle" title="Drag to resize"></div>
        </div>
      </section>
      <section class="settings-panel" part="settings-panel">
        <header class="panel-header">
          <span class="panel-title">Settings</span>
          <div class="panel-actions">
            <button class="panel-action-btn settings-close-btn" type="button" title="Close settings">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </header>
        <div class="settings-body">
          <div class="settings-section">
            <h3 class="settings-heading">Add website</h3>
            <form class="settings-add-form">
              <input class="settings-input" type="text" name="pinName" placeholder="Website name" maxlength="32" required>
              <input class="settings-input" type="url" name="pinUrl" placeholder="https://example.com" required>
              <input class="settings-input" type="url" name="pinIconUrl" placeholder="Icon URL (optional)">
              <p class="settings-hint">Paste a direct link to a PNG, SVG, or JPG icon.</p>
              <button class="settings-btn settings-btn-primary" type="submit">Add to sidebar</button>
            </form>
          </div>
          <div class="settings-section">
            <div class="settings-section-header">
              <h3 class="settings-heading">Pinned websites</h3>
              <span class="settings-hint">Drag to reorder</span>
            </div>
            <ul class="settings-pins-list"></ul>
          </div>
          <div class="settings-section">
            <h3 class="settings-heading">Panel width</h3>
            <div class="settings-width-control">
              <input class="settings-width-range" type="range" min="300" max="600" step="10">
              <span class="settings-width-value">400px</span>
            </div>
          </div>
          <div class="settings-section">
            <h3 class="settings-heading">Companion window</h3>
            <p class="settings-hint">Popup used when a site cannot load in the panel.</p>
            <label class="settings-label">Width</label>
            <div class="settings-width-control">
              <input class="settings-companion-width-range" type="range" min="300" max="900" step="10">
              <span class="settings-companion-width-value">400px</span>
            </div>
            <label class="settings-label">Height</label>
            <select class="settings-select settings-companion-height-mode">
              <option value="match">Match browser window</option>
              <option value="fixed">Fixed height</option>
            </select>
            <div class="settings-companion-height-row">
              <div class="settings-width-control">
                <input class="settings-companion-height-range" type="range" min="400" max="1200" step="10">
                <span class="settings-companion-height-value">800px</span>
              </div>
            </div>
            <label class="settings-label">Initial position</label>
            <select class="settings-select settings-companion-position">
              <option value="right">Right of browser window</option>
              <option value="left">Left of browser window</option>
              <option value="screen-right">Right edge of screen</option>
              <option value="screen-left">Left edge of screen</option>
            </select>
          </div>
          <button class="settings-btn settings-btn-secondary settings-reset-btn" type="button">Reset to defaults</button>
        </div>
      </section>
    `;
  }

  function cacheElements(root: ParentNode) {
    stripEl = root.querySelector('.icon-strip')!;
    panelEl = root.querySelector('.app-panel')!;
    iframeEl = root.querySelector('.panel-iframe')!;
    fallbackEl = root.querySelector('.fallback-view')!;
    loadingEl = root.querySelector('.loading-view')!;
    panelTitleEl = root.querySelector('.panel-title')!;
    settingsPanelEl = root.querySelector('.settings-panel')!;
    settingsFormEl = root.querySelector('.settings-add-form')!;
    settingsPinsListEl = root.querySelector('.settings-pins-list')!;
    settingsWidthInputEl = root.querySelector('.settings-width-range')!;
    settingsWidthValueEl = root.querySelector('.settings-width-value')!;
    settingsCompanionWidthInputEl = root.querySelector('.settings-companion-width-range')!;
    settingsCompanionWidthValueEl = root.querySelector('.settings-companion-width-value')!;
    settingsCompanionHeightModeEl = root.querySelector('.settings-companion-height-mode')!;
    settingsCompanionHeightRowEl = root.querySelector('.settings-companion-height-row')!;
    settingsCompanionHeightInputEl = root.querySelector('.settings-companion-height-range')!;
    settingsCompanionHeightValueEl = root.querySelector('.settings-companion-height-value')!;
    settingsCompanionPositionEl = root.querySelector('.settings-companion-position')!;
  }

  function setCssVariables() {
    document.documentElement.style.setProperty('--gx-strip-width', `${GX_DEFAULTS.STRIP_WIDTH}px`);
    document.documentElement.style.setProperty('--gx-panel-width', `${state.panelWidth}px`);
    if (shadowRoot) {
      const root = shadowRoot.querySelector('.sidebar-root') as HTMLElement | null;
      if (root) {
        root.style.setProperty('--gx-strip-width', `${GX_DEFAULTS.STRIP_WIDTH}px`);
        root.style.setProperty('--gx-panel-width', `${state.panelWidth}px`);
      }
    }
  }

  function renderPinButtons() {
    stripEl.innerHTML = '';

    state.pins.forEach((pin) => {
      const btn = document.createElement('button');
      btn.className = 'pin-button' + (state.activePinId === pin.id ? ' active' : '');
      btn.type = 'button';
      btn.title = pin.name;
      btn.dataset.pinId = pin.id;

      if (pin.iconUrl) {
        const img = document.createElement('img');
        img.src = pin.iconUrl.startsWith('http') ? pin.iconUrl : chrome.runtime.getURL(pin.iconUrl);
        img.alt = pin.name;
        btn.appendChild(img);
      } else {
        const fallback = document.createElement('span');
        fallback.className = 'pin-fallback';
        fallback.textContent = pin.name.charAt(0).toUpperCase();
        btn.appendChild(fallback);
      }

      btn.addEventListener('click', () => handlePinClick(pin));
      stripEl.appendChild(btn);
    });

    const spacer = document.createElement('div');
    spacer.className = 'strip-spacer';
    stripEl.appendChild(spacer);

    const footer = document.createElement('div');
    footer.className = 'strip-footer';

    const settingsBtn = document.createElement('button');
    settingsBtn.className = 'settings-button' + (state.settingsOpen ? ' active' : '');
    settingsBtn.type = 'button';
    settingsBtn.title = 'Settings';
    settingsBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>';
    settingsBtn.addEventListener('click', toggleSettings);
    settingsButtonEl = settingsBtn;
    footer.appendChild(settingsBtn);

    stripEl.appendChild(footer);
  }

  function bindSidebarEvents() {
    const root = shadowRoot!.querySelector('.sidebar-root')!;

    root.querySelector('.close-btn')!.addEventListener('click', closePanel);
    root.querySelector('.refresh-btn')!.addEventListener('click', refreshActivePin);
    root.querySelector('.open-tab-btn')!.addEventListener('click', openActivePinInCompanion);
    root.querySelector('.settings-close-btn')!.addEventListener('click', closeSettings);

    settingsFormEl.addEventListener('submit', async (event) => {
      event.preventDefault();
      await addPinFromSettings(new FormData(settingsFormEl));
    });

    settingsWidthInputEl.addEventListener('input', () => {
      state.panelWidth = Number(settingsWidthInputEl.value);
      state.settings.panelWidth = state.panelWidth;
      settingsWidthValueEl.textContent = `${state.panelWidth}px`;
      setCssVariables();
    });

    settingsWidthInputEl.addEventListener('change', () => {
      saveAndBroadcast();
    });

    settingsCompanionWidthInputEl.addEventListener('input', () => {
      state.settings.companionWidth = Number(settingsCompanionWidthInputEl.value);
      settingsCompanionWidthValueEl.textContent = `${state.settings.companionWidth}px`;
    });

    settingsCompanionWidthInputEl.addEventListener('change', () => {
      saveAndBroadcast();
    });

    settingsCompanionHeightModeEl.addEventListener('change', () => {
      state.settings.companionHeightMode =
        settingsCompanionHeightModeEl.value as Settings['companionHeightMode'];
      updateCompanionHeightControlVisibility();
      saveAndBroadcast();
    });

    settingsCompanionHeightInputEl.addEventListener('input', () => {
      state.settings.companionHeight = Number(settingsCompanionHeightInputEl.value);
      settingsCompanionHeightValueEl.textContent = `${state.settings.companionHeight}px`;
    });

    settingsCompanionHeightInputEl.addEventListener('change', () => {
      saveAndBroadcast();
    });

    settingsCompanionPositionEl.addEventListener('change', () => {
      state.settings.companionPosition =
        settingsCompanionPositionEl.value as Settings['companionPosition'];
      saveAndBroadcast();
    });

    root.querySelector('.settings-reset-btn')!.addEventListener('click', resetToDefaults);

    iframeEl.addEventListener('load', handleIframeLoad);
    iframeEl.addEventListener('error', () => {
      const pin = getActivePin();
      if (pin && state.panelOpen && !embedFailureHandled && !embedFailureInFlight) {
        handleEmbedFailure(pin);
      }
    });

    const resizeHandle = root.querySelector('.resize-handle')!;
    let dragging = false;
    let startX = 0;
    let startWidth = 0;

    resizeHandle.addEventListener('mousedown', (event) => {
      const mouseEvent = event as MouseEvent;
      dragging = true;
      startX = mouseEvent.clientX;
      startWidth = state.panelWidth;
      resizeHandle.classList.add('dragging');
      document.addEventListener('mousemove', onResizeMove);
      document.addEventListener('mouseup', onResizeEnd);
      event.preventDefault();
    });

    function onResizeMove(event: Event) {
      if (!dragging) return;
      const mouseEvent = event as MouseEvent;
      const delta = mouseEvent.clientX - startX;
      state.panelWidth = clamp(
        startWidth + delta,
        GX_DEFAULTS.PANEL_MIN_WIDTH,
        GX_DEFAULTS.PANEL_MAX_WIDTH
      );
      setCssVariables();
      applyLayoutClasses();
    }

    function onResizeEnd() {
      dragging = false;
      resizeHandle.classList.remove('dragging');
      document.removeEventListener('mousemove', onResizeMove);
      document.removeEventListener('mouseup', onResizeEnd);
      chrome.storage.sync.set({ settings: { ...state.settings, panelWidth: state.panelWidth } });
    }
  }

  function handlePinClick(pin: Pin) {
    if (state.settingsOpen) {
      closeSettings();
    }

    if (state.activePinId === pin.id && state.panelOpen) {
      closePanel();
      return;
    }

    state.activePinId = pin.id;
    state.panelOpen = true;
    renderPinButtons();
    openPanelForPin(pin);
    chrome.runtime.sendMessage({ action: 'saveLastActivePin', pinId: pin.id });
  }

  function openPanelForPin(pin: Pin) {
    embedFailureHandled = false;
    embedFailureInFlight = null;
    iframeVerifyGeneration += 1;
    panelEl.classList.add('open');
    panelTitleEl.textContent = pin.name;
    applyLayoutClasses();

    clearIframeTimer();
    clearIframeVerifyTimer();
    hideAllPanelViews();
    loadingEl.classList.add('visible');

    iframeEl.classList.remove('hidden');
    iframeEl.src = pin.url;

    state.iframeLoadTimer = setTimeout(() => {
      if (
        !embedFailureHandled &&
        !embedFailureInFlight &&
        state.panelOpen &&
        getActivePin()?.id === pin.id
      ) {
        handleEmbedFailure(pin);
      }
    }, GX_DEFAULTS.IFRAME_LOAD_TIMEOUT_MS);
  }

  function getIframeLocationHref() {
    try {
      return iframeEl.contentWindow?.location?.href ?? '';
    } catch {
      return null;
    }
  }

  function getIframeDocumentText() {
    try {
      const doc = iframeEl.contentDocument;
      if (!doc) {
        return '';
      }

      return [doc.title, doc.body?.innerText, doc.body?.textContent, doc.documentElement?.textContent]
        .filter(Boolean)
        .join('\n');
    } catch {
      return '';
    }
  }

  function isIframeEmbedBlocked() {
    const href = getIframeLocationHref();

    if (typeof href === 'string' && href.startsWith('chrome-error:')) {
      return true;
    }

    return EMBED_BLOCKED_PATTERN.test(getIframeDocumentText());
  }

  function showIframeLoaded() {
    clearIframeTimer();
    clearIframeVerifyTimer();
    hideAllPanelViews();
    iframeEl.classList.remove('hidden');
    chrome.runtime.sendMessage({ action: 'closeCompanion' }).catch(() => {});
  }

  function startIframeVerification(pin: Pin) {
    iframeVerifyGeneration += 1;
    const generation = iframeVerifyGeneration;
    clearIframeVerifyTimer();
    verifyIframeEmbed(pin, 0, generation);
  }

  function verifyIframeEmbed(pin: Pin, attempt = 0, generation = iframeVerifyGeneration) {
    if (generation !== iframeVerifyGeneration) {
      return;
    }

    if (!state.panelOpen || getActivePin()?.id !== pin.id || embedFailureHandled || embedFailureInFlight) {
      return;
    }

    if (isIframeEmbedBlocked()) {
      handleEmbedFailure(pin);
      return;
    }

    const href = getIframeLocationHref();

    if (href === 'about:blank' || href === '') {
      if (attempt < 30) {
        iframeVerifyTimer = setTimeout(() => verifyIframeEmbed(pin, attempt + 1, generation), 100);
      }
      return;
    }

    if (href === null) {
      if (attempt < 10) {
        iframeVerifyTimer = setTimeout(() => verifyIframeEmbed(pin, attempt + 1, generation), 150);
        return;
      }

      if (gxIsDomainBlocked(pin.url)) {
        handleEmbedFailure(pin);
        return;
      }

      showIframeLoaded();
      return;
    }

    if (isIframeEmbedBlocked()) {
      handleEmbedFailure(pin);
      return;
    }

    if (gxIsDomainBlocked(pin.url)) {
      handleEmbedFailure(pin);
      return;
    }

    showIframeLoaded();
  }

  function handleIframeLoad() {
    const activePin = getActivePin();
    if (!activePin || !state.panelOpen || embedFailureHandled || embedFailureInFlight) {
      return;
    }

    startIframeVerification(activePin);
  }

  function handleEmbedFailure(pin: Pin) {
    if (embedFailureHandled || embedFailureInFlight) {
      return embedFailureInFlight;
    }

    embedFailureHandled = true;
    iframeVerifyGeneration += 1;
    clearIframeTimer();
    clearIframeVerifyTimer();
    iframeEl.src = 'about:blank';
    iframeEl.classList.add('hidden');
    hideAllPanelViews();
    loadingEl.classList.add('visible');

    embedFailureInFlight = (async () => {
      const response = await openCompanionForPin(pin, { closePanelOnOpen: true });

      if (response?.ok && response.open) {
        return response;
      }

      showFallbackUI(pin);
      return response;
    })().finally(() => {
      embedFailureInFlight = null;
    });

    return embedFailureInFlight;
  }

  function showFallbackUI(pin: Pin) {
    clearIframeTimer();
    hideAllPanelViews();
    iframeEl.src = 'about:blank';
    iframeEl.classList.add('hidden');

    fallbackEl.classList.add('visible');
    fallbackEl.querySelector('.fallback-title')!.textContent = pin.name;

    const iconContainer = fallbackEl.querySelector('.fallback-icon')!;
    iconContainer.innerHTML = '';
    if (pin.iconUrl) {
      const img = document.createElement('img');
      img.src = pin.iconUrl.startsWith('http') ? pin.iconUrl : chrome.runtime.getURL(pin.iconUrl);
      img.alt = pin.name;
      iconContainer.appendChild(img);
    } else {
      iconContainer.textContent = pin.name.charAt(0);
    }
  }

  function hideAllPanelViews() {
    loadingEl.classList.remove('visible');
    iframeEl.classList.add('hidden');
    fallbackEl.classList.remove('visible');
  }

  function clearIframeTimer() {
    if (state.iframeLoadTimer) {
      clearTimeout(state.iframeLoadTimer);
      state.iframeLoadTimer = null;
    }
  }

  function clearIframeVerifyTimer() {
    if (iframeVerifyTimer) {
      clearTimeout(iframeVerifyTimer);
      iframeVerifyTimer = null;
    }
  }

  function toggleSettings() {
    if (state.settingsOpen) {
      closeSettings();
      return;
    }

    openSettings();
  }

  function openSettings() {
    closePanel();
    state.settingsOpen = true;
    settingsPanelEl.classList.add('open');
    if (settingsButtonEl) {
      settingsButtonEl.classList.add('active');
    }
    updateSettingsControls();
    renderSettingsPinsList();
    applyLayoutClasses();
  }

  function closeSettings() {
    state.settingsOpen = false;
    settingsPanelEl.classList.remove('open');
    if (settingsButtonEl) {
      settingsButtonEl.classList.remove('active');
    }
    applyLayoutClasses();
  }

  function updateSettingsControls() {
    settingsWidthInputEl.value = String(state.panelWidth);
    settingsWidthValueEl.textContent = `${state.panelWidth}px`;

    const companionWidth = state.settings.companionWidth ?? GX_DEFAULTS.DEFAULT_SETTINGS.companionWidth;
    const companionHeight = state.settings.companionHeight ?? GX_DEFAULTS.DEFAULT_SETTINGS.companionHeight;
    const companionHeightMode =
      state.settings.companionHeightMode ?? GX_DEFAULTS.DEFAULT_SETTINGS.companionHeightMode;
    const companionPosition =
      state.settings.companionPosition ?? GX_DEFAULTS.DEFAULT_SETTINGS.companionPosition;

    settingsCompanionWidthInputEl.value = String(companionWidth);
    settingsCompanionWidthValueEl.textContent = `${companionWidth}px`;
    settingsCompanionHeightModeEl.value = companionHeightMode;
    settingsCompanionHeightInputEl.value = String(companionHeight);
    settingsCompanionHeightValueEl.textContent = `${companionHeight}px`;
    settingsCompanionPositionEl.value = companionPosition;
    updateCompanionHeightControlVisibility();
  }

  function updateCompanionHeightControlVisibility() {
    const showFixedHeight = settingsCompanionHeightModeEl.value === 'fixed';
    settingsCompanionHeightRowEl.classList.toggle('hidden', !showFixedHeight);
  }

  function renderSettingsPinsList() {
    settingsPinsListEl.innerHTML = '';
    settingsDraggedIndex = null;

    if (state.pins.length === 0) {
      settingsPinsListEl.innerHTML = '<li class="settings-empty">No pinned websites yet.</li>';
      return;
    }

    state.pins.forEach((pin, index) => {
      const li = document.createElement('li');
      li.className = 'settings-pin-item';
      li.draggable = true;
      li.dataset.index = String(index);

      const iconHtml = pin.iconUrl
        ? `<img class="settings-pin-icon" src="${escapeAttr(resolveIconUrl(pin.iconUrl))}" alt="">`
        : `<span class="settings-pin-icon-fallback">${escapeHtml(pin.name.charAt(0))}</span>`;

      li.innerHTML = `
        <span class="settings-pin-drag-handle" title="Drag to reorder">⠿</span>
        ${iconHtml}
        <div class="settings-pin-info">
          <div class="settings-pin-name">${escapeHtml(pin.name)}</div>
          <div class="settings-pin-url">${escapeHtml(pin.url)}</div>
        </div>
        <button class="settings-pin-delete" type="button" title="Remove">✕</button>
      `;

      li.addEventListener('dragstart', () => {
        settingsDraggedIndex = index;
        li.classList.add('dragging');
      });

      li.addEventListener('dragend', () => {
        settingsDraggedIndex = null;
        li.classList.remove('dragging');
        settingsPinsListEl.querySelectorAll('.settings-pin-item').forEach((item) => {
          item.classList.remove('drag-over');
        });
      });

      li.addEventListener('dragover', (event) => {
        event.preventDefault();
        li.classList.add('drag-over');
      });

      li.addEventListener('dragleave', () => {
        li.classList.remove('drag-over');
      });

      li.addEventListener('drop', async (event) => {
        event.preventDefault();
        li.classList.remove('drag-over');

        if (settingsDraggedIndex === null || settingsDraggedIndex === index) {
          return;
        }

        const [moved] = state.pins.splice(settingsDraggedIndex, 1);
        state.pins.splice(index, 0, moved);
        state.pins.forEach((entry, entryIndex) => {
          entry.order = entryIndex;
        });

        settingsDraggedIndex = null;
        renderPinButtons();
        renderSettingsPinsList();
        await saveAndBroadcast();
      });

      li.querySelector('.settings-pin-delete')!.addEventListener('mousedown', (event) => {
        event.stopPropagation();
      });

      li.querySelector('.settings-pin-delete')!.addEventListener('click', async () => {
        state.pins.splice(index, 1);
        state.pins.forEach((entry, entryIndex) => {
          entry.order = entryIndex;
        });
        if (state.activePinId === pin.id) {
          state.activePinId = null;
          closePanel();
        }
        renderPinButtons();
        renderSettingsPinsList();
        await saveAndBroadcast();
      });

      settingsPinsListEl.appendChild(li);
    });
  }

  async function addPinFromSettings(formData: FormData) {
    const name = String(formData.get('pinName') ?? '').trim();
    const url = String(formData.get('pinUrl') ?? '').trim();
    const iconUrl = String(formData.get('pinIconUrl') ?? '').trim();

    if (!name || !url) {
      return;
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch {
      window.alert('Please enter a valid URL (include https://).');
      return;
    }

    state.pins.push({
      id: `custom-${Date.now()}`,
      name,
      url: parsedUrl.href,
      iconUrl,
      order: state.pins.length
    });

    settingsFormEl.reset();
    renderPinButtons();
    renderSettingsPinsList();
    await saveAndBroadcast();
  }

  async function resetToDefaults() {
    if (!window.confirm('Reset all pins and settings to defaults?')) {
      return;
    }

    const response = await chrome.runtime.sendMessage({ action: 'resetStorage' });
    if (!response?.ok) {
      return;
    }

    state.pins = response.data.pins;
    state.settings = response.data.settings;
    state.panelWidth = state.settings.panelWidth;
    state.activePinId = response.data.lastActivePinId ?? null;
    state.sidebarHidden = Boolean(response.data.sidebarHidden);
    closePanel();
    applySidebarVisibility();
    setCssVariables();
    renderPinButtons();
    updateSettingsControls();
    renderSettingsPinsList();
  }

  async function saveAndBroadcast() {
    state.settings = { ...state.settings, panelWidth: state.panelWidth };
    await chrome.storage.sync.set({ pins: state.pins, settings: state.settings });
    await chrome.runtime.sendMessage({
      action: 'broadcastPinsUpdated',
      pins: state.pins,
      settings: state.settings
    });
  }

  function resolveIconUrl(iconUrl: string) {
    if (!iconUrl) {
      return '';
    }
    if (iconUrl.startsWith('http')) {
      return iconUrl;
    }
    return chrome.runtime.getURL(iconUrl);
  }

  function escapeHtml(text: string) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function escapeAttr(text: string) {
    return text.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function closePanel() {
    state.panelOpen = false;
    panelEl.classList.remove('open');
    embedFailureHandled = false;
    embedFailureInFlight = null;
    iframeVerifyGeneration += 1;
    clearIframeTimer();
    clearIframeVerifyTimer();
    hideAllPanelViews();
    iframeEl.src = 'about:blank';
    applyLayoutClasses();
  }

  function refreshActivePin() {
    const pin = getActivePin();
    if (pin && state.panelOpen) {
      openPanelForPin(pin);
    }
  }

  async function openCompanionForPin(
    pin: Pin,
    options: { closePanelOnOpen?: boolean } = {}
  ) {
    const { closePanelOnOpen = false } = options;

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'openCompanion',
        url: pin.url,
        pinId: pin.id,
        companionSettings: state.settings
      });

      if (!response?.ok) {
        console.error('[GX Sidebar] Companion panel failed:', response?.error ?? 'Unknown error');
        return response;
      }

      state.activePinId = response.open ? pin.id : null;
      renderPinButtons();

      if (closePanelOnOpen && response.open && state.panelOpen) {
        closePanel();
      }

      return response;
    } catch (error) {
      console.error('[GX Sidebar] Companion panel failed:', error);
      return { ok: false, error: String(error) };
    }
  }

  function openActivePinInCompanion() {
    const pin = getActivePin();
    if (pin) {
      openCompanionForPin(pin, { closePanelOnOpen: true });
    }
  }

  function getActivePin() {
    return state.pins.find((p) => p.id === state.activePinId) ?? null;
  }

  function togglePanel() {
    if (state.panelOpen) {
      closePanel();
      return;
    }

    const pin = getActivePin() ?? state.pins[0];
    if (pin) {
      handlePinClick(pin);
    }
  }

  function setSidebarHidden(hidden: boolean) {
    state.sidebarHidden = hidden;
    applySidebarVisibility();
  }

  function applySidebarVisibility() {
    const root = shadowRoot?.querySelector('.sidebar-root');
    if (root) {
      root.classList.toggle('hidden', state.sidebarHidden);
    }
    applyLayoutClasses();
  }

  function applyLayoutClasses() {
    const html = document.documentElement;
    html.classList.remove('gx-sidebar-strip-visible', 'gx-sidebar-open', 'gx-sidebar-hidden');

    if (state.sidebarHidden) {
      html.classList.add('gx-sidebar-hidden');
      return;
    }

    if (state.panelOpen || state.settingsOpen) {
      html.classList.add('gx-sidebar-open');
    } else {
      html.classList.add('gx-sidebar-strip-visible');
    }
  }

  function registerMessageListener() {
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.action === 'setSidebarHidden') {
        setSidebarHidden(Boolean(message.hidden));
        sendResponse({ ok: true, hidden: state.sidebarHidden });
      }

      if (message.action === 'togglePanel') {
        togglePanel();
        sendResponse({ ok: true, panelOpen: state.panelOpen });
      }

      if (message.action === 'pinsUpdated') {
        state.pins = (message.pins ?? state.pins).slice().sort((a: Pin, b: Pin) => a.order - b.order);
        if (message.settings) {
          state.settings = { ...state.settings, ...message.settings };
          state.panelWidth = state.settings.panelWidth ?? state.panelWidth;
          setCssVariables();
        }
        renderPinButtons();
        if (state.settingsOpen) {
          updateSettingsControls();
          renderSettingsPinsList();
        }
        if (state.panelOpen) {
          const stillExists = state.pins.some((p) => p.id === state.activePinId);
          if (!stillExists) {
            closePanel();
            state.activePinId = null;
          }
        }
        sendResponse({ ok: true });
      }

      if (message.action === 'companionClosed') {
        if (message.pinId === state.activePinId) {
          state.activePinId = null;
          renderPinButtons();
        }
        sendResponse({ ok: true });
      }

      if (message.action === 'getState') {
        sendResponse({
          panelOpen: state.panelOpen,
          activePinId: state.activePinId,
          sidebarHidden: state.sidebarHidden,
          panelWidth: state.panelWidth
        });
      }

      return false;
    });
  }

  function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
  }
})();

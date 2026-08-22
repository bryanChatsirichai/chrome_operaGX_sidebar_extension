/**
 * Extension popup: manage pins, panel width, and companion window settings.
 * Changes are saved to sync storage and broadcast to all sidebar content scripts.
 */
import { GX_DEFAULTS, gxGetDefaultStorageData } from '../lib/defaults';
import type { Pin, Settings } from '../lib/types';
import './popup.module.scss';

/** Typed DOM lookup helper — elements are guaranteed present in popup.html. */
function byId<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

/** Cached references to form controls queried once at init. */
interface PopupElements {
  panelWidthInput: HTMLInputElement;
  panelWidthValue: HTMLElement;
  companionWidthInput: HTMLInputElement;
  companionWidthValue: HTMLElement;
  companionHeightModeInput: HTMLSelectElement;
  companionHeightInput: HTMLInputElement;
  companionHeightValue: HTMLElement;
  companionPositionInput: HTMLSelectElement;
  companionHeightRow: HTMLElement;
  addPinForm: HTMLFormElement;
  resetBtn: HTMLButtonElement;
  pinsList: HTMLUListElement;
}

let pins: Pin[] = [];
let settings: Settings = { ...GX_DEFAULTS.DEFAULT_SETTINGS };
let draggedIndex: number | null = null;
let elements: PopupElements;

document.addEventListener('DOMContentLoaded', init);

async function init(): Promise<void> {
  cacheElements();
  await loadData();
  bindEvents();
  renderPinsList();
  updateSettingsControls();
}

/** Caches DOM references to avoid repeated getElementById calls. */
function cacheElements(): void {
  elements = {
    panelWidthInput: byId('panelWidth'),
    panelWidthValue: byId('panelWidthValue'),
    companionWidthInput: byId('companionWidth'),
    companionWidthValue: byId('companionWidthValue'),
    companionHeightModeInput: byId('companionHeightMode'),
    companionHeightInput: byId('companionHeight'),
    companionHeightValue: byId('companionHeightValue'),
    companionPositionInput: byId('companionPosition'),
    companionHeightRow: byId('companionHeightRow'),
    addPinForm: byId('addPinForm'),
    resetBtn: byId('resetBtn'),
    pinsList: byId('pinsList')
  };
}

async function loadData(): Promise<void> {
  const response = await chrome.runtime.sendMessage({ action: 'getStorageData' });
  pins = (response.pins ?? gxGetDefaultStorageData().pins)
    .slice()
    .sort((a: Pin, b: Pin) => a.order - b.order);
  settings = { ...GX_DEFAULTS.DEFAULT_SETTINGS, ...(response.settings ?? {}) };
}

function bindEvents(): void {
  const {
    panelWidthInput,
    panelWidthValue,
    companionWidthInput,
    companionWidthValue,
    companionHeightModeInput,
    companionHeightInput,
    companionHeightValue,
    companionPositionInput,
    addPinForm,
    resetBtn
  } = elements;

  panelWidthInput.addEventListener('input', () => {
    settings.panelWidth = Number(panelWidthInput.value);
    panelWidthValue.textContent = `${settings.panelWidth}px`;
  });

  panelWidthInput.addEventListener('change', () => {
    void saveAndBroadcast();
  });

  companionWidthInput.addEventListener('input', () => {
    settings.companionWidth = Number(companionWidthInput.value);
    companionWidthValue.textContent = `${settings.companionWidth}px`;
  });

  companionWidthInput.addEventListener('change', () => {
    void saveAndBroadcast();
  });

  companionHeightModeInput.addEventListener('change', () => {
    settings.companionHeightMode =
      companionHeightModeInput.value as Settings['companionHeightMode'];
    updateCompanionHeightVisibility();
    void saveAndBroadcast();
  });

  companionHeightInput.addEventListener('input', () => {
    settings.companionHeight = Number(companionHeightInput.value);
    companionHeightValue.textContent = `${settings.companionHeight}px`;
  });

  companionHeightInput.addEventListener('change', () => {
    void saveAndBroadcast();
  });

  companionPositionInput.addEventListener('change', () => {
    settings.companionPosition = companionPositionInput.value as Settings['companionPosition'];
    void saveAndBroadcast();
  });

  addPinForm.addEventListener('submit', (event) => {
    event.preventDefault();
    void addPin();
  });

  resetBtn.addEventListener('click', () => {
    void resetToDefaults();
  });
}

async function resetToDefaults(): Promise<void> {
  if (!confirm('Reset all pins and settings to defaults?')) {
    return;
  }

  const response = await chrome.runtime.sendMessage({ action: 'resetStorage' });
  if (response.ok) {
    pins = response.data.pins;
    settings = response.data.settings;
    renderPinsList();
    updateSettingsControls();
  }
}

function updateSettingsControls(): void {
  const {
    panelWidthInput,
    panelWidthValue,
    companionWidthInput,
    companionWidthValue,
    companionHeightModeInput,
    companionHeightInput,
    companionHeightValue,
    companionPositionInput
  } = elements;

  panelWidthInput.value = String(settings.panelWidth);
  panelWidthValue.textContent = `${settings.panelWidth}px`;

  companionWidthInput.value = String(
    settings.companionWidth ?? GX_DEFAULTS.DEFAULT_SETTINGS.companionWidth
  );
  companionWidthValue.textContent = `${companionWidthInput.value}px`;

  companionHeightModeInput.value =
    settings.companionHeightMode ?? GX_DEFAULTS.DEFAULT_SETTINGS.companionHeightMode;

  companionHeightInput.value = String(
    settings.companionHeight ?? GX_DEFAULTS.DEFAULT_SETTINGS.companionHeight
  );
  companionHeightValue.textContent = `${companionHeightInput.value}px`;

  companionPositionInput.value =
    settings.companionPosition ?? GX_DEFAULTS.DEFAULT_SETTINGS.companionPosition;

  updateCompanionHeightVisibility();
}

function updateCompanionHeightVisibility(): void {
  const { companionHeightModeInput, companionHeightRow } = elements;
  companionHeightRow.classList.toggle('hidden', companionHeightModeInput.value !== 'fixed');
}

function renderPinsList(): void {
  const { pinsList: list } = elements;
  list.innerHTML = '';

  if (pins.length === 0) {
    list.innerHTML = '<li class="empty-state">No pinned apps yet. Add one below.</li>';
    return;
  }

  pins.forEach((pin, index) => {
    const li = document.createElement('li');
    li.className = 'pin-item';
    li.draggable = true;
    li.dataset.index = String(index);

    const iconHtml = pin.iconUrl
      ? `<img class="pin-icon" src="${escapeAttr(resolveIconUrl(pin.iconUrl))}" alt="">`
      : `<span class="pin-icon-fallback">${escapeHtml(pin.name.charAt(0))}</span>`;

    li.innerHTML = `
      <span class="pin-drag-handle">⠿</span>
      ${iconHtml}
      <div class="pin-info">
        <div class="pin-name">${escapeHtml(pin.name)}</div>
        <div class="pin-url">${escapeHtml(pin.url)}</div>
      </div>
      <button class="pin-delete" type="button" title="Remove pin">✕</button>
    `;

    li.addEventListener('dragstart', () => {
      draggedIndex = index;
      li.classList.add('dragging');
    });

    li.addEventListener('dragend', () => {
      draggedIndex = null;
      li.classList.remove('dragging');
      list.querySelectorAll('.pin-item').forEach((item) => item.classList.remove('drag-over'));
    });

    li.addEventListener('dragover', (event) => {
      event.preventDefault();
      li.classList.add('drag-over');
    });

    li.addEventListener('dragleave', () => {
      li.classList.remove('drag-over');
    });

    li.addEventListener('drop', (event) => {
      event.preventDefault();
      li.classList.remove('drag-over');

      if (draggedIndex === null || draggedIndex === index) {
        return;
      }

      const [moved] = pins.splice(draggedIndex, 1);
      pins.splice(index, 0, moved);
      pins.forEach((entry, entryIndex) => {
        entry.order = entryIndex;
      });

      draggedIndex = null;
      renderPinsList();
      void saveAndBroadcast();
    });

    li.querySelector('.pin-delete')!.addEventListener('click', () => {
      pins.splice(index, 1);
      pins.forEach((entry, entryIndex) => {
        entry.order = entryIndex;
      });
      renderPinsList();
      void saveAndBroadcast();
    });

    list.appendChild(li);
  });
}

async function addPin(): Promise<void> {
  const name = byId<HTMLInputElement>('pinName').value.trim();
  const url = byId<HTMLInputElement>('pinUrl').value.trim();
  const iconUrl = byId<HTMLInputElement>('pinIconUrl').value.trim();

  if (!name || !url) {
    return;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    alert('Please enter a valid URL (include https://).');
    return;
  }

  pins.push({
    id: `custom-${Date.now()}`,
    name,
    url: parsedUrl.href,
    iconUrl: iconUrl || '',
    order: pins.length
  });

  elements.addPinForm.reset();
  renderPinsList();
  await saveAndBroadcast();
}

async function saveAndBroadcast(): Promise<void> {
  await chrome.storage.sync.set({ pins, settings });
  await chrome.runtime.sendMessage({
    action: 'broadcastPinsUpdated',
    pins,
    settings
  });
}

/** Resolves extension-relative icon paths to full chrome-extension:// URLs. */
function resolveIconUrl(iconUrl: string): string {
  if (!iconUrl) {
    return '';
  }
  if (iconUrl.startsWith('http')) {
    return iconUrl;
  }
  return chrome.runtime.getURL(iconUrl);
}

/** Escapes text for safe insertion into HTML content. */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/** Escapes quotes for safe use inside HTML attribute values. */
function escapeAttr(text: string): string {
  return text.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

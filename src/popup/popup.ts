import { GX_DEFAULTS, gxGetDefaultStorageData } from '../lib/defaults';
import type { Pin, Settings } from '../lib/types';
import './popup.module.scss';

function byId<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

let pins: Pin[] = [];
let settings: Settings = { ...GX_DEFAULTS.DEFAULT_SETTINGS };
let draggedIndex: number | null = null;

document.addEventListener('DOMContentLoaded', init);

async function init() {
  await loadData();
  bindEvents();
  renderPinsList();
  updateSettingsControls();
}

async function loadData() {
  const response = await chrome.runtime.sendMessage({ action: 'getStorageData' });
  pins = (response.pins ?? gxGetDefaultStorageData().pins).slice().sort((a: Pin, b: Pin) => a.order - b.order);
  settings = { ...GX_DEFAULTS.DEFAULT_SETTINGS, ...(response.settings ?? {}) };
}

function bindEvents() {
  const panelWidthInput = byId<HTMLInputElement>('panelWidth');
  const panelWidthValue = byId('panelWidthValue');
  const companionWidthInput = byId<HTMLInputElement>('companionWidth');
  const companionWidthValue = byId('companionWidthValue');
  const companionHeightModeInput = byId<HTMLSelectElement>('companionHeightMode');
  const companionHeightInput = byId<HTMLInputElement>('companionHeight');
  const companionHeightValue = byId('companionHeightValue');
  const companionPositionInput = byId<HTMLSelectElement>('companionPosition');

  panelWidthInput.addEventListener('input', () => {
    settings.panelWidth = Number(panelWidthInput.value);
    panelWidthValue.textContent = `${settings.panelWidth}px`;
  });

  panelWidthInput.addEventListener('change', async () => {
    await saveAndBroadcast();
  });

  companionWidthInput.addEventListener('input', () => {
    settings.companionWidth = Number(companionWidthInput.value);
    companionWidthValue.textContent = `${settings.companionWidth}px`;
  });

  companionWidthInput.addEventListener('change', async () => {
    await saveAndBroadcast();
  });

  companionHeightModeInput.addEventListener('change', async () => {
    settings.companionHeightMode =
      companionHeightModeInput.value as Settings['companionHeightMode'];
    updateCompanionHeightVisibility();
    await saveAndBroadcast();
  });

  companionHeightInput.addEventListener('input', () => {
    settings.companionHeight = Number(companionHeightInput.value);
    companionHeightValue.textContent = `${settings.companionHeight}px`;
  });

  companionHeightInput.addEventListener('change', async () => {
    await saveAndBroadcast();
  });

  companionPositionInput.addEventListener('change', async () => {
    settings.companionPosition = companionPositionInput.value as Settings['companionPosition'];
    await saveAndBroadcast();
  });

  byId<HTMLFormElement>('addPinForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    await addPin();
  });

  byId('resetBtn').addEventListener('click', async () => {
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
  });
}

function updateSettingsControls() {
  const panelWidthInput = byId<HTMLInputElement>('panelWidth');
  const panelWidthValue = byId('panelWidthValue');
  const companionWidthInput = byId<HTMLInputElement>('companionWidth');
  const companionWidthValue = byId('companionWidthValue');
  const companionHeightModeInput = byId<HTMLSelectElement>('companionHeightMode');
  const companionHeightInput = byId<HTMLInputElement>('companionHeight');
  const companionHeightValue = byId('companionHeightValue');
  const companionPositionInput = byId<HTMLSelectElement>('companionPosition');

  panelWidthInput.value = String(settings.panelWidth);
  panelWidthValue.textContent = `${settings.panelWidth}px`;

  companionWidthInput.value = String(settings.companionWidth ?? GX_DEFAULTS.DEFAULT_SETTINGS.companionWidth);
  companionWidthValue.textContent = `${companionWidthInput.value}px`;
  companionHeightModeInput.value =
    settings.companionHeightMode ?? GX_DEFAULTS.DEFAULT_SETTINGS.companionHeightMode;
  companionHeightInput.value = String(settings.companionHeight ?? GX_DEFAULTS.DEFAULT_SETTINGS.companionHeight);
  companionHeightValue.textContent = `${companionHeightInput.value}px`;
  companionPositionInput.value =
    settings.companionPosition ?? GX_DEFAULTS.DEFAULT_SETTINGS.companionPosition;
  updateCompanionHeightVisibility();
}

function updateCompanionHeightVisibility() {
  const companionHeightModeInput = byId<HTMLSelectElement>('companionHeightMode');
  const companionHeightRow = byId('companionHeightRow');
  companionHeightRow.classList.toggle('hidden', companionHeightModeInput.value !== 'fixed');
}

function renderPinsList() {
  const list = byId<HTMLUListElement>('pinsList');
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

    li.addEventListener('drop', async (event) => {
      event.preventDefault();
      li.classList.remove('drag-over');
      const targetIndex = index;
      if (draggedIndex === null || draggedIndex === targetIndex) return;

      const [moved] = pins.splice(draggedIndex, 1);
      pins.splice(targetIndex, 0, moved);
      pins.forEach((p, i) => {
        p.order = i;
      });

      draggedIndex = null;
      renderPinsList();
      await saveAndBroadcast();
    });

    li.querySelector('.pin-delete')!.addEventListener('click', async () => {
      pins.splice(index, 1);
      pins.forEach((p, i) => {
        p.order = i;
      });
      renderPinsList();
      await saveAndBroadcast();
    });

    list.appendChild(li);
  });
}

async function addPin() {
  const name = byId<HTMLInputElement>('pinName').value.trim();
  const url = byId<HTMLInputElement>('pinUrl').value.trim();
  const iconUrl = byId<HTMLInputElement>('pinIconUrl').value.trim();

  if (!name || !url) return;

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    alert('Please enter a valid URL (include https://).');
    return;
  }

  const id = 'custom-' + Date.now();
  pins.push({
    id,
    name,
    url: parsedUrl.href,
    iconUrl: iconUrl || '',
    order: pins.length
  });

  byId<HTMLFormElement>('addPinForm').reset();
  renderPinsList();
  await saveAndBroadcast();
}

async function saveAndBroadcast() {
  await chrome.storage.sync.set({ pins, settings });
  await chrome.runtime.sendMessage({
    action: 'broadcastPinsUpdated',
    pins,
    settings
  });
}

function resolveIconUrl(iconUrl: string) {
  if (!iconUrl) return '';
  if (iconUrl.startsWith('http')) return iconUrl;
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

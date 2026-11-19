// Wires the Neon Coast editor: photo pickers, layout and grade buttons, caption
// fields, per-panel crop controls, size choice and PNG export. A `?shot=` query
// sets up a fixed scene for a screenshot instead (./shots.js).

import { drawCover, freshPanels, layoutById, LAYOUTS, GRADES, SIZES, sizeById } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const titleInput = document.getElementById('title');
const subtitleInput = document.getElementById('subtitle');
const statusEl = document.getElementById('status');
const panelSelect = document.getElementById('panelSelect');
const panelPhoto = document.getElementById('panelPhoto');
const zoomInput = document.getElementById('zoom');
const zoomVal = document.getElementById('zoomVal');
const panXInput = document.getElementById('panX');
const panYInput = document.getElementById('panY');

const state = {
  layout: 'nine',
  grade: 'sunset',
  title: 'NEON COAST',
  subtitle: 'a sunset story',
  size: 'square',
  photos: [null, null, null],
  panels: freshPanels('nine'),
};
let selectedPanel = 0;
let panelPixels = [];

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function redraw() {
  const size = sizeById(state.size);
  if (canvas.width !== size.w || canvas.height !== size.h) {
    canvas.width = size.w;
    canvas.height = size.h;
  }
  panelPixels = drawCover(canvas, state);
}

function refreshPanelControls() {
  const count = layoutById(state.layout).panels;
  if (selectedPanel >= count) selectedPanel = 0;
  panelSelect.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const option = document.createElement('option');
    option.value = String(i);
    option.textContent = `Panel ${i + 1}`;
    panelSelect.appendChild(option);
  }
  panelSelect.value = String(selectedPanel);
  panelPhoto.innerHTML = '';
  for (let i = 0; i < 3; i++) {
    const option = document.createElement('option');
    option.value = String(i);
    option.textContent = state.photos[i] ? `Photo ${i + 1}` : `Photo ${i + 1} (empty)`;
    panelPhoto.appendChild(option);
  }
  const panel = state.panels[selectedPanel];
  panelPhoto.value = String(panel.photo);
  zoomInput.value = String(Math.round(panel.zoom * 100));
  zoomVal.textContent = `${Math.round(panel.zoom * 100)}%`;
  panXInput.value = String(panel.x);
  panYInput.value = String(panel.y);
}

function buildPickButtons(containerId, items, current, onPick) {
  const box = document.getElementById(containerId);
  box.innerHTML = '';
  items.forEach((item) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = item.name;
    button.setAttribute('aria-pressed', item.id === current ? 'true' : 'false');
    button.addEventListener('click', () => {
      onPick(item.id);
      box.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', 'false'));
      button.setAttribute('aria-pressed', 'true');
    });
    box.appendChild(button);
  });
}

function buildAllPicks() {
  buildPickButtons('layouts', LAYOUTS, state.layout, setLayout);
  buildPickButtons('grades', GRADES, state.grade, setGrade);
  buildPickButtons('sizes', SIZES, state.size, setSize);
}

function setLayout(id) {
  state.layout = id;
  state.panels = freshPanels(id);
  selectedPanel = 0;
  refreshPanelControls();
  redraw();
}

function setGrade(id) {
  state.grade = id;
  redraw();
}

function setSize(id) {
  state.size = id;
  redraw();
}

buildAllPicks();
refreshPanelControls();

function readPhotoFile(slot, file) {
  if (!file) return;
  const url = URL.createObjectURL(file);
  loadImage(url).then((img) => {
    state.photos[slot] = img;
    refreshPanelControls();
    redraw();
  });
}

[0, 1, 2].forEach((slot) => {
  document.getElementById(`photo${slot}`).addEventListener('change', (e) => {
    readPhotoFile(slot, e.target.files[0]);
  });
});

document.getElementById('samples').addEventListener('click', async () => {
  const [a, b] = await Promise.all([
    loadImage('samples/boulevard.jpg'),
    loadImage('samples/pier.jpg'),
  ]);
  state.photos = [a, b, a];
  refreshPanelControls();
  redraw();
  statusEl.textContent = 'Sample photos loaded — swap them for your own any time.';
});

document.getElementById('fillOne').addEventListener('click', () => {
  state.panels.forEach((panel) => { panel.photo = 0; });
  refreshPanelControls();
  redraw();
});

titleInput.addEventListener('input', () => { state.title = titleInput.value; redraw(); });
subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; redraw(); });

panelSelect.addEventListener('change', () => {
  selectedPanel = Number(panelSelect.value);
  refreshPanelControls();
});
panelPhoto.addEventListener('change', () => {
  state.panels[selectedPanel].photo = Number(panelPhoto.value);
  redraw();
});
zoomInput.addEventListener('input', () => {
  state.panels[selectedPanel].zoom = Number(zoomInput.value) / 100;
  zoomVal.textContent = `${zoomInput.value}%`;
  redraw();
});
panXInput.addEventListener('input', () => { state.panels[selectedPanel].x = Number(panXInput.value); redraw(); });
panYInput.addEventListener('input', () => { state.panels[selectedPanel].y = Number(panYInput.value); redraw(); });

// Click a panel in the preview to select it; drag inside it to pan the photo.
let drag = null;
function canvasPoint(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) / rect.width) * canvas.width,
    y: ((e.clientY - rect.top) / rect.height) * canvas.height,
  };
}
canvas.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  const hit = panelPixels.findIndex((r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h);
  if (hit === -1) return;
  selectedPanel = hit;
  refreshPanelControls();
  drag = { x: p.x, y: p.y, px: state.panels[hit].x, py: state.panels[hit].y, rect: panelPixels[hit] };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const p = canvasPoint(e);
  const panel = state.panels[selectedPanel];
  panel.x = Math.max(-40, Math.min(40, drag.px + ((p.x - drag.x) / drag.rect.w) * 100));
  panel.y = Math.max(-40, Math.min(40, drag.py + ((p.y - drag.y) / drag.rect.h) * 100));
  panXInput.value = String(Math.round(panel.x));
  panYInput.value = String(Math.round(panel.y));
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });

/** Renders the current state at `size` and returns the PNG bytes. */
export function exportPng(sizeId) {
  const size = sizeById(sizeId ?? state.size);
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  drawCover(off, state);
  return new Promise((resolve) => {
    off.toBlob(async (blob) => {
      resolve({ width: size.w, height: size.h, bytes: blob.size, blob });
    }, 'image/png');
  });
}

document.getElementById('export').addEventListener('click', async () => {
  const size = sizeById(state.size);
  const { blob } = await exportPng(state.size);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `neon-coast-${size.w}x${size.h}.png`;
  a.click();
  statusEl.textContent = `Saved neon-coast-${size.w}x${size.h}.png`;
});

// Test hook for the headless check: export without a download.
window.__studio = { state, redraw, exportPng, loadImage };

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  runShot(shot, query, {
    loadImage,
    setState(patch) {
      Object.assign(state, patch);
      if (patch.layout) state.panels = freshPanels(patch.layout);
      titleInput.value = state.title;
      subtitleInput.value = state.subtitle;
      buildAllPicks();
      refreshPanelControls();
    },
    // Spreads the loaded photos across the panels with varied crops, so a
    // grid reads as several shots instead of one photo repeated.
    spreadPhotos() {
      state.panels.forEach((panel, i) => {
        panel.photo = i % 2;
        panel.zoom = 1 + (i % 3) * 0.3;
        panel.x = ((i * 17) % 30) - 15;
        panel.y = ((i * 11) % 20) - 10;
      });
      refreshPanelControls();
    },
    redraw,
  });
} else {
  document.fonts.ready.then(redraw);
  redraw();
}

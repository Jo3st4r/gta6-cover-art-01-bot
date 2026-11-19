// Neon Coast cover engine: draws a multi-panel poster cover onto a 2D canvas.
// A cover is a photo area of white-bordered panels (one of six layouts) above a
// title band with bold Anton lettering and a Pacifico neon subtitle, washed with
// one of five sunset grades, grain and a vignette. All drawing is local: the
// photos are images already loaded in the page, the fonts are files under app/.

export const LAYOUTS = [
  { id: 'nine', name: '9-panel grid', panels: 9 },
  { id: 'four', name: '4-panel grid', panels: 4 },
  { id: 'hero', name: 'Hero + 3', panels: 4 },
  { id: 'tilted', name: 'Tilted snapshots', panels: 3 },
  { id: 'fullbleed', name: 'Full bleed', panels: 1 },
  { id: 'strip', name: 'Hero + strip', panels: 5 },
];

export const GRADES = [
  { id: 'sunset', name: 'Sunset', top: '#ffd166', mid: '#ff7a3d', low: '#c2257a', band: '#2a0e3f', neon: '#ff5da2' },
  { id: 'neon', name: 'Neon nights', top: '#7ef0e0', mid: '#ff2e88', low: '#5b2ee5', band: '#14082b', neon: '#37f2d4' },
  { id: 'palmdusk', name: 'Palm dusk', top: '#ffe9a8', mid: '#f76b1c', low: '#7a1e5e', band: '#33122e', neon: '#ffb347' },
  { id: 'midnight', name: 'Midnight drive', top: '#9db8ff', mid: '#4b3df0', low: '#12082e', band: '#0b0620', neon: '#8fb0ff' },
  { id: 'golden', name: 'Golden hour', top: '#fff3c4', mid: '#ffb347', low: '#b34724', band: '#3a1c10', neon: '#ffd166' },
];

export const SIZES = [
  { id: 'square', name: 'Square 1080 × 1080', w: 1080, h: 1080 },
  { id: 'portrait', name: 'Portrait 1080 × 1350', w: 1080, h: 1350 },
  { id: 'wide', name: 'Wide 1920 × 1080', w: 1920, h: 1080 },
];

export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) ?? LAYOUTS[0];
}

export function gradeById(id) {
  return GRADES.find((g) => g.id === id) ?? GRADES[0];
}

export function sizeById(id) {
  return SIZES.find((s) => s.id === id) ?? SIZES[0];
}

/** A fresh per-panel crop state: which photo fills it, zoom and pan. */
export function freshPanels(layoutId) {
  const count = layoutById(layoutId).panels;
  const panels = [];
  for (let i = 0; i < count; i++) {
    panels.push({ photo: 0, zoom: 1, x: 0, y: 0 });
  }
  return panels;
}

/** Panel rectangles for a layout, in fractions of the photo area. */
export function panelRects(layoutId) {
  const g = 0.016; // gutter, as a fraction of the photo area
  const full = { x: 0, y: 0, w: 1, h: 1, rot: 0 };
  if (layoutId === 'nine') {
    const rects = [];
    const cell = (1 - g * 2) / 3;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        rects.push({ x: c * (cell + g), y: r * (cell + g), w: cell, h: cell, rot: 0 });
      }
    }
    return rects;
  }
  if (layoutId === 'four') {
    const cell = (1 - g) / 2;
    return [
      { x: 0, y: 0, w: cell, h: cell, rot: 0 },
      { x: cell + g, y: 0, w: cell, h: cell, rot: 0 },
      { x: 0, y: cell + g, w: cell, h: cell, rot: 0 },
      { x: cell + g, y: cell + g, w: cell, h: cell, rot: 0 },
    ];
  }
  if (layoutId === 'hero') {
    const side = 1 - 0.62 - g;
    const cell = (1 - g * 2) / 3;
    return [
      { x: 0, y: 0, w: 0.62, h: 1, rot: 0 },
      { x: 0.62 + g, y: 0, w: side, h: cell, rot: 0 },
      { x: 0.62 + g, y: cell + g, w: side, h: cell, rot: 0 },
      { x: 0.62 + g, y: 2 * (cell + g), w: side, h: cell, rot: 0 },
    ];
  }
  if (layoutId === 'tilted') {
    return [
      { x: 0.02, y: 0.06, w: 0.34, h: 0.82, rot: -4 },
      { x: 0.33, y: 0.02, w: 0.34, h: 0.88, rot: 2 },
      { x: 0.64, y: 0.06, w: 0.34, h: 0.82, rot: -2 },
    ];
  }
  if (layoutId === 'fullbleed') return [full];
  // strip: hero on top, four small panels along the bottom
  const stripH = 0.3;
  const cell = (1 - g * 3) / 4;
  const rects = [{ x: 0, y: 0, w: 1, h: 1 - stripH - g, rot: 0 }];
  for (let i = 0; i < 4; i++) {
    rects.push({ x: i * (cell + g), y: 1 - stripH, w: cell, h: stripH, rot: 0 });
  }
  return rects;
}

/** Small deterministic random source, so the grain looks the same every render. */
function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Draws one photo into a rectangle, cover-fit, with the panel's zoom and pan. */
function drawPhotoInto(ctx, img, rx, ry, rw, rh, panel) {
  if (!img) return;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.max(rw / iw, rh / ih) * panel.zoom;
  const pw = iw * scale;
  const ph = ih * scale;
  // Pan, clamped so the photo always covers the whole panel (no gaps).
  let dx = rx + (rw - pw) / 2 + (panel.x / 100) * rw;
  let dy = ry + (rh - ph) / 2 + (panel.y / 100) * rh;
  dx = Math.max(rx + rw - pw, Math.min(rx, dx));
  dy = Math.max(ry + rh - ph, Math.min(ry, dy));
  ctx.drawImage(img, dx, dy, pw, ph);
}

function drawPanel(ctx, img, rect, area, panel, frame) {
  const rx = area.x + rect.x * area.w;
  const ry = area.y + rect.y * area.h;
  const rw = rect.w * area.w;
  const rh = rect.h * area.h;
  ctx.save();
  if (rect.rot) {
    ctx.translate(rx + rw / 2, ry + rh / 2);
    ctx.rotate((rect.rot * Math.PI) / 180);
    ctx.translate(-(rx + rw / 2), -(ry + rh / 2));
  }
  // White poster frame, then the photo clipped inside it.
  ctx.fillStyle = '#fdf8ef';
  ctx.fillRect(rx - frame, ry - frame, rw + frame * 2, rh + frame * 2);
  ctx.beginPath();
  ctx.rect(rx, ry, rw, rh);
  ctx.clip();
  if (img) {
    drawPhotoInto(ctx, img, rx, ry, rw, rh, panel);
  } else {
    const grad = ctx.createLinearGradient(rx, ry, rx + rw, ry + rh);
    grad.addColorStop(0, '#3a2358');
    grad.addColorStop(1, '#1c1030');
    ctx.fillStyle = grad;
    ctx.fillRect(rx, ry, rw, rh);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = `700 ${Math.max(14, rw * 0.055)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('ADD A PHOTO', rx + rw / 2, ry + rh / 2);
  }
  ctx.restore();
}

function applyGrade(ctx, area, grade) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(area.x, area.y, area.w, area.h);
  ctx.clip();
  const wash = ctx.createLinearGradient(area.x, area.y, area.x, area.y + area.h);
  wash.addColorStop(0, grade.top);
  wash.addColorStop(0.55, grade.mid);
  wash.addColorStop(1, grade.low);
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.34;
  ctx.fillStyle = wash;
  ctx.fillRect(area.x, area.y, area.w, area.h);
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = grade.mid;
  ctx.fillRect(area.x, area.y, area.w, area.h);
  ctx.restore();
}

function addGrainAndVignette(ctx, w, h) {
  const rand = seededRandom(20261119);
  ctx.save();
  const dots = Math.floor((w * h) / 900);
  for (let i = 0; i < dots; i++) {
    const v = rand();
    ctx.fillStyle = v > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
    ctx.fillRect(rand() * w, rand() * h, 1 + rand() * 2, 1 + rand() * 2);
  }
  const vig = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75,
  );
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(10,4,20,0.38)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function fitFont(ctx, text, maxWidth, startSize, family) {
  let size = startSize;
  ctx.font = `${size}px ${family}`;
  while (size > 12 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${size}px ${family}`;
  }
  return size;
}

function drawTitleBand(ctx, w, h, bandY, bandH, grade, title, subtitle, layout, size) {
  const band = ctx.createLinearGradient(0, bandY, 0, h);
  band.addColorStop(0, grade.band);
  band.addColorStop(1, '#0d0518');
  ctx.fillStyle = band;
  ctx.fillRect(0, bandY, w, bandH);
  // Neon rule above the band.
  const rule = ctx.createLinearGradient(0, 0, w, 0);
  rule.addColorStop(0, grade.top);
  rule.addColorStop(0.5, grade.neon);
  rule.addColorStop(1, grade.mid);
  ctx.fillStyle = rule;
  ctx.fillRect(0, bandY, w, Math.max(3, h * 0.004));

  const cx = w / 2;
  const words = (title.trim() || 'NEON COAST').toUpperCase();
  const titleSize = fitFont(ctx, words, w * 0.9, bandH * 0.46, '"Anton", "Arial Black", sans-serif');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.save();
  ctx.translate(cx, bandY + bandH * 0.36);
  ctx.scale(1, 1.04);
  ctx.lineWidth = Math.max(2, titleSize * 0.06);
  ctx.strokeStyle = grade.neon;
  ctx.strokeText(words, 0, 0);
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = grade.neon;
  ctx.shadowBlur = titleSize * 0.22;
  ctx.fillText(words, 0, 0);
  ctx.restore();

  const sub = (subtitle || '').trim();
  if (sub) {
    const subSize = fitFont(ctx, sub, w * 0.7, bandH * 0.17, '"Pacifico", cursive');
    ctx.font = `${subSize}px "Pacifico", cursive`;
    ctx.fillStyle = grade.neon;
    ctx.shadowColor = grade.neon;
    ctx.shadowBlur = subSize * 0.4;
    ctx.fillText(sub, cx, bandY + bandH * 0.72);
    ctx.shadowBlur = 0;
  }

  const micro = `${layoutById(layout).panels} PANELS · 5 GRADES · ${size.w} × ${size.h}`;
  ctx.font = `700 ${Math.max(11, h * 0.011)}px system-ui, sans-serif`;
  ctx.fillStyle = 'rgba(255,247,236,0.62)';
  ctx.shadowBlur = 0;
  ctx.fillText(micro, cx, bandY + bandH * 0.92);
}

/**
 * Draws the whole cover for `state` onto `canvas` (its own pixel size).
 * state: { layout, grade, title, subtitle, photos: [img|null], panels: [{photo,zoom,x,y}] }
 * Returns the panel rectangles in canvas pixels, for hit-testing in the editor.
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const grade = gradeById(state.grade);
  const size = { w, h };
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#12081f';
  ctx.fillRect(0, 0, w, h);

  const aspect = w / h;
  const titleFrac = aspect >= 1.4 ? 0.26 : aspect >= 0.9 ? 0.2 : 0.17;
  const titleH = h * titleFrac;
  const pad = w * 0.016;
  const area = { x: pad, y: pad, w: w - pad * 2, h: h - titleH - pad * 2 };
  const frame = Math.max(2, w * 0.006);
  const rects = panelRects(state.layout);

  rects.forEach((rect, i) => {
    const panel = state.panels[i] ?? { photo: 0, zoom: 1, x: 0, y: 0 };
    const img = state.photos[panel.photo] ?? null;
    drawPanel(ctx, img, rect, area, panel, frame);
  });
  applyGrade(ctx, area, grade);
  drawTitleBand(ctx, w, h, h - titleH, titleH, grade, state.title, state.subtitle, state.layout, size);
  addGrainAndVignette(ctx, w, h);

  return rects.map((rect) => ({
    x: area.x + rect.x * area.w,
    y: area.y + rect.y * area.h,
    w: rect.w * area.w,
    h: rect.h * area.h,
  }));
}

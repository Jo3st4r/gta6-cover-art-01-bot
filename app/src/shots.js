// Fixed scenes for screenshots: ?shot=editor shows the page with sample photos
// loaded; ?shot=cover shows the exported cover alone, drawn at the export size.
// Query keys: photo / photo2 / photo3 (sample names), caption, subtitle, layout,
// grade, size. window.__shotReady is set once the scene has painted.

export async function runShot(shot, query, api) {
  const layout = query.get('layout') ?? 'nine';
  const grade = query.get('grade') ?? 'sunset';
  const size = query.get('size') ?? 'square';
  const title = query.get('caption') ?? 'Neon Coast';
  const subtitle = query.get('subtitle') ?? 'a sunset story';
  const names = [
    query.get('photo') ?? 'pier',
    query.get('photo2') ?? 'boulevard',
    query.get('photo3') ?? 'pier',
  ];
  const photos = await Promise.all(names.map((n) => api.loadImage(`samples/${n}.jpg`)));
  api.setState({ layout, grade, size, title, subtitle, photos });
  api.spreadPhotos();
  if (shot === 'cover') document.body.classList.add('shot-cover');
  await document.fonts.ready;
  api.redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}

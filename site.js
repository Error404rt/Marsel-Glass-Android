(() => {
  if (globalThis.maarrselSiteLoaded) return;
  globalThis.maarrselSiteLoaded = true;
  const key = 'maarrsel:' + location.protocol + '//' + location.hostname + '/*';
  const root = document.documentElement;
  const canvas = document.createElement('canvas');
  canvas.id = 'maarrsel-wall-layer';
  canvas.setAttribute('aria-hidden', 'true');
  const context = canvas.getContext('2d');
  let revision = 0;
  async function apply() {
    const version = ++revision;
    const settings = await chrome.storage.local.get([key, 'wallpaper', 'theme', 'allSites']);
    if (version !== revision) return;
    if (!(settings[key] ?? settings.allSites)) {
      root.removeAttribute('data-maarrsel');
      canvas.remove();
      return;
    }
    const theme = settings.theme ?? {};
    const wallpaper = settings.wallpaper;
    root.style.setProperty('--maarrsel-bg', theme.bg ?? '#100c24');
    root.style.setProperty('--maarrsel-tint', theme.match !== false && wallpaper?.tint ? wallpaper.tint : '#101019');
    root.style.setProperty('--maarrsel-shade', Math.max(35, theme.shade ?? 42) + '%');
    root.style.setProperty('--maarrsel-blur', Math.min(24, theme.blur ?? 18) + 'px');
    root.style.setProperty('--maarrsel-wall-blur', (theme.wallpaperBlur ?? 0) + 'px');
    root.dataset.maarrsel = /(^|\.)youtube\.com$/.test(location.hostname) ? 'youtube' :
      location.hostname === 'github.com' ? 'github' :
      /(^|\.)soundcloud\.com$/.test(location.hostname) ? 'soundcloud' : 'generic';
    canvas.remove();
    if (!wallpaper?.image) return;
    const bytes = Uint8Array.from(atob(wallpaper.image.split(',')[1]), char => char.charCodeAt(0));
    const bitmap = await createImageBitmap(new Blob([bytes], { type: 'image/jpeg' }));
    try {
      if (version !== revision) return;
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      context.drawImage(bitmap, 0, 0);
      context.fillStyle = 'rgba(0,0,0,' + (theme.dim ?? 30) / 100 + ')';
      context.fillRect(0, 0, canvas.width, canvas.height);
      document.body.prepend(canvas);
    } finally {
      bitmap.close();
    }
  }
  function refresh() { apply().catch(() => {}); }
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && (changes[key] || changes.allSites || changes.wallpaper || changes.theme)) refresh();
  });
  refresh();
})();



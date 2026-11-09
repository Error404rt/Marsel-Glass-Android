(() => {
  const api = globalThis.browser ?? globalThis.chrome;
  if (globalThis.maarrselSiteLoaded) return;
  globalThis.maarrselSiteLoaded = true;
  const key = 'maarrsel:' + location.protocol + '//' + location.hostname + '/*';
  const root = document.documentElement;
  const canvas = document.createElement('canvas');
  canvas.id = 'maarrsel-wall-layer';
  canvas.setAttribute('aria-hidden', 'true');
  const context = canvas.getContext('2d');
  const coarse = matchMedia('(pointer: coarse)').matches;
  let revision = 0;
  async function apply() {
    const version = ++revision;
    const settings = await api.storage.local.get([key, 'wallpaper', 'theme', 'allSites']);
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
    root.style.setProperty('--maarrsel-blur', Math.min(coarse ? 18 : 24, theme.blur ?? 18) + 'px');
    const wallBlur = coarse ? Math.min(24, theme.wallpaperBlur ?? 0) : theme.wallpaperBlur ?? 0;
    root.style.setProperty('--maarrsel-wall-blur', wallBlur + 'px');
    const host = location.hostname;
    root.dataset.maarrsel = /(^|\\.)yandex\\.(kz|ru|com|by|uz|com\\.tr)$/.test(host)
      ? 'yandex'
      : /(^|\\.)youtube\\.com$/.test(host)
        ? (document.querySelector('ytm-app') ? 'youtube-mobile' : 'youtube')
        : host === 'github.com' ? 'github'
        : /(^|\\.)soundcloud\\.com$/.test(host) ? 'soundcloud' : 'generic';
    canvas.remove();
    if (!wallpaper?.image) return;
    const bytes = Uint8Array.from(atob(wallpaper.image.split(',')[1]), char => char.charCodeAt(0));
    const bitmap = await createImageBitmap(new Blob([bytes], { type: 'image/jpeg' }));
    try {
      if (version !== revision) return;
      const maxSide = coarse ? 2048 : 2560;
      const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      context.fillStyle = 'rgba(0,0,0,' + (theme.dim ?? 30) / 100 + ')';
      context.fillRect(0, 0, canvas.width, canvas.height);
      (document.body ?? document.documentElement).prepend(canvas);
    } finally {
      bitmap.close();
    }
  }
  function refresh() { apply().catch(() => {}); }
  api.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && (changes[key] || changes.allSites || changes.wallpaper || changes.theme)) refresh();
  });
  refresh();
})();

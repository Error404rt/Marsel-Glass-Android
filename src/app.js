(async () => {
const api = globalThis.browser ?? globalThis.chrome;
const isAndroid = /Android/i.test(navigator.userAgent);
const { locale, t } = await localize();
const languagePicker = document.getElementById('language');
languagePicker.value = locale;
languagePicker.onchange = async () => {
  try {
    await api.storage.local.set({ language: languagePicker.value });
    location.reload();
  } catch {
    languagePicker.value = locale;
    document.getElementById('status').textContent = t('Не удалось сохранить язык.');
  }
};
const get = id => document.getElementById(id);
const palettes = {
  'Сирень': { bg: '#100c24', accent: '#c7a5ff', text: '#ffffff' },
  'Лагуна': { bg: '#062020', accent: '#5eead4', text: '#effffc' },
  'Закат': { bg: '#281218', accent: '#ffab7b', text: '#fff5ea' },
  'Графит': { bg: '#151719', accent: '#aab9c9', text: '#ffffff' }
};
const defaults = { ...palettes.Сирень, material: 'glass', shade: 42, blur: 26, contrast: 85, radius: 26, dim: 30, wallpaperBlur: 0, match: true, width: 620 };
const materials = { glass: 'Стекло', solid: 'Матовый', outline: 'Контур' };
const fields = [
  ['bg', 'Фон'], ['accent', 'Акцент'], ['text', 'Текст'],
  ['contrast', 'Контраст вторичного текста', 40, 100, '%'],
  ['shade', 'Затемнение стекла', 0, 100, '%', true],
  ['blur', 'Размытие стекла', 0, 60, 'px', true],
  ['wallpaperBlur', 'Размытие обоев', 0, 40, 'px', false, true],
  ['dim', 'Затемнение картинки', 0, 100, '%', false, true],
  ['width', 'Ширина островка', 320, 1100, 'px'],
  ['radius', 'Скругление', 0, 40, 'px']
];
let theme = { ...defaults };
let links = [{ title: 'YouTube', url: 'https://www.youtube.com/' }, { title: 'GitHub', url: 'https://github.com/' }];
let wallpaper = null;
let replaceNewTab = false;
let activeIndex = -1;
let pending = {};
let saving = false;
async function save(patch) {
  Object.assign(pending, patch);
  if (saving) return;
  saving = true;
  while (Object.keys(pending).length) {
    const batch = pending;
    pending = {};
    try {
      await api.storage.local.set(batch);
      get('status').textContent = '';
    } catch {
      get('status').textContent = t('Не удалось сохранить изменения.');
    }
  }
  saving = false;
}
function choose(container, label, action) {
  const button = document.createElement('button');
  button.textContent = t(label);
  button.addEventListener('click', action);
  get(container).append(button);
  return button;
}
const paletteButtons = Object.entries(palettes).map(([label, colors]) => [
  colors, choose('presets', label, () => change(colors))
]);
const materialButtons = Object.entries(materials).map(([value, label]) => [
  value, choose('materials', label, () => change({ material: value }))
]);
const controls = fields.map(([key, title, min, max, unit, glass, photo]) => {
  const row = document.createElement('label');
  row.className = unit ? 'control range' : 'control';
  row.append(t(title));
  const input = document.createElement('input');
  const output = document.createElement('span');
  if (unit) {
    input.type = 'range';
    input.min = min;
    input.max = max;
    output.setAttribute('aria-hidden', 'true');
    row.append(output);
  } else {
    input.type = 'color';
  }
  input.setAttribute('aria-label', t(title));
  input.addEventListener('input', () => change({ [key]: unit ? Number(input.value) : input.value }));
  row.append(input);
  get('controls').append(row);
  return { key, input, output, row, unit, glass, photo };
});
function apply() {
  const style = document.documentElement.style;
  for (const key of ['bg', 'accent', 'text']) style.setProperty('--' + key, theme[key]);
  style.setProperty('--shade', theme.shade + '%');
  style.setProperty('--blur', theme.blur + 'px');
  style.setProperty('--island-width', theme.width + 'px');
  style.setProperty('--radius', theme.radius + 'px');
  style.setProperty('--muted', theme.contrast + '%');
  style.setProperty('--panel', 'color-mix(in srgb,' + theme.bg + ' 88%, ' + theme.accent + ')');
  style.setProperty('--wallpaper', wallpaper ? 'url("' + wallpaper.image + '")' : 'none');
  style.setProperty('--wall-blur', theme.wallpaperBlur + 'px');
  style.setProperty('--wall-dim', theme.dim + '%');
  style.setProperty('--glass-tint', wallpaper && theme.match ? wallpaper.tint : '#070710');
  if (wallpaper && theme.match) {
    style.setProperty('--panel', 'color-mix(in srgb,' + wallpaper.tint + ' 75%, #101018)');
  }
  document.body.classList.toggle('has-wallpaper', Boolean(wallpaper));
  get('wall-options').hidden = !wallpaper;
  get('wall-match').checked = theme.match;
  document.body.dataset.material = theme.material;
  for (const { key, input, output, row, unit, glass, photo } of controls) {
    input.value = theme[key];
    if (unit) output.textContent = theme[key] + ' ' + unit;
    row.hidden = Boolean((glass && theme.material !== 'glass') || (photo && !wallpaper));
  }
  for (const [colors, button] of paletteButtons) {
    button.setAttribute('aria-pressed', Object.keys(colors).every(key => colors[key] === theme[key]));
  }
  for (const [value, button] of materialButtons) button.setAttribute('aria-pressed', value === theme.material);
}
function change(patch) {
  theme = { ...theme, ...patch };
  apply();
  save({ theme });
}
function moveLink(from, to) {
  if (from === to || !links[from] || !links[to]) return;
  const reordered = [...links];
  const [link] = reordered.splice(from, 1);
  reordered.splice(to, 0, link);
  links = reordered;
  renderLinks();
  save({ links });
  const tile = get('links').children[to];
  const focusTarget = matchMedia('(pointer: coarse)').matches
    ? [...tile.querySelectorAll('.move')].find(button => !button.disabled)
    : tile.querySelector('.grip');
  focusTarget?.focus();
}
let draggedLink = null;
function renderLinks() {
  get('links').replaceChildren();
  links.forEach(({ title, url }, index) => {
    const tile = document.createElement('div');
    tile.className = 'tile';
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.textContent = title;
    const edit = document.createElement('button');
    edit.textContent = '⋯';
    edit.setAttribute('aria-label', t('Изменить ссылку') + ' «' + title + '»');
    edit.addEventListener('click', () => openEditor(index));
    const grip = document.createElement('button');
    grip.className = 'grip';
    grip.textContent = '⠿';
    grip.title = t('Перетащи или используй клавиши со стрелками');
    grip.setAttribute('aria-label', t('Переместить') + ' «' + title + '»');
    grip.draggable = true;
    grip.ondragstart = event => {
      draggedLink = index;
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', title);
    };
    grip.ondragend = () => { draggedLink = null; };
    grip.onkeydown = event => {
      const direction = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[event.key];
      if (!direction) return;
      event.preventDefault();
      moveLink(index, index + direction);
    };
    const moves = document.createElement('span');
    moves.className = 'moves';
    const left = document.createElement('button');
    left.className = 'move';
    left.textContent = '←';
    left.disabled = index === 0;
    left.setAttribute('aria-label', t('Переместить влево') + ' «' + title + '»');
    left.addEventListener('click', () => moveLink(index, index - 1));
    const right = document.createElement('button');
    right.className = 'move';
    right.textContent = '→';
    right.disabled = index === links.length - 1;
    right.setAttribute('aria-label', t('Переместить вправо') + ' «' + title + '»');
    right.addEventListener('click', () => moveLink(index, index + 1));
    moves.append(left, right);
    tile.ondragover = event => {
      if (draggedLink === null) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
    };
    tile.ondrop = event => {
      if (draggedLink === null) return;
      event.preventDefault();
      const from = draggedLink;
      draggedLink = null;
      moveLink(from, index);
    };
    tile.append(grip, anchor, edit, moves);
    get('links').append(tile);
  });
}
const editor = get('editor');
const linkForm = get('link-form');
function openEditor(index) {
  activeIndex = index;
  const link = links[index];
  linkForm.elements.title.value = link?.title ?? '';
  linkForm.elements.url.value = link?.url ?? '';
  get('remove').hidden = index < 0;
  get('link-error').textContent = '';
  editor.showModal();
  linkForm.elements.title.focus();
}
function updateLinks(next) {
  links = next;
  editor.close();
  renderLinks();
  save({ links });
}
get('add').onclick = () => openEditor(-1);
get('cancel').onclick = () => editor.close();
get('remove').onclick = () => updateLinks(links.filter((_, index) => index !== activeIndex));
linkForm.onsubmit = event => {
  event.preventDefault();
  const title = linkForm.elements.title.value.trim();
  const address = linkForm.elements.url.value.trim();
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(address) ? address : 'https://' + address);
    if (!title || !['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error();
    const next = [...links];
    next[activeIndex < 0 ? next.length : activeIndex] = { title, url: url.href };
    updateLinks(next);
  } catch {
    get('link-error').textContent = t('Введите название и корректный адрес сайта.');
  }
};
function toggleStudio(open) {
  get('studio').hidden = !open;
  get('open').setAttribute('aria-expanded', open);
  document.body.classList.toggle('studio-open', open);
  get(open ? 'close' : 'open').focus();
}
get('open').onclick = () => toggleStudio(get('studio').hidden);
get('close').onclick = () => toggleStudio(false);
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !editor.open && !get('studio').hidden) toggleStudio(false);
});
get('reset').onclick = () => change(defaults);
get('search').onsubmit = event => {
  event.preventDefault();
  const query = event.currentTarget.elements.q.value.trim();
  if (query) location.assign('https://search.brave.com/search?q=' + encodeURIComponent(query));
};
const timeFormat = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' });
const dateFormat = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' });
function tick() {
  const now = new Date();
  get('clock').textContent = timeFormat.format(now);
  get('date').textContent = dateFormat.format(now);
}
tick();
setInterval(tick, 1000);
get('wall-match').onchange = event => change({ match: event.target.checked });
get('wall-remove').onclick = () => {
  wallpaper = null;
  apply();
  save({ wallpaper });
};
get('wall-file').onchange = event => setWallpaper(event.currentTarget.files[0]);
document.addEventListener('paste', event => {
  if (get('studio').hidden || editor.open) return;
  const file = Array.from(event.clipboardData?.files ?? []).find(file => file.type.startsWith('image/'));
  if (!file) {
    if (event.target === get('wall-paste')) {
      get('status').textContent = t('Скопируй само изображение или выбери фото с диска.');
    }
    return;
  }
  event.preventDefault();
  setWallpaper(file);
});
async function setWallpaper(file) {
  const input = get('wall-file');
  if (!file || input.disabled) return;
  input.disabled = true;
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = objectUrl;
    await image.decode();
    const canvas = document.createElement('canvas');
    const maxSide = isAndroid ? 1920 : 2560;
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d', { alpha: false });
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const encoded = canvas.toDataURL('image/jpeg', 0.86);

    canvas.width = 12;
    canvas.height = 12;
    context.drawImage(image, 0, 0, 12, 12);
    const pixels = context.getImageData(0, 0, 12, 12).data;
    const totals = [0, 0, 0];
    let totalWeight = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      const rgb = [pixels[i], pixels[i + 1], pixels[i + 2]];
      const weight = 20 + Math.max(...rgb) - Math.min(...rgb);
      rgb.forEach((channel, index) => { totals[index] += channel * weight; });
      totalWeight += weight;
    }
    const tint = 'rgb(' + totals.map(sum => Math.round(sum / totalWeight * 0.48 + 9)).join(', ') + ')';
    wallpaper = { image: encoded, tint };
    apply();
    save({ wallpaper });
  } catch {
    get('status').textContent = t('Не удалось открыть картинку. Попробуй JPG, PNG или WebP.');
  } finally {
    URL.revokeObjectURL(objectUrl);
    input.value = '';
    input.disabled = false;
  }
}
get('replace-newtab').onchange = async event => {
  const checkbox = event.target;
  const status = get('status');
  status.textContent = '';
  if (checkbox.checked) {
    try {
      const granted = await api.permissions.request({ permissions: ['tabs'] });
      if (!granted) {
        checkbox.checked = false;
        status.textContent = t('Нужно разрешение на доступ к вкладкам.');
        return;
      }
      replaceNewTab = true;
      await api.storage.local.set({ replaceNewTab: true });
    } catch {
      checkbox.checked = false;
      status.textContent = t('Не удалось включить открытие на новых вкладках.');
    }
  } else {
    replaceNewTab = false;
    try {
      await api.storage.local.set({ replaceNewTab: false });
      await api.permissions.remove({ permissions: ['tabs'] }).catch(() => {});
    } catch {
      status.textContent = t('Не удалось сохранить изменения.');
    }
  }
};
async function start() {
  try {
    const stored = await api.storage.local.get(['theme', 'links', 'wallpaper', 'replaceNewTab']);
    theme = { ...defaults, ...stored.theme };
    links = stored.links ?? links;
    wallpaper = stored.wallpaper ?? null;
    replaceNewTab = Boolean(stored.replaceNewTab);
  } catch {
    get('status').textContent = t('Не удалось загрузить настройки.');
  }
  apply();
  renderLinks();
  if (isAndroid) {
    get('wall-paste').hidden = true;
    get('newtab-title').hidden = false;
    get('newtab-row').hidden = false;
    const allowed = await api.permissions.contains({ permissions: ['tabs'] }).catch(() => false);
    get('replace-newtab').checked = replaceNewTab && allowed;
  }
}
start();

})();

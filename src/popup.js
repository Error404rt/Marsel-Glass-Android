(async () => {
const api = globalThis.browser ?? globalThis.chrome;
const { t } = await localize();
const button = document.getElementById('toggle');
const note = document.getElementById('note');
const dashboard = document.getElementById('open-dashboard');

dashboard.onclick = () => {
  api.tabs.create({ url: api.runtime.getURL('index.html') }).catch(() => {
    note.textContent = t('Не удалось открыть Maarrsel.');
  });
};

async function start() {
  const globalButton = document.getElementById('global');
  const allSites = ['http://*/*', 'https://*/*'];
  let globalMode = Boolean((await api.storage.local.get('allSites')).allSites);
  function renderGlobal() {
    globalButton.textContent = globalMode ? t('Выключить на всех сайтах') : t('Включить на всех сайтах');
    globalButton.disabled = false;
  }
  renderGlobal();
  globalButton.onclick = async () => {
    globalButton.disabled = true;
    note.textContent = '';
    try {
      if (globalMode) {
        await api.storage.local.set({ allSites: false });
        await api.scripting.unregisterContentScripts({ ids: ['all-sites'] }).catch(() => {});
      } else {
        if (!await api.permissions.request({ origins: allSites })) {
          note.textContent = t('Нужно разрешение на оформление сайтов.');
          return;
        }
        const existing = await api.scripting.getRegisteredContentScripts({ ids: ['all-sites'] }).catch(() => []);
        if (!existing.length) {
          await api.scripting.registerContentScripts([{
            id: 'all-sites',
            matches: allSites,
            js: ['site.js'],
            css: ['site.css'],
            persistAcrossSessions: true
          }]);
        }
        await api.storage.local.set({ allSites: true });
      }
      globalMode = !globalMode;
      location.reload();
    } catch {
      note.textContent = t('Не удалось переключить общий режим.');
    } finally {
      renderGlobal();
    }
  };
  const [tab] = await api.tabs.query({ active: true, currentWindow: true });
  const url = new URL(tab?.url ?? 'about:blank');
  if (!['http:', 'https:'].includes(url.protocol)) {
    note.textContent = t('Доступно на обычных сайтах.');
    return;
  }
  document.getElementById('host').textContent = url.host;
  const match = url.protocol + '//' + url.hostname + '/*';
  const id = 'site-' + Array.from(match, char => char.charCodeAt(0).toString(16)).join('');
  const key = 'maarrsel:' + match;
  const preference = (await api.storage.local.get(key))[key];
  let enabled = preference ?? globalMode;
  async function applyToTab() {
    try {
      await api.scripting.insertCSS({ target: { tabId: tab.id }, files: ['site.css'] });
      await api.scripting.executeScript({ target: { tabId: tab.id }, files: ['site.js'] });
    } catch {
      note.textContent = t('Обнови страницу. На защищённых страницах оформление недоступно.');
    }
  }
  if (enabled && globalMode) await applyToTab();
  function render() {
    button.textContent = enabled ? t('Выключить стекло') : t('Включить стекло');
    button.disabled = false;
  }
  render();
  button.onclick = async () => {
    button.disabled = true;
    note.textContent = '';
    try {
      if (enabled) {
        await api.storage.local.set({ [key]: false });
        await api.scripting.unregisterContentScripts({ ids: [id] }).catch(() => {});
        enabled = false;
      } else {
        if (!await api.permissions.request({ origins: [match] })) {
          note.textContent = t('Браузер не получил разрешение на этот сайт.');
          return;
        }
        const scripts = await api.scripting.getRegisteredContentScripts({ ids: [id] });
        if (!scripts.length) {
          await api.scripting.registerContentScripts([{
            id,
            matches: [match],
            js: ['site.js'],
            css: ['site.css'],
            persistAcrossSessions: true
          }]);
        }
        await api.storage.local.set({ [key]: true });
        enabled = true;
        await applyToTab();
      }
    } catch {
      note.textContent = t('Не удалось изменить оформление сайта.');
    } finally {
      render();
    }
  };
}
start().catch(() => { note.textContent = t('Не удалось открыть настройки сайта.'); });

})();

const api = globalThis.browser ?? globalThis.chrome;
const ALL_ORIGINS = ['http://*/*', 'https://*/*'];
const SITE_PREFIX = 'maarrsel:';
const SCRIPT_PREFIX = 'site-';
const NEW_TAB_URLS = new Set(['about:newtab', 'about:home']);

function siteId(match) {
  return SCRIPT_PREFIX + Array.from(match, char => char.charCodeAt(0).toString(16)).join('');
}

async function hasOrigins(origins) {
  try {
    return await api.permissions.contains({ origins });
  } catch {
    return false;
  }
}

async function register(id, matches) {
  try {
    const registered = await api.scripting.getRegisteredContentScripts({ ids: [id] });
    if (registered.length) return;
    await api.scripting.registerContentScripts([{
      id,
      matches,
      js: ['site.js'],
      css: ['site.css'],
      persistAcrossSessions: true
    }]);
  } catch {}
}

async function unregister(ids) {
  if (!ids.length) return;
  try {
    await api.scripting.unregisterContentScripts({ ids });
  } catch {}
}

async function syncScripts() {
  let stored = {};
  try {
    stored = await api.storage.local.get(null);
  } catch {
    return;
  }

  const activeIds = new Set();

  if (stored.allSites && await hasOrigins(ALL_ORIGINS)) {
    await register('all-sites', ALL_ORIGINS);
    activeIds.add('all-sites');
  } else {
    await unregister(['all-sites']);
  }

  for (const [key, value] of Object.entries(stored)) {
    if (!key.startsWith(SITE_PREFIX)) continue;
    const match = key.slice(SITE_PREFIX.length);
    const id = siteId(match);
    if (value && await hasOrigins([match])) {
      await register(id, [match]);
      activeIds.add(id);
    } else {
      await unregister([id]);
    }
  }

  try {
    const registered = await api.scripting.getRegisteredContentScripts();
    const stale = registered
      .map(script => script.id)
      .filter(id => id !== 'all-sites' && id.startsWith(SCRIPT_PREFIX) && !activeIds.has(id));
    await unregister(stale);
  } catch {}
}

async function isAndroid() {
  try {
    return (await api.runtime.getPlatformInfo()).os === 'android';
  } catch {
    return false;
  }
}

async function maybeReplaceNewTab(tab) {
  const { replaceNewTab } = await api.storage.local.get('replaceNewTab');
  if (!replaceNewTab || tab.openerTabId) return;
  if (!await isAndroid()) return;

  const allowed = await api.permissions.contains({ permissions: ['tabs'] }).catch(() => false);
  if (!allowed) return;

  const url = tab.pendingUrl || tab.url || '';
  if (!NEW_TAB_URLS.has(url)) return;

  await api.tabs.update(tab.id, { url: api.runtime.getURL('index.html') });
}

api.tabs.onCreated.addListener(tab => {
  maybeReplaceNewTab(tab).catch(() => {});
});

api.runtime.onInstalled.addListener(() => {
  syncScripts().catch(() => {});
});

api.runtime.onStartup.addListener(() => {
  syncScripts().catch(() => {});
});

if (api.permissions.onAdded) {
  api.permissions.onAdded.addListener(() => {
    syncScripts().catch(() => {});
  });
}

if (api.permissions.onRemoved) {
  api.permissions.onRemoved.addListener(() => {
    syncScripts().catch(() => {});
  });
}

api.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  const relevant = changes.allSites || Object.keys(changes).some(key => key.startsWith(SITE_PREFIX));
  if (relevant) syncScripts().catch(() => {});
});

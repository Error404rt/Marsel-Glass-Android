const api = globalThis.browser ?? globalThis.chrome;

const english = new Map([
  ['◐ Настроить', '◐ Customize'],
  ['ТВОЁ ПРОСТРАНСТВО', 'YOUR SPACE'],
  ['Быстрый запуск', 'Quick launch'],
  ['Поисковый запрос', 'Search query'],
  ['Поиск в Brave', 'Search Brave'],
  ['Найти', 'Search'],
  ['БЫСТРЫЙ ДОСТУП', 'QUICK LINKS'],
  ['＋ Добавить', '＋ Add'],
  ['Maarrsel / НОВАЯ ВКЛАДКА', 'Maarrsel / NEW TAB'],
  ['Настройки внешнего вида', 'Appearance settings'],
  ['Внешний вид', 'Appearance'],
  ['Закрыть настройки', 'Close settings'],
  ['Язык', 'Language'],
  ['ПАЛИТРА', 'PALETTE'],
  ['МАТЕРИАЛ', 'MATERIAL'],
  ['ОБОИ', 'WALLPAPER'],
  ['Выбрать фото', 'Choose a photo'],
  ['Скопируй фото, затем нажми сюда и вставь через', 'Copy a photo, click here, then press'],
  ['Подстроить панели под фон', 'Match panels to the wallpaper'],
  ['Убрать картинку', 'Remove photo'],
  ['Сбросить оформление', 'Reset appearance'],
  ['Быстрая ссылка', 'Quick link'],
  ['Название', 'Name'],
  ['Адрес', 'URL'],
  ['Удалить', 'Delete'],
  ['Отмена', 'Cancel'],
  ['Сохранить', 'Save'],
  ['Сирень', 'Lilac'], ['Лагуна', 'Lagoon'], ['Закат', 'Sunset'], ['Графит', 'Graphite'],
  ['Стекло', 'Glass'], ['Матовый', 'Matte'], ['Контур', 'Outline'],
  ['Фон', 'Background'], ['Акцент', 'Accent'], ['Текст', 'Text'],
  ['Контраст вторичного текста', 'Secondary text contrast'],
  ['Затемнение стекла', 'Glass darkness'],
  ['Размытие стекла', 'Glass blur'],
  ['Размытие обоев', 'Wallpaper blur'],
  ['Затемнение картинки', 'Photo darkness'],
  ['Ширина островка', 'Panel width'],
  ['Скругление', 'Corner radius'],
  ['Не удалось сохранить изменения.', 'Could not save your changes.'],
  ['Изменить ссылку', 'Edit link'],
  ['Перетащи или используй клавиши со стрелками', 'Drag or use the arrow keys'],
  ['Переместить', 'Move'],
  ['Переместить влево', 'Move left'],
  ['Переместить вправо', 'Move right'],
  ['Введите название и корректный адрес сайта.', 'Enter a name and a valid website address.'],
  ['Скопируй само изображение или выбери фото с диска.', 'Copy the image itself or choose a photo from your device.'],
  ['Не удалось открыть картинку. Попробуй JPG, PNG или WebP.', 'Could not open the image. Try JPG, PNG or WebP.'],
  ['Не удалось загрузить настройки.', 'Could not load settings.'],
  ['Стекло на этом сайте', 'Glass on this site'],
  ['Включить на всех сайтах', 'Enable on all sites'],
  ['Выключить на всех сайтах', 'Disable on all sites'],
  ['Нужно разрешение на оформление сайтов.', 'Permission is required to style websites.'],
  ['Не удалось переключить общий режим.', 'Could not change the all-sites setting.'],
  ['Доступно на обычных сайтах.', 'Available on regular websites.'],
  ['Обнови страницу. На защищённых страницах оформление недоступно.', 'Reload the page. Protected pages cannot be styled.'],
  ['Выключить стекло', 'Disable glass'],
  ['Включить стекло', 'Enable glass'],
  ['Браузер не получил разрешение на этот сайт.', 'The browser was not granted permission for this site.'],
  ['Не удалось изменить оформление сайта.', 'Could not change the site appearance.'],
  ['Не удалось открыть настройки сайта.', 'Could not open site settings.'],
  ['Не удалось сохранить язык.', 'Could not save the language.'],
  ['Открыть Maarrsel', 'Open Maarrsel'],
  ['Не удалось открыть Maarrsel.', 'Could not open Maarrsel.'],
  ['НОВАЯ ВКЛАДКА', 'NEW TAB'],
  ['Открывать Maarrsel на новых вкладках', 'Open Maarrsel in new tabs'],
  ['Нужно разрешение на доступ к вкладкам.', 'Permission to access tabs is required.'],
  ['Не удалось включить открытие на новых вкладках.', 'Could not enable new tab replacement.']
]);

async function localize() {
  const { language } = await api.storage.local.get('language').catch(() => ({}));
  const locale = language === 'ru' ? 'ru' : 'en';
  const t = value => locale === 'en' ? english.get(value) ?? value : value;
  document.documentElement.lang = locale;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const label = node.data.trim();
    if (label) node.data = node.data.replace(label, t(label));
  }
  for (const element of document.querySelectorAll('[aria-label], [placeholder]')) {
    for (const attribute of ['aria-label', 'placeholder']) {
      if (element.hasAttribute(attribute)) element.setAttribute(attribute, t(element.getAttribute(attribute)));
    }
  }
  return { locale, t };
}

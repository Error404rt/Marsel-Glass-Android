# Maarrsel Glass для Firefox на Android

[![Build](https://github.com/Error404rt/Marsel-Glass-Android/actions/workflows/build.yml/badge.svg)](https://github.com/Error404rt/Marsel-Glass-Android/actions/workflows/build.yml)

Неофициальный форк [maarrsel/Marsel-Glass](https://github.com/maarrsel/Marsel-Glass) (релиз 1.1), адаптированный под **Firefox для Android**.

Стеклянная новая вкладка и оформление сайтов: палитры, материалы, обои, быстрые ссылки, два языка (русский/английский), поиск в Brave. Все настройки хранятся локально в браузере.

![Превью](https://github.com/user-attachments/assets/a3a60fd7-8a39-4f15-b997-cc1a992ab2af)

## Что изменено в форке

- Манифест MV3 адаптирован под Firefox: `browser_specific_settings.gecko`, `data_collection_permissions: none`, `gecko_android`.
- Минимальная версия — Firefox 142 (десктоп и Android).
- **Новая вкладка на Android.** Firefox для Android не поддерживает `chrome_url_overrides.newtab`, поэтому:
  - в попапе расширения есть кнопка «Открыть Maarrsel»;
  - в настройках есть переключатель «Открывать Maarrsel на новых вкладках» — запрашивает разрешение `tabs` и включает эмуляцию через `tabs.onCreated`. По умолчанию выключен.
- Мобильный интерфейс: нижняя панель настроек, отступы под safe-area, крупные touch-кнопки, перемещение ссылок стрелками вместо drag-and-drop, скрыта вставка обоев из буфера (на Android работает выбор фото).
- Обои на телефоне ужимаются до 1920 px по длинной стороне, размытие ограничено для производительности.
- Для мобильного YouTube добавлены отдельные селекторы (`ytm-app`).
- GitHub Actions: lint + сборка на каждый push, подпись в AMO и релиз по тегу.

## Установка на Android

Firefox Release не устанавливает неподписанные расширения на постоянной основе, поэтому нужен **подписанный XPI**.

1. Скачай `.xpi` со страницы [Releases](https://github.com/Error404rt/Marsel-Glass-Android/releases).
2. В Firefox открой **Настройки → О Firefox** и быстро тапни по логотипу Firefox **5 раз** — появятся скрытые пункты.
3. Открой **Настройки → Установить расширение из файла** (Install Extension from File).
4. Выбери скачанный `.xpi` и подтверди установку.
5. Иконка Maarrsel появится в меню Firefox → Расширения.

Для разработки можно запускать без установки:

```bash
npm run start:android -- --android-device=<id>
```

Устройство должно быть подключено по USB с включённой отладкой (см. `adb devices`).

## Сборка

Нужен Node.js 20 или новее.

```bash
npm ci
npm run lint
npm run build
```

Готовый архив: `dist/maarrsel_glass-1.5.0.zip` (переименовывается в `.xpi` при релизе).

Другие команды:

```bash
npm start             # запуск в Firefox на компьютере
npm run start:android # запуск на подключённом Android-устройстве
```

## Подпись и релиз через GitHub Actions

1. Получи API-ключи на [addons.mozilla.org](https://addons.mozilla.org/developers/addon/api/key/).
2. В репозитории: **Settings → Secrets and variables → Actions** добавь секреты:
   - `AMO_JWT_ISSUER`
   - `AMO_JWT_SECRET`
3. Подними версию в `src/manifest.json` и `package.json`, закоммить и создай тег:

```bash
git tag v1.5.0
git push origin v1.5.0
```

Workflow соберёт расширение, подпишет его в AMO как unlisted и приложит подписанный XPI к GitHub Release.

Без секретов релиз всё равно соберётся, но XPI будет без подписи — на Android его можно поставить только временно через `web-ext`.

## Ограничения

- Переопределение новой вкладки в Firefox для Android отсутствует на уровне движка; эмуляция срабатывает только для вкладок, открытых без родительской вкладки, и только после выдачи разрешения `tabs`.
- На служебных страницах (`about:`, страницы AMO и т.п.) оформление сайтов недоступно.
- Оформление включается для каждого сайта отдельно (или сразу для всех) через попап расширения.
- Расширение не отправляет данные наружу; поиск открывает `search.brave.com` как обычную ссылку.

## Структура

```
src/
  manifest.json   манифест MV3 для Firefox
  background.js   регистрация стилей сайтов и эмуляция новой вкладки
  app.js          логика новой вкладки и настроек
  site.js         оформление сайтов
  popup.js        попап расширения
  i18n.js         русский/английский
  *.css, *.html   интерфейс
  icons/          иконки
.github/workflows/build.yml  CI: lint, build, sign, release
```

## Благодарности

Оригинальный проект и дизайн — [maarrsel](https://github.com/maarrsel/Marsel-Glass). Этот форк не связан с автором; все права на оригинальный код и оформление принадлежат ему. В оригинальном репозитории файл лицензии не указан.

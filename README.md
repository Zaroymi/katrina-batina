# Екатерина Батина — сайт свадебных коллекций

Публичная (статическая) версия сайта: коллекции 2025 «Цветущий сад» и 2026
«Зарождение света», аксессуары, условия покупки, контакты. Чистый HTML/CSS/JS,
сборка — Vite (минификация, хеширование ассетов, PostCSS + Autoprefixer).

Бэкенда нет: заявки с форм открывают готовое письмо (mailto) на почту дизайнера.

## Команды

```bash
npm install     # зависимости (только dev: vite, postcss, autoprefixer, sharp)
npm run dev     # dev-сервер http://127.0.0.1:5173
npm run build   # прод-сборка в dist/ (сначала генерируются страницы платьев)
npm run preview # локальный просмотр dist/
```

## Структура

```
index.html              главная
collections/<год>/      коллекции и страницы платьев (генерируются на сборке)
accessories/ terms/ contacts/
partials/               header/footer/модалка — инклюды на этапе сборки
src/styles/ src/js/     стили (tokens → base → components → pages) и логика
data/dresses.mjs        данные платьев (источник страниц)
scripts/make-dress-pages.mjs  генератор страниц платьев + sitemap.xml
public/images/photos/   оптимизированные фото
public/fonts/           самохостящиеся шрифты (PT Root UI, Princess Diana)
```

## Деплой на GitHub Pages

`.github/workflows/pages.yml` собирает и публикует сайт при каждом push в `main`.
Сайт живёт в подкаталоге `/<repo>/` — это учитывается автоматически:
workflow вычисляет `VITE_BASE_PATH`, а плагин в `vite.config.js` переписывает
пути от корня на base-префикс.

Однократное включение: Settings → Pages → Source: **GitHub Actions**.

### Кастомный домен (katrina-batina.ru)

Custom domain в Settings → Pages + A-записи апекса на GitHub
(185.199.108–111.153), `www` — CNAME на `<user>.github.io`; затем включить
Enforce HTTPS. Workflow сам видит включённый домен и собирает с `base: /`
(без домена — с base `/<repo>/`, зеркало на `github.io` продолжает работать
и после привязки редиректит на домен). После смены настроек Pages достаточно
запустить workflow ещё раз (push или Run workflow).

Проверить Pages-сборку локально:

```bash
VITE_BASE_PATH=<repo> npm run build && VITE_BASE_PATH=<repo> npm run preview
# http://127.0.0.1:4173/<repo>/
```

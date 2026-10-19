/**
 * Генерирует страницы платьев collections/<год>/<slug>/index.html
 * из data/dresses.mjs + обновляет public/sitemap.xml.
 *
 * Запуск: npm run pages (выполняется автоматически перед npm run build)
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { COLLECTIONS, DRESSES, dressPath, dressImages } from '../data/dresses.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const SITE = 'https://katrina-batina.ru' // TODO(запуск): реальный домен
const LASTMOD = '2026-07-25'

/* реальные фото (data/photos.json создаёт scripts/convert-photos.mjs);
   если фото для образа нет — остаются SVG-плейсхолдеры */
const manifestPath = root + 'data\\photos.json'
const photos = existsSync(manifestPath)
  ? JSON.parse(readFileSync(manifestPath, 'utf8'))
  : { dresses: {} }

const imagesFor = (d) => {
  const n = photos.dresses[d.slug]
  if (!n) return dressImages(d)
  const path = (num) => `/images/photos/${d.slug}/${String(num).padStart(2, '0')}.jpg`
  // photoOrder в data/dresses.mjs задаёт свой порядок кадров (номера файлов)
  if (d.photoOrder) return d.photoOrder.filter((num) => num >= 1 && num <= n).map(path)
  return Array.from({ length: n }, (_, i) => path(i + 1))
}
const thumbOf = (src) => (src.endsWith('.jpg') ? src.replace(/\.jpg$/, '-t.jpg') : src)

const fmtPrice = (p) => p.toLocaleString('ru-RU').replace(/ /g, ' ') + ' ₽'

async function dressHtml(d) {
  const col = COLLECTIONS[d.year]
  const url = `${SITE}/${dressPath(d)}`
  const images = imagesFor(d)

  // размеры главного фото для og:image — так Telegram/соцсети сразу показывают картинку
  let ogDims = ''
  if (images[0].endsWith('.jpg')) {
    try {
      const m = await sharp(root + 'public' + images[0].replace(/\//g, '\\')).metadata()
      ogDims = `  <meta property="og:image:width" content="${m.width}">
  <meta property="og:image:height" content="${m.height}">
  <meta property="og:image:type" content="image/jpeg">
`
    } catch (_) {}
  }
  const title = `${d.kind} «${d.name}» — коллекция «${col.name}» | Екатерина Батина`
  const metaDesc = `${d.kind} «${d.name}» из коллекции «${col.name}» Екатерины Батиной: ${d.construction.toLowerCase()}. ${
    d.available ? `Цена ${fmtPrice(d.price)}, в наличии.` : 'Сейчас нет в наличии.'
  } Оставьте заявку на сайте.`

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${d.kind} «${d.name}»`,
    description: d.construction,
    image: images.map((i) => SITE + i),
    brand: { '@type': 'Brand', name: 'Екатерина Батина' },
    offers: {
      '@type': 'Offer',
      price: String(d.price),
      priceCurrency: 'RUB',
      availability: d.available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url,
    },
  }
  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Главная', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: `Коллекция «${col.name}»`, item: `${SITE}/collections/${d.year}/` },
      { '@type': 'ListItem', position: 3, name: `«${d.name}»`, item: url },
    ],
  }

  const thumbs = images
    .map(
      (src, i) => `            <button class="gallery__thumb${i === 0 ? ' is-active' : ''}" type="button" data-gallery-thumb data-full="${src}">
              <span class="frame"><img src="${thumbOf(src)}" alt="${d.kind} «${d.name}» — фото ${i + 1}" loading="lazy"></span>
            </button>`,
    )
    .join('\n')

  const orderBlock = d.available
    ? `            <div class="dress-info__actions">
              <button class="btn btn--solid" type="button" data-order="${d.kind.toLowerCase()} «${d.name}» (коллекция «${col.name}»)">Оставить заявку</button>
            </div>`
    : `            <div class="dress-info__actions">
              <p class="dress-info__soldout">Сейчас нет в наличии — сошьём повтор по вашим меркам
                или подскажем похожие образы.</p>
              <button class="btn btn--solid" type="button" data-order="${d.kind.toLowerCase()} «${d.name}» (коллекция «${col.name}», повтор по меркам)">Заказать</button>
            </div>`

  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <meta name="description" content="${metaDesc}">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="product">
  <meta property="og:site_name" content="Екатерина Батина">
  <meta property="og:locale" content="ru_RU">
  <meta property="og:title" content="${d.kind} «${d.name}» — ${fmtPrice(d.price)}">
  <meta property="og:description" content="${d.construction}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${SITE}${images[0]}">
${ogDims}  <meta name="twitter:card" content="summary_large_image">
  <!-- @include:head -->
  <script type="application/ld+json">
${JSON.stringify(ld, null, 2)}
  </script>
  <script type="application/ld+json">
${JSON.stringify(breadcrumbs, null, 2)}
  </script>
</head>
<body>
  <!-- @include:header -->
  <main id="main">

    <div class="page-hero page-hero--dress">
      <div class="container">
        <p class="eyebrow"><a class="crumb" href="/collections/${d.year}/">${col.label.replace(' · новинка', '')} «${col.name}»</a></p>
      </div>
    </div>

    <section class="section" style="padding-top: 0" aria-label="${d.kind} «${d.name}»">
      <div class="container dress-layout">

        <div class="gallery reveal" data-gallery>
          <div class="gallery__main">
            <div class="frame">
              <img src="${images[0]}" alt="${d.kind} «${d.name}» — ${d.construction.toLowerCase()}" data-gallery-main data-lightbox-open fetchpriority="high">
            </div>
            <button class="gallery__nav gallery__nav--prev" type="button" data-gallery-prev aria-label="Предыдущее фото">&larr;</button>
            <button class="gallery__nav gallery__nav--next" type="button" data-gallery-next aria-label="Следующее фото">&rarr;</button>
          </div>
          <div class="gallery__thumbs">
${thumbs}
          </div>
        </div>

        <div class="dress-info reveal">
          <p class="eyebrow">${col.label}</p>
          <h1>«${d.name}»</h1>
          <p class="dress-info__price">${fmtPrice(d.price)}${d.available ? '' : ' · <span class="dress-info__soldout">нет в наличии</span>'}</p>
          <dl class="dress-info__meta">
            <div><dt>Из чего состоит</dt><dd>${d.construction}</dd></div>
${d.sizes ? `            <div><dt>В наличии</dt><dd>${d.sizes} размер</dd></div>\n` : ''}            <div><dt>Резерв</dt><dd>до 3 дней</dd></div>
            <div><dt>Доставка</dt><dd>СДЭК, Яндекс.Доставка — по всей России и миру</dd></div>
          </dl>
          <div class="dress-info__desc">
${d.description.map((p) => `            <p>${p}</p>`).join('\n')}
          </div>
          <p class="dress-info__repeat">Возможен повтор по вашим меркам.</p>
${orderBlock}
          <p class="dress-info__back"><a class="link-more" href="/collections/${d.year}/">Вся коллекция «${col.name}»</a></p>
        </div>

      </div>
    </section>

    <section class="section cta-band">
      <div class="container reveal">
        <p class="eyebrow">Заявка</p>
        <h2>Понравился образ «${d.name}»?</h2>
        <div class="cta-band__actions">
          <button class="btn btn--light" type="button" data-order="${d.kind.toLowerCase()} «${d.name}» (коллекция «${col.name}»${d.available ? '' : ', повтор по меркам'})">Оставить заявку</button>
          <a class="btn btn--light" href="https://t.me/katrina_batina" target="_blank" rel="noopener">Написать в Telegram</a>
        </div>
      </div>
    </section>

  </main>
  <!-- @include:footer -->
  <!-- @include:order-modal -->

  <dialog class="lightbox" id="lightbox" aria-label="Просмотр фото">
    <button class="lightbox__close" type="button" data-lightbox-close aria-label="Закрыть">&times;</button>
    <button class="gallery__nav gallery__nav--prev" type="button" data-gallery-prev aria-label="Предыдущее фото">&larr;</button>
    <img src="${images[0]}" alt="">
    <button class="gallery__nav gallery__nav--next" type="button" data-gallery-next aria-label="Следующее фото">&rarr;</button>
  </dialog>
</body>
</html>
`
}

/* ---------- страницы ---------- */
for (const d of DRESSES) {
  const dir = root + dressPath(d).replace(/\//g, '\\')
  await mkdir(dir, { recursive: true })
  await writeFile(dir + 'index.html', await dressHtml(d))
}

/* ---------- sitemap ---------- */
const staticUrls = [
  ['', '1.0'],
  ['collections/2025/', '0.9'],
  ['collections/2026/', '0.9'],
  ['accessories/', '0.8'],
  ['terms/', '0.6'],
  ['contacts/', '0.7'],
]
const urls = [
  ...staticUrls,
  ...DRESSES.map((d) => [dressPath(d), '0.8']),
]
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    ([path, priority]) => `  <url>
    <loc>${SITE}/${path}</loc>
    <lastmod>${LASTMOD}</lastmod>
    <priority>${priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`
await writeFile(root + 'public\\sitemap.xml', sitemap)

console.log(`OK: ${DRESSES.length} страниц платьев + sitemap.xml (${urls.length} URL)`)

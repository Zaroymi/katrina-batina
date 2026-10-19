import { defineConfig } from 'vite'
import { resolve, dirname } from 'node:path'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { DRESSES, dressPath } from './data/dresses.mjs'

const root = dirname(fileURLToPath(import.meta.url))

// GitHub Pages живёт в подкаталоге https://<user>.github.io/<repo>/:
// VITE_BASE_PATH=/repo/ (см. .github/workflows/pages.yml), прод — по умолчанию '/'
// допустим ввод без крайних слешей ('repo') — нормализуем
let base = process.env.VITE_BASE_PATH || '/'
if (base !== '/') base = '/' + base.replace(/^\/+|\/+$/g, '') + '/'

/**
 * Простые серверо-независимые инклюды для MPA:
 * <!-- @include:header --> подставляет partials/header.html на этапе сборки.
 */
function htmlIncludes() {
  return {
    name: 'html-includes',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        return html.replace(/<!--\s*@include:([\w./-]+)\s*-->/g, (_, name) =>
          readFileSync(resolve(root, 'partials', `${name}.html`), 'utf8'),
        )
      },
    },
    configureServer(server) {
      server.watcher.add(resolve(root, 'partials'))
      server.watcher.on('change', (file) => {
        if (file.replace(/\\/g, '/').includes('/partials/')) {
          server.ws.send({ type: 'full-reload' })
        }
      })
    },
  }
}

/**
 * При base != '/' (GitHub Pages) переписывает в собранных HTML все пути от
 * корня (/collections/…, /fonts/…) на base-префикс. Абсолютные URL (https://…,
 * //…) и якоря не трогает. Бандл-ассеты и url() в CSS Vite уже выводит с base —
 * для них стоит lookahead-исключение (иначе получили бы двойной префикс).
 */
function rootRelativeUrlsToBase() {
  const attrs = '(?:href|src|poster|data-full)'
  const skip = base.replace(/^\//, '') // 'repo/' — уже переписанные пути
  const rx = new RegExp(`(${attrs})="\\/(?!\\/)(?!${skip})`, 'g')
  return {
    name: 'root-relative-urls-to-base',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        return html.replace(rx, (_m, attr) => `${attr}="${base}`)
      },
    },
  }
}

export default defineConfig({
  appType: 'mpa',
  base,
  plugins: [htmlIncludes(), ...(base !== '/' ? [rootRelativeUrlsToBase()] : [])],
  server: {
    // явный IPv4-loopback: на Windows «localhost» иногда резолвится только в ::1,
    // и браузер/утилиты, идущие на 127.0.0.1, не находят сервер
    host: '127.0.0.1',
    // если рядом поднят бэкенд заявок (не входит в статическую версию)
    proxy: {
      '/api': 'http://127.0.0.1:8787',
    },
  },
  build: {
    // широкая поддержка устройств: iOS/Safari 12+, Chrome/Android от 2018 года
    target: ['es2018', 'safari12'],
    rollupOptions: {
      input: {
        index: resolve(root, 'index.html'),
        'collection-2025': resolve(root, 'collections/2025/index.html'),
        'collection-2026': resolve(root, 'collections/2026/index.html'),
        accessories: resolve(root, 'accessories/index.html'),
        terms: resolve(root, 'terms/index.html'),
        contacts: resolve(root, 'contacts/index.html'),
        // страницы платьев — генерируются scripts/make-dress-pages.mjs
        ...Object.fromEntries(
          DRESSES.map((d) => [`dress-${d.slug}`, resolve(root, dressPath(d), 'index.html')]),
        ),
      },
    },
  },
})

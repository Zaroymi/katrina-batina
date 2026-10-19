import '../styles/main.css'

// эндпоинт бэкенда заявок (если задеплоен; в статической версии не используется)
const LEAD_ENDPOINT = '/api/lead'

// GitHub Pages: бэкенда нет — заявку оформляем письмом (mailto) дизайнеру
const STATIC_LEADS = /\.github\.io$/.test(location.hostname)
const LEAD_EMAIL = 'arustamova_k@bk.ru'

const doc = document
doc.documentElement.classList.add('js')

/* ---------- Шапка: линия при скролле ---------- */
const header = doc.querySelector('[data-header]')
if (header) {
  const onScroll = () => header.classList.toggle('is-scrolled', window.pageYOffset > 8)
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
}

/* ---------- Мобильное меню ---------- */
const burger = doc.querySelector('[data-burger]')

function closeNav() {
  doc.body.classList.remove('nav-open')
  if (burger) burger.setAttribute('aria-expanded', 'false')
}

if (burger) {
  burger.addEventListener('click', () => {
    const open = doc.body.classList.toggle('nav-open')
    burger.setAttribute('aria-expanded', String(open))
  })
  doc.querySelectorAll('.site-nav a').forEach((a) => a.addEventListener('click', closeNav))
}

/* ---------- Активный пункт меню ---------- */
// сравнение с базой не нужно: pathname ссылок после сборки включает base,
// как и location.pathname — достаточно точного совпадения (работает и для главной)
const here = location.pathname.replace(/index\.html$/, '')
doc.querySelectorAll('.site-nav a, .site-footer nav a').forEach((a) => {
  if (a.pathname.replace(/index\.html$/, '') === here) {
    a.setAttribute('aria-current', 'page')
  }
})

/* ---------- Появление при скролле ---------- */
doc.querySelectorAll('[data-stagger]').forEach((group) => {
  Array.prototype.forEach.call(group.children, (child, i) => {
    child.classList.add('reveal')
    child.style.setProperty('--reveal-delay', Math.min(i * 90, 450) + 'ms')
  })
})

const reveals = doc.querySelectorAll('.reveal')
const reduceMotion =
  window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

if (!('IntersectionObserver' in window) || reduceMotion) {
  reveals.forEach((el) => el.classList.add('is-visible'))
} else {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          io.unobserve(entry.target)
        }
      })
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.1 },
  )
  reveals.forEach((el) => io.observe(el))
}

/* ---------- Модалка заказа ---------- */
const modal = doc.getElementById('order-modal')

function openModal() {
  if (!modal) return
  if (modal.showModal) modal.showModal()
  else modal.setAttribute('open', '') // фолбэк для браузеров без <dialog>
}

function closeModal() {
  if (!modal) return
  if (modal.close) modal.close()
  else modal.removeAttribute('open')
}

if (modal) {
  doc.addEventListener('click', (e) => {
    const trigger = e.target.closest && e.target.closest('[data-order]')
    if (!trigger) return
    const dress = trigger.getAttribute('data-order')
    const nameEl = modal.querySelector('[data-order-dress]')
    if (nameEl) nameEl.textContent = dress
    const form = modal.querySelector('[data-lead-form]')
    if (form) {
      if (form.elements.intro) form.elements.intro.value = 'Заказ: ' + dress
      resetLeadForm(form)
    }
    openModal()
  })

  modal.querySelectorAll('[data-order-close]').forEach((btn) =>
    btn.addEventListener('click', closeModal),
  )

  // клик по фону (нативный <dialog>: цель события — сам dialog)
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal()
  })

  // Esc для фолбэка без нативного <dialog>
  doc.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.close && modal.hasAttribute('open')) closeModal()
  })
}

/* ---------- Галерея платья + лайтбокс ---------- */
const gallery = doc.querySelector('[data-gallery]')
if (gallery) {
  const mainImg = gallery.querySelector('[data-gallery-main]')
  const thumbs = Array.prototype.slice.call(gallery.querySelectorAll('[data-gallery-thumb]'))
  const lightbox = doc.getElementById('lightbox')
  const lbImg = lightbox ? lightbox.querySelector('img') : null
  let current = 0

  function show(i) {
    current = (i + thumbs.length) % thumbs.length
    const thumb = thumbs[current]
    mainImg.src = thumb.getAttribute('data-full')
    mainImg.alt = thumb.querySelector('img').alt
    if (lbImg) {
      lbImg.src = mainImg.src
      lbImg.alt = mainImg.alt
    }
    thumbs.forEach((el, j) => el.classList.toggle('is-active', j === current))
  }

  thumbs.forEach((thumb, i) => thumb.addEventListener('click', () => show(i)))
  doc.querySelectorAll('[data-gallery-prev]').forEach((btn) =>
    btn.addEventListener('click', () => show(current - 1)),
  )
  doc.querySelectorAll('[data-gallery-next]').forEach((btn) =>
    btn.addEventListener('click', () => show(current + 1)),
  )

  if (lightbox) {
    const lbOpen = () => {
      show(current)
      if (lightbox.showModal) lightbox.showModal()
      else lightbox.setAttribute('open', '')
    }
    const lbClose = () => {
      if (lightbox.close) lightbox.close()
      else lightbox.removeAttribute('open')
    }
    const openTrigger = gallery.querySelector('[data-lightbox-open]')
    if (openTrigger) openTrigger.addEventListener('click', lbOpen)
    lightbox.querySelectorAll('[data-lightbox-close]').forEach((btn) =>
      btn.addEventListener('click', lbClose),
    )
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) lbClose()
    })
    doc.addEventListener('keydown', (e) => {
      if (!lightbox.hasAttribute('open')) return
      if (e.key === 'ArrowLeft') show(current - 1)
      if (e.key === 'ArrowRight') show(current + 1)
      if (e.key === 'Escape' && !lightbox.close) lbClose()
    })
  }
}

/* ---------- Формы заявок: POST в бот-нотификатор ---------- */
function resetLeadForm(form) {
  form.querySelectorAll('.field, .lead-form__actions, .lead-form__hint').forEach((el) => {
    el.hidden = false
  })
  form.querySelectorAll('.lead-form__done, .lead-form__error, .lead-form__invalid').forEach((el) => {
    el.hidden = true
  })
}

doc.querySelectorAll('[data-lead-form]').forEach((form) => {
  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const get = (name) => (form.elements[name] ? form.elements[name].value.trim() : '')
    const submitBtn = form.querySelector('[type="submit"]')
    const done = form.querySelector('.lead-form__done')
    const error = form.querySelector('.lead-form__error')
    const invalid = form.querySelector('.lead-form__invalid')
    if (error) error.hidden = true
    if (invalid) invalid.hidden = true

    const showDone = () => {
      form.querySelectorAll('.field, .lead-form__actions, .lead-form__hint').forEach((el) => {
        el.hidden = true
      })
      if (done) done.hidden = false
    }

    // ловушка для спам-ботов: люди это поле не видят и не заполняют
    if (get('company')) {
      showDone()
      return
    }

    const payload = {
      intro: get('intro'),
      contact: get('contact'),
      message: get('message'),
      page: location.pathname,
    }

    // контакт: телефон, e-mail или ник — минимум 5 символов
    if (payload.contact.length < 5) {
      if (invalid) invalid.hidden = false
      return
    }

    // GitHub Pages: открываем почтовую программу с готовым письмом-заявкой
    if (STATIC_LEADS) {
      const subject = 'Заявка с сайта — ' + (payload.intro || 'свадебное платье').replace(/^Заявка с сайта\.\s*/, '')
      const body = [
        payload.intro,
        'Контакт: ' + payload.contact,
        payload.message ? 'Комментарий: ' + payload.message : '',
        'Страница: ' + payload.page,
      ]
        .filter(Boolean)
        .join('\n')
      if (done) {
        done.textContent =
          'Открываем вашу почтовую программу — просто отправьте готовое письмо, ' +
          'и мы ответим в течение дня. Если письмо не открылось, напишите на ' +
          LEAD_EMAIL + ' или позвоните: +7 977 771-87-38.'
      }
      window.location.href =
        'mailto:' + LEAD_EMAIL +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body)
      showDone()
      return
    }

    if (submitBtn) {
      submitBtn.disabled = true
      submitBtn.textContent = 'Отправляем…'
    }

    try {
      const res = await fetch(LEAD_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.status === 400) {
        // сервер не принял данные (обычно неполный телефон)
        if (invalid) invalid.hidden = false
        return
      }
      if (!res.ok) throw new Error('HTTP ' + res.status)
      form.reset()
      showDone()
    } catch (_) {
      // сервер недоступен — предлагаем написать напрямую в Telegram
      if (error) error.hidden = false
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false
        submitBtn.textContent = 'Отправить заявку'
      }
    }
  })
})

/* ---------- Год в подвале ---------- */
doc.querySelectorAll('[data-year]').forEach((el) => {
  el.textContent = String(new Date().getFullYear())
})

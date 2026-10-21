// Every user-facing string lives here, in Latvian.

export const esc = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** Tagged template that escapes interpolations unless they are already-rendered html. */
class Raw { constructor(s) { this.s = s; } toString() { return this.s; } }
export const raw = (s) => new Raw(s);
const flat = (v) => (v == null || v === false ? '' : Array.isArray(v) ? v.map(flat).join('') : v instanceof Raw ? v.s : esc(v));
export const html = (strings, ...vals) => raw(strings.reduce((out, s, i) => out + s + (i < vals.length ? flat(vals[i]) : ''), ''));

// ── Dates ───────────────────────────────────────────────────────────────────

const WEEKDAYS = ['svētdien', 'pirmdien', 'otrdien', 'trešdien', 'ceturtdien', 'piektdien', 'sestdien'];
const MONTHS_IN = ['janvārī', 'februārī', 'martā', 'aprīlī', 'maijā', 'jūnijā', 'jūlijā', 'augustā', 'septembrī', 'oktobrī', 'novembrī', 'decembrī'];
const MONTHS_SHORT = ['jan', 'feb', 'mar', 'apr', 'mai', 'jūn', 'jūl', 'aug', 'sep', 'okt', 'nov', 'dec'];

const parts = (date) => date.split('-').map(Number);
const dayNumber = (date) => { const [y, m, d] = parts(date); return Date.UTC(y, m - 1, d) / 86400000; };
const cap = (s) => s[0].toLocaleUpperCase('lv') + s.slice(1);

function dayWord(date, today) {
  const diff = dayNumber(date) - dayNumber(today);
  if (diff === 0) return 'šodien';
  if (diff === 1) return 'rīt';
  const [y, m, d] = parts(date);
  return WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

/** "Rīt, 24. oktobrī · 18:00" */
export function whenLong(ev, today) {
  const [y, m, d] = parts(ev.date);
  const year = y !== parts(today)[0] ? ` ${y}. gada` : '';
  return `${cap(dayWord(ev.date, today))},${year} ${d}. ${MONTHS_IN[m - 1]}${ev.time ? ` · ${ev.time}` : ''}`;
}

/** "Sestdien · 18:00": list rows show the day and month in the date block. */
const whenShort = (ev, today) => cap(dayWord(ev.date, today)) + (ev.time ? ` · ${ev.time}` : '');

// ── Pieces ──────────────────────────────────────────────────────────────────

const icon = {
  pin: raw('<svg class="icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 15s5-4.6 5-8.5A5 5 0 0 0 3 6.5C3 10.4 8 15 8 15Zm0-6.5a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z" fill="currentColor"/></svg>'),
  yes: raw('<svg class="icon" viewBox="0 0 16 16" aria-hidden="true"><path d="m3 8.5 3.2 3L13 4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'),
  no: raw('<svg class="icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 8h8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'),
  bell: raw('<svg class="icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5a4.5 4.5 0 0 0-4.5 4.5v2.7L2 11h12l-1.5-2.3V6A4.5 4.5 0 0 0 8 1.5ZM6.2 12.5a1.9 1.9 0 0 0 3.6 0" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>'),
};

function status(ev) {
  const short = ev.min_yes - ev.yes;
  return short <= 0
    ? html`<span class="status is-ok">${icon.yes}Notiks</span>`
    : html`<span class="status">Trūkst vēl ${short}</span>`;
}

/**
 * The woven band: one unit per singer up to the minimum, filled as people say "Būšu".
 * Exact counts, never a percentage.
 */
/** "4 no 20" while short of the minimum, "7 būs" once it is reached. */
const count = (ev) => ev.yes >= ev.min_yes
  ? html`<b class="num">${ev.yes}</b> būs`
  : html`<b class="num">${ev.yes}</b> no ${ev.min_yes}`;

const UNITS_PER_ROW = 25;

function band(ev, { big = false } = {}) {
  // Long bands wrap into equal rows; the last row is padded so every unit keeps the same width.
  const rows = Math.ceil(ev.min_yes / UNITS_PER_ROW);
  const perRow = Math.ceil(ev.min_yes / rows);
  let weave = '';
  for (let r = 0; r < rows; r++) {
    let row = '';
    for (let i = r * perRow; i < (r + 1) * perRow; i++) {
      row += i >= ev.min_yes ? '<i class="pad"></i>' : i < ev.yes ? '<i class="on"></i>' : '<i></i>';
    }
    weave += `<div class="weave">${row}</div>`;
  }
  return html`
    <div class="band${big ? ' band-big' : ''}${ev.yes >= ev.min_yes ? ' is-full' : ''}">
      <div class="weaves" role="img" aria-label="Būs ${ev.yes} no vajadzīgajiem ${ev.min_yes}">${raw(weave)}</div>
      ${!big && html`
        <p class="band-text"><span>${count(ev)}</span> ${status(ev)}</p>`}
    </div>`;
}

function dateBlock(ev, today) {
  const [, m, d] = parts(ev.date);
  return html`<div class="dateblock${ev.date === today ? ' is-today' : ''}" aria-hidden="true"><b>${d}</b><span>${MONTHS_SHORT[m - 1]}</span></div>`;
}

function voteButtons(ev, mine, back, { big = false, withName = false } = {}) {
  return html`
    <form method="post" action="/p/${ev.id}/atbilde" class="vote${big ? ' vote-big' : ''}">
      <input type="hidden" name="back" value="${back}">
      ${withName && html`
        <label class="field">
          <span>Tavs vārds</span>
          <input name="name" required minlength="2" maxlength="60" autocomplete="name" placeholder="Vārds Uzvārds">
        </label>`}
      <div class="vote-buttons" role="group" aria-label="Vai būsi?">
        <button class="btn btn-yes" name="going" value="1" aria-pressed="${mine === 1}">${icon.yes}Būšu</button>
        <button class="btn btn-no" name="going" value="0" aria-pressed="${mine === 0}">${icon.no}Nebūšu</button>
      </div>
    </form>`;
}

const mark = (going) => going
  ? html`<span class="mark mark-yes">${icon.yes}Būšu</span>`
  : html`<span class="mark mark-no">${icon.no}Nebūšu</span>`;

function eventRow(ev, today, { vote = false, back = '/', actions = null } = {}) {
  return html`
    <li class="row" id="p-${ev.id}">
      ${dateBlock(ev, today)}
      <div class="row-main">
        <h3 class="row-title"><a href="/p/${ev.id}">${ev.title}</a></h3>
        <p class="meta">${whenShort(ev, today)}${ev.location && html`<span class="place">${icon.pin}${ev.location}</span>`}</p>
        ${band(ev)}
        ${vote && voteButtons(ev, ev.mine ?? null, back)}
        ${!vote && ev.mine != null && html`<p class="mine">${mark(ev.mine)} <a href="/p/${ev.id}">Mainīt</a></p>`}
        ${actions}
      </div>
    </li>`;
}

// ── Layout ──────────────────────────────────────────────────────────────────

export function layout({ title, choir, member, body, director = false, vapidKey = '' }) {
  return html`<!doctype html>
<html lang="lv">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${title ? `${title} · ${choir}` : choir}</title>
  <meta name="theme-color" content="#a01f1e" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#761617" media="(prefers-color-scheme: dark)">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="${choir}">
  <meta name="vapid-key" content="${vapidKey}">
  <link rel="manifest" href="/manifest.webmanifest">
  <link rel="icon" href="/icons/icon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
  <link rel="preload" href="/fonts/schibsted-grotesk-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/style.css">
  <script src="/app.js" defer></script>
</head>
<body>
  <header class="top">
    <div class="top-inner wrap">
      <a class="brand" href="/">${choir}</a>
      ${member && html`
        <form method="post" action="/cits" class="who">
          <span class="who-name">${member.name}</span>
          <button class="who-change" title="Ja šis neesi tu, ievadi savu vārdu">Cits vārds</button>
        </form>`}
    </div>
  </header>
  <main class="wrap">${body}</main>
  <footer class="foot wrap">
    ${director
      ? html`<form method="post" action="/vaditajs/iziet"><a href="/vaditajs">Diriģenta skats</a><span class="dot" aria-hidden="true"></span><button class="link">Iziet</button></form>`
      : html`<a href="/vaditajs">Diriģentam</a>`}
  </footer>
</body>
</html>`;
}

// ── Pages ───────────────────────────────────────────────────────────────────

export function nameForm({ error, value = '' } = {}) {
  return html`
    <section class="intro">
      <h1>Kā tevi sauc?</h1>
      <p class="lede">Ieraksti vārdu vienreiz, un nākamreiz tas jau būs atcerēts.</p>
      <form method="post" action="/vards" class="stack">
        <label class="field">
          <span>Vārds un uzvārds</span>
          <input name="name" required minlength="2" maxlength="60" autocomplete="name" autofocus value="${value}" placeholder="Anna Bērziņa"
            ${error && raw('aria-invalid="true" aria-describedby="name-err"')}>
          ${error && html`<small id="name-err" class="error">${error}</small>`}
        </label>
        <button class="btn btn-primary">Turpināt</button>
      </form>
    </section>`;
}

const notifyStrip = html`
  <aside class="notify" data-notify hidden>
    ${icon.bell}
    <div class="notify-body">
      <p data-notify-text>Saņem ziņu, kad parādās jauns pasākums.</p>
      <button type="button" class="btn btn-small" data-notify-on>Ieslēgt paziņojumus</button>
    </div>
  </aside>`;

export function home({ events, today }) {
  const open = events.filter((e) => e.mine == null);
  const done = events.filter((e) => e.mine != null);
  if (!events.length) {
    return html`
      <section class="empty">
        <h1>Pagaidām klusums</h1>
        <p class="lede">Nav neviena gaidāma pasākuma. Kad diriģents kādu izveidos, tas parādīsies šeit.</p>
      </section>
      ${notifyStrip}`;
  }
  return html`
    ${open.length
      ? html`
        <section>
          <h1>Gaida tavu atbildi <span class="count">${open.length}</span></h1>
          <ul class="rows">${open.map((e) => eventRow(e, today, { vote: true }))}</ul>
        </section>`
      : html`
        <section class="caught-up">
          <h1>Viss atbildēts</h1>
          <p class="lede">Paldies! Kad būs jauns pasākums, tas parādīsies šeit.</p>
        </section>`}
    ${notifyStrip}
    ${done.length > 0 && html`
      <section>
        <h2>Tavas atbildes</h2>
        <ul class="rows">${done.map((e) => eventRow(e, today))}</ul>
      </section>`}`;
}

export function eventPage({ ev, today, member, mine, answers, others, isPast }) {
  const yes = answers.filter((a) => a.going === 1);
  const no = answers.filter((a) => a.going === 0);
  const names = (list) => html`<ul class="names">${list.map((a) => html`<li>${a.name}</li>`)}</ul>`;
  const otherOpen = others.filter((e) => e.id !== ev.id && e.mine == null);

  return html`
    <article class="event">
      <h1>${ev.title}</h1>
      <p class="meta meta-big">${whenLong(ev, today)}${ev.location && html`<span class="place">${icon.pin}${ev.location}</span>`}</p>

      <div class="tally">
        <p class="tally-num">${count(ev)}</p>
        ${status(ev)}
      </div>
      ${band(ev, { big: true })}
      <p class="hint">${ev.yes >= ev.min_yes
        ? `Vajadzēja vismaz ${ev.min_yes}, un tik jau ir.`
        : `Notiks, ja pieteiksies vismaz ${ev.min_yes}.`}</p>

      ${isPast
        ? html`<p class="notice">Šis pasākums jau ir pagājis.</p>`
        : html`
          <h2 class="ask">${member ? 'Vai būsi?' : 'Vai būsi? Ieraksti vārdu un atbildi.'}</h2>
          ${voteButtons(ev, mine, `/p/${ev.id}`, { big: true, withName: !member })}`}

      ${answers.length > 0 && html`
        <div class="who-list">
          ${yes.length > 0 && html`<h3>Būs <span class="count">${yes.length}</span></h3>${names(yes)}`}
          ${no.length > 0 && html`<h3>Nebūs <span class="count">${no.length}</span></h3>${names(no)}`}
        </div>`}
    </article>

    ${member && notifyStrip}

    ${otherOpen.length > 0 && html`
      <section class="others">
        <h2>Vēl gaida tavu atbildi <span class="count">${otherOpen.length}</span></h2>
        <ul class="rows">${otherOpen.map((e) => eventRow(e, today, { vote: true, back: `/p/${ev.id}` }))}</ul>
      </section>`}

    ${member && html`<p class="back"><a href="/">Visi pasākumi</a></p>`}`;
}

export function notFound() {
  return html`
    <section class="empty">
      <h1>Pasākums nav atrasts</h1>
      <p class="lede">Iespējams, diriģents to ir izdzēsis vai saitē ir kļūda.</p>
      <p><a class="btn" href="/">Uz sākumu</a></p>
    </section>`;
}

// ── Director ────────────────────────────────────────────────────────────────

export function directorLogin({ error } = {}) {
  return html`
    <section class="intro">
      <h1>Diriģentam</h1>
      <p class="lede">Ievadi paroli, lai veidotu pasākumus.</p>
      <form method="post" action="/vaditajs/ieeja" class="stack">
        <label class="field">
          <span>Parole</span>
          <input name="password" type="password" required autocomplete="current-password" autofocus
            ${error && raw('aria-invalid="true" aria-describedby="pw-err"')}>
          ${error && html`<small id="pw-err" class="error">${error}</small>`}
        </label>
        <button class="btn btn-primary">Ieiet</button>
      </form>
    </section>`;
}

function eventForm({ action, values, error, submit, cancel }) {
  return html`
    <form method="post" action="${action}" class="stack event-form">
      ${error && html`<p class="error" role="alert">${error}</p>`}
      <label class="field">
        <span>Nosaukums</span>
        <input name="title" required maxlength="120" value="${values.title}" placeholder="Mēģinājums">
      </label>
      <div class="pair">
        <label class="field">
          <span>Datums</span>
          <input name="date" type="date" required value="${values.date}">
        </label>
        <label class="field">
          <span>Laiks <em>neobligāti</em></span>
          <input name="time" type="time" value="${values.time}">
        </label>
      </div>
      <label class="field">
        <span>Vieta <em>neobligāti</em></span>
        <input name="location" maxlength="120" value="${values.location}" placeholder="Kultūras nams, lielā zāle">
      </label>
      <label class="field">
        <span>Cik dziedātājiem jāpiesakās</span>
        <input name="min_yes" type="number" inputmode="numeric" min="1" max="500" required value="${values.min_yes}" class="short">
        <small>Pasākums notiks, ja vismaz tik cilvēku atbildēs „Būšu”.</small>
      </label>
      <div class="actions">
        <button class="btn btn-primary">${submit}</button>
        ${cancel && html`<a class="btn" href="${cancel}">Atcelt</a>`}
      </div>
    </form>`;
}

function shareBox(url, { field = true } = {}) {
  return html`
    <div class="share">
      ${field && html`<input class="share-url" value="${url}" readonly aria-label="Pasākuma saite">`}
      <button type="button" class="btn btn-small" data-copy="${url}">Kopēt saiti</button>
      <button type="button" class="btn btn-small" data-share="${url}" hidden>Dalīties</button>
    </div>`;
}

export function director({ upcoming, past, today, origin, created, reminded, values, error }) {
  const row = (e, isPast) => eventRow(e, today, {
    actions: html`
      <div class="row-actions">
        ${!isPast && shareBox(`${origin}/p/${e.id}`, { field: false })}
        ${!isPast && html`
          <form method="post" action="/vaditajs/p/${e.id}/atgadinat">
            <button class="link">${icon.bell}Atgādināt neatbildējušajiem</button>
          </form>`}
        <a href="/vaditajs/p/${e.id}">Labot</a>
        <form method="post" action="/vaditajs/p/${e.id}/dzest" data-confirm="Dzēst „${e.title}”? Pieteikušies saņems ziņu, ka pasākums atcelts.">
          <button class="link danger">Dzēst</button>
        </form>
      </div>`,
  });
  const fresh = created && upcoming.concat(past).find((e) => e.id === created);

  return html`
    ${fresh && html`
      <section class="flash" role="status">
        <h2>Pasākums izveidots</h2>
        <p>Nosūti šo saiti korim: WhatsApp grupā, e-pastā vai kur ierasts.</p>
        ${shareBox(`${origin}/p/${fresh.id}`)}
      </section>`}
    ${reminded && html`
      <section class="flash" role="status">
        <p>${reminded.count > 0
          ? `Atgādinājums nosūtīts: „${reminded.title}”. Saņēmēji: ${reminded.count}.`
          : `Neviens no neatbildējušajiem nav ieslēdzis paziņojumus. Nosūti saiti vēlreiz čatā.`}</p>
      </section>`}

    <section>
      <h1>Jauns pasākums</h1>
      ${eventForm({ action: '/vaditajs/pasakums', values, error, submit: 'Izveidot un saņemt saiti' })}
    </section>

    <section>
      <h2>Gaidāmie pasākumi <span class="count">${upcoming.length}</span></h2>
      ${upcoming.length
        ? html`<ul class="rows">${upcoming.map((e) => row(e, false))}</ul>`
        : html`<p class="muted">Vēl nav neviena. Izveido pirmo ar formu augstāk.</p>`}
    </section>

    ${past.length > 0 && html`
      <details class="past">
        <summary>Pagājušie pasākumi <span class="count">${past.length}</span></summary>
        <ul class="rows">${past.map((e) => row(e, true))}</ul>
      </details>`}`;
}

export function editEvent({ ev, values, error }) {
  return html`
    <section>
      <h1>Labot pasākumu</h1>
      <p class="lede">Pieteikušies saņems ziņu, ja mainīsies laiks vai vieta.</p>
      ${eventForm({ action: `/vaditajs/p/${ev.id}`, values, error, submit: 'Saglabāt', cancel: '/vaditajs' })}
    </section>`;
}

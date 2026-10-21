import { createServer } from 'node:http';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { join, extname, relative, sep } from 'node:path';
import { openDb } from './db.js';
import { createPush } from './push.js';
import * as v from './views.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

const TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
};

/** Loads every file under public/ into memory, keyed by URL path. */
function loadPublic(dir) {
  const files = {};
  const walk = (d) => {
    for (const name of readdirSync(d)) {
      const full = join(d, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (TYPES[extname(name)]) files[`/${relative(dir, full).split(sep).join('/')}`] = [TYPES[extname(name)], readFileSync(full)];
    }
  };
  walk(dir);
  return files;
}

export function createApp({
  dbFile = process.env.DB_FILE || join(ROOT, 'data', 'koris.db'),
  choir = process.env.CHOIR_NAME || 'Koris',
  timeZone = process.env.TZ_EVENTS || 'Europe/Riga',
  trustProxy = process.env.TRUST_PROXY === '1',
  baseUrl = process.env.BASE_URL,
  directorPassword = process.env.DIRECTOR_PASSWORD,
  pushSubject = process.env.PUSH_CONTACT,
  android = { package: process.env.ANDROID_PACKAGE, sha256: process.env.ANDROID_CERT_SHA256 },
  log = console.log,
} = {}) {
  const db = openDb(dbFile);
  const push = createPush(db, { subject: pushSubject });

  const password = directorPassword || db.meta('director_password', () => {
    const generated = randomBytes(6).toString('base64url');
    log(`\n  Diriģenta parole: ${generated}\n  (iestati DIRECTOR_PASSWORD, lai izvēlētos savu)\n`);
    return generated;
  });
  const secret = db.meta('secret', () => randomBytes(32).toString('base64url'));
  const directorToken = createHmac('sha256', secret).update(`director:${password}`).digest('base64url');

  const files = loadPublic(join(ROOT, 'public'));
  files['/offline.html'][1] = Buffer.from(files['/offline.html'][1].toString().replace('>Koris<', `>${v.esc(choir)}<`));
  files['/manifest.webmanifest'] = ['application/manifest+json', Buffer.from(JSON.stringify({
    name: choir,
    short_name: choir.slice(0, 12),
    description: 'Kora pasākumi: atbildi „Būšu” vai „Nebūšu”.',
    lang: 'lv',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f2f0ec',
    theme_color: '#a01f1e',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }))];
  if (android.package && android.sha256) {
    files['/.well-known/assetlinks.json'] = ['application/json', Buffer.from(JSON.stringify([{
      relation: ['delegate_permission/common.handle_all_urls'],
      target: { namespace: 'android_app', package_name: android.package, sha256_cert_fingerprints: android.sha256.split(',').map((s) => s.trim()) },
    }]))];
  }

  const todayFmt = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' });
  const today = () => todayFmt.format(new Date());

  // ── Request helpers ─────────────────────────────────────────────────────

  const clientIp = (req) => {
    const fwd = trustProxy && req.headers['x-forwarded-for'];
    const ip = fwd ? fwd.split(',')[0].trim() : req.socket.remoteAddress || '';
    return ip.replace(/^::ffff:/, '');
  };
  const isHttps = (req) => (trustProxy && req.headers['x-forwarded-proto'] === 'https') || Boolean(req.socket.encrypted);
  const origin = (req) => baseUrl?.replace(/\/$/, '') || `${isHttps(req) ? 'https' : 'http'}://${req.headers.host}`;

  const cookies = (req) => Object.fromEntries(
    (req.headers.cookie || '').split(';').map((c) => c.trim().split('=')).filter(([k]) => k).map(([k, ...rest]) => [k, decodeURIComponent(rest.join('='))]),
  );
  const cookie = (req, name, value, maxAge) =>
    `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${isHttps(req) ? '; Secure' : ''}`;
  const TWO_YEARS = 60 * 60 * 24 * 730;

  async function readBody(req) {
    let data = '';
    for await (const chunk of req) {
      data += chunk;
      if (data.length > 10_000) throw Object.assign(new Error('too large'), { status: 413 });
    }
    return data;
  }
  const form = async (req) => Object.fromEntries(new URLSearchParams(await readBody(req)));
  async function json(req) {
    try { return JSON.parse(await readBody(req)); } catch { throw Object.assign(new Error('bad json'), { status: 400 }); }
  }

  const safeBack = (path) => (typeof path === 'string' && /^\/(?!\/)/.test(path) ? path : '/');

  // ── Identity: cookie first, then the last person seen from this IP ──────

  function identify(req, res) {
    const ip = clientIp(req);
    const token = cookies(req).k_m;
    let member = token && db.memberByToken(token);
    if (member) {
      db.rememberIp(ip, member.id);
      return member;
    }
    member = db.memberByIp(ip);
    if (member) res.setHeader('Set-Cookie', cookie(req, 'k_m', member.token, TWO_YEARS));
    return member || null;
  }

  function signIn(req, res, name) {
    const member = db.memberForName(name);
    db.rememberIp(clientIp(req), member.id);
    res.setHeader('Set-Cookie', cookie(req, 'k_m', member.token, TWO_YEARS));
    return member;
  }

  const isDirector = (req) => {
    const got = Buffer.from(cookies(req).k_d || '');
    const want = Buffer.from(directorToken);
    return got.length === want.length && timingSafeEqual(got, want);
  };

  // ── Responses ───────────────────────────────────────────────────────────

  function page(res, { status = 200, title, member = null, director = false, body }) {
    res.writeHead(status, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'Content-Security-Policy': "default-src 'self'; img-src 'self' data:; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
      'Referrer-Policy': 'same-origin',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(String(v.layout({ title, choir, member, director, body, vapidKey: push.publicKey })));
  }
  function redirect(res, location) {
    res.writeHead(303, { Location: location });
    res.end();
  }
  function sendJson(res, status, data) {
    res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(data));
  }

  // ── Notifications ───────────────────────────────────────────────────────

  const place = (ev) => (ev.location ? ` · ${ev.location}` : '');
  const notify = (who, ev, title, body) =>
    push.notify(db.subs(who, ev.id), { title, body, url: `/p/${ev.id}`, tag: `${ev.id}-${who}` });

  // ── Validation ──────────────────────────────────────────────────────────

  const cleanName = (s) => String(s || '').trim().replace(/\s+/g, ' ').slice(0, 60);

  function parseEvent(f) {
    const values = {
      title: String(f.title || '').trim().slice(0, 120),
      date: String(f.date || ''),
      time: String(f.time || ''),
      location: String(f.location || '').trim().slice(0, 120),
      min_yes: String(f.min_yes || '').trim(),
    };
    const minYes = Number(values.min_yes);
    let error = null;
    if (!values.title) error = 'Ieraksti pasākuma nosaukumu.';
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(values.date) || Number.isNaN(Date.parse(values.date))) error = 'Izvēlies datumu.';
    else if (values.time && !/^\d{2}:\d{2}$/.test(values.time)) error = 'Laiks jānorāda formātā 18:30.';
    else if (!Number.isInteger(minYes) || minYes < 1 || minYes > 500) error = 'Minimālajam skaitam jābūt no 1 līdz 500.';
    return {
      values,
      error,
      data: { title: values.title, date: values.date, time: values.time || null, location: values.location || null, minYes },
    };
  }

  const blankEvent = () => ({ title: '', date: '', time: '', location: '', min_yes: String(db.lastMinYes() ?? 10) });

  function directorPage(req, res, { status, values = blankEvent(), error, created, reminded } = {}) {
    const t = today();
    page(res, {
      status,
      title: 'Diriģentam',
      director: true,
      body: v.director({ upcoming: db.upcoming(t), past: db.past(t), today: t, origin: origin(req), created, reminded, values, error }),
    });
  }

  // ── Routes ──────────────────────────────────────────────────────────────

  async function handle(req, res) {
    const url = new URL(req.url, 'http://x');
    const path = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, '') : '/';
    const method = req.method;

    if ((method === 'GET' || method === 'HEAD') && files[path]) {
      const [type, data] = files[path];
      const fresh = path === '/sw.js' || path === '/manifest.webmanifest' || path.startsWith('/.well-known/');
      res.writeHead(200, { 'Content-Type': type, 'Cache-Control': fresh ? 'no-cache' : 'public, max-age=86400' });
      return res.end(method === 'HEAD' ? undefined : data);
    }

    // Members ---------------------------------------------------------------

    if (path === '/' && method === 'GET') {
      const member = identify(req, res);
      if (!member) return page(res, { body: v.nameForm() });
      const t = today();
      return page(res, { member, body: v.home({ events: db.upcomingFor(member.id, t), today: t }) });
    }

    if (path === '/vards' && method === 'POST') {
      const f = await form(req);
      const name = cleanName(f.name);
      if (name.length < 2) return page(res, { status: 422, body: v.nameForm({ error: 'Ieraksti savu vārdu.', value: name }) });
      signIn(req, res, name);
      return redirect(res, safeBack(f.back));
    }

    if (path === '/cits' && method === 'POST') {
      const member = identify(req, res);
      if (member) db.forgetIp(clientIp(req), member.id);
      res.setHeader('Set-Cookie', cookie(req, 'k_m', '', 0));
      return redirect(res, '/');
    }

    let m = path.match(/^\/p\/([a-z0-9]+)$/);
    if (m && method === 'GET') {
      const ev = db.event(m[1]);
      const member = identify(req, res);
      if (!ev) return page(res, { status: 404, member, title: 'Nav atrasts', body: v.notFound() });
      const t = today();
      return page(res, {
        member,
        title: ev.title,
        director: isDirector(req),
        body: v.eventPage({
          ev,
          today: t,
          member,
          mine: member ? db.myAnswer(ev.id, member.id) : null,
          answers: db.answers(ev.id),
          others: member ? db.upcomingFor(member.id, t) : [],
          isPast: ev.date < t,
        }),
      });
    }

    m = path.match(/^\/p\/([a-z0-9]+)\/atbilde$/);
    if (m && method === 'POST') {
      const ev = db.event(m[1]);
      if (!ev) return page(res, { status: 404, title: 'Nav atrasts', body: v.notFound() });
      const f = await form(req);
      let member = identify(req, res);
      const name = cleanName(f.name);
      if (name.length >= 2) member = signIn(req, res, name);
      if (!member) return redirect(res, `/p/${ev.id}`);
      if (ev.date >= today() && (f.going === '1' || f.going === '0')) {
        db.answer(ev.id, member.id, f.going === '1');
        const after = db.event(ev.id);
        if (ev.yes < ev.min_yes && after.yes >= after.min_yes) {
          notify('going', after, `Notiks: ${after.title}`, `Pieteikušies jau ${after.yes}. ${v.whenLong(after, today())}${place(after)}`);
        }
      }
      return redirect(res, safeBack(f.back));
    }

    if (path === '/push/subscribe' && method === 'POST') {
      const member = identify(req, res);
      if (!member) return sendJson(res, 401, { error: 'no member' });
      const sub = await json(req);
      if (typeof sub?.endpoint !== 'string' || !/^https:\/\//.test(sub.endpoint) || !sub.keys?.p256dh || !sub.keys?.auth) {
        return sendJson(res, 400, { error: 'bad subscription' });
      }
      db.subscribe(member.id, sub);
      return sendJson(res, 200, { ok: true });
    }

    if (path === '/push/unsubscribe' && method === 'POST') {
      const { endpoint } = await json(req);
      if (typeof endpoint === 'string') db.unsubscribe(endpoint);
      return sendJson(res, 200, { ok: true });
    }

    // Director --------------------------------------------------------------

    if (path === '/vaditajs' && method === 'GET') {
      if (!isDirector(req)) return page(res, { title: 'Diriģentam', body: v.directorLogin() });
      const remindedEv = url.searchParams.get('atgadinats') && db.event(url.searchParams.get('atgadinats'));
      return directorPage(req, res, {
        created: url.searchParams.get('jauns'),
        reminded: remindedEv && { title: remindedEv.title, count: Number(url.searchParams.get('n')) || 0 },
      });
    }

    if (path === '/vaditajs/ieeja' && method === 'POST') {
      const f = await form(req);
      const got = Buffer.from(String(f.password || ''));
      const want = Buffer.from(password);
      if (got.length !== want.length || !timingSafeEqual(got, want)) {
        await new Promise((r) => setTimeout(r, 600));
        return page(res, { status: 401, title: 'Diriģentam', body: v.directorLogin({ error: 'Parole nav pareiza. Pamēģini vēlreiz.' }) });
      }
      res.setHeader('Set-Cookie', cookie(req, 'k_d', directorToken, TWO_YEARS));
      return redirect(res, '/vaditajs');
    }

    if (path === '/vaditajs/iziet' && method === 'POST') {
      res.setHeader('Set-Cookie', cookie(req, 'k_d', '', 0));
      return redirect(res, '/');
    }

    if (path.startsWith('/vaditajs/') && !isDirector(req)) return redirect(res, '/vaditajs');

    if (path === '/vaditajs/pasakums' && method === 'POST') {
      const { values, error, data } = parseEvent(await form(req));
      if (error) return directorPage(req, res, { status: 422, values, error });
      const ev = db.event(db.createEvent(data));
      if (ev.date >= today()) notify('all', ev, `Jauns pasākums: ${ev.title}`, `${v.whenLong(ev, today())}${place(ev)}. Vai būsi?`);
      return redirect(res, `/vaditajs?jauns=${ev.id}`);
    }

    m = path.match(/^\/vaditajs\/p\/([a-z0-9]+)$/);
    if (m) {
      const ev = db.event(m[1]);
      if (!ev) return redirect(res, '/vaditajs');
      if (method === 'GET') {
        const values = { title: ev.title, date: ev.date, time: ev.time || '', location: ev.location || '', min_yes: String(ev.min_yes) };
        return page(res, { title: 'Labot', director: true, body: v.editEvent({ ev, values }) });
      }
      if (method === 'POST') {
        const { values, error, data } = parseEvent(await form(req));
        if (error) return page(res, { status: 422, title: 'Labot', director: true, body: v.editEvent({ ev, values, error }) });
        db.updateEvent(ev.id, data);
        const after = db.event(ev.id);
        const moved = ev.date !== after.date || ev.time !== after.time || ev.location !== after.location || ev.title !== after.title;
        if (moved && after.date >= today()) notify('going', after, `Izmaiņas: ${after.title}`, `Tagad: ${v.whenLong(after, today())}${place(after)}`);
        return redirect(res, '/vaditajs');
      }
    }

    m = path.match(/^\/vaditajs\/p\/([a-z0-9]+)\/atgadinat$/);
    if (m && method === 'POST') {
      const ev = db.event(m[1]);
      if (!ev) return redirect(res, '/vaditajs');
      const subs = db.subs('unanswered', ev.id);
      push.notify(subs, { title: `Vai būsi? ${ev.title}`, body: `${v.whenLong(ev, today())}${place(ev)}. Atbildi ar vienu pieskārienu.`, url: `/p/${ev.id}`, tag: `${ev.id}-remind` });
      const people = new Set(subs.map((s) => s.member_id)).size;
      return redirect(res, `/vaditajs?atgadinats=${ev.id}&n=${people}`);
    }

    m = path.match(/^\/vaditajs\/p\/([a-z0-9]+)\/dzest$/);
    if (m && method === 'POST') {
      const ev = db.event(m[1]);
      if (ev) {
        if (ev.date >= today()) notify('going', ev, `Atcelts: ${ev.title}`, `${v.whenLong(ev, today())} nenotiks.`);
        db.deleteEvent(ev.id);
      }
      return redirect(res, '/vaditajs');
    }

    page(res, { status: 404, title: 'Nav atrasts', body: v.notFound() });
  }

  return createServer((req, res) => {
    handle(req, res).catch((err) => {
      if (!err.status) console.error(err);
      if (!res.headersSent) res.writeHead(err.status || 500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(err.status === 413 ? 'Pārāk liels pieprasījums' : 'Kaut kas nogāja greizi. Mēģini vēlreiz.');
    });
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT) || 3000;
  createApp().listen(port, () => console.log(`  Koris darbojas: http://localhost:${port}`));
}

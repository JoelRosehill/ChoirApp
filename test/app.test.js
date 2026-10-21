import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/server.js';

let server;
let base;

before(async () => {
  server = createApp({ dbFile: ':memory:', directorPassword: 'dziesma', log: () => {} });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

/** A tiny browser: keeps cookies, does not follow redirects. */
function browser() {
  const jar = new Map();
  return async (path, { form, json } = {}) => {
    const headers = { cookie: [...jar].map(([k, v]) => `${k}=${v}`).join('; ') };
    let body;
    if (form) { headers['content-type'] = 'application/x-www-form-urlencoded'; body = new URLSearchParams(form).toString(); }
    if (json) { headers['content-type'] = 'application/json'; body = JSON.stringify(json); }
    const res = await fetch(base + path, { method: form || json ? 'POST' : 'GET', headers, body, redirect: 'manual' });
    for (const c of res.headers.getSetCookie()) {
      const [pair] = c.split(';');
      const [k, v] = pair.split('=');
      if (/Max-Age=0/.test(c)) jar.delete(k); else jar.set(k, v);
    }
    return { status: res.status, location: res.headers.get('location'), text: await res.text() };
  };
}

const future = (days) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

async function director() {
  const b = browser();
  const r = await b('/vaditajs/ieeja', { form: { password: 'dziesma' } });
  assert.equal(r.status, 303);
  return b;
}
async function createEvent(d, fields) {
  const r = await d('/vaditajs/pasakums', { form: { time: '', location: '', ...fields } });
  assert.equal(r.status, 303);
  return new URL(r.location, base).searchParams.get('jauns');
}

test('director needs the password', async () => {
  const b = browser();
  assert.match((await b('/vaditajs')).text, /Ievadi paroli/);
  assert.equal((await b('/vaditajs/ieeja', { form: { password: 'nepareizi' } })).status, 401);
  assert.equal((await b('/vaditajs/pasakums', { form: { title: 'X' } })).location, '/vaditajs');
});

test('event validation explains the problem', async () => {
  const d = await director();
  const r = await d('/vaditajs/pasakums', { form: { title: 'Mēģinājums', date: future(3), min_yes: '0' } });
  assert.equal(r.status, 422);
  assert.match(r.text, /no 1 līdz 500/);
});

test('member answers in one step, is remembered, and sees other unanswered events', async () => {
  const d = await director();
  const a = await createEvent(d, { title: 'Mēģinājums A', date: future(2), min_yes: '2', location: 'Zāle' });
  const b = await createEvent(d, { title: 'Koncerts B', date: future(9), min_yes: '1' });

  const anna = browser();
  const page = await anna(`/p/${a}`);
  assert.match(page.text, /Ieraksti vārdu un atbildi/);

  const vote = await anna(`/p/${a}/atbilde`, { form: { name: 'Anna Bērziņa', going: '1', back: `/p/${a}` } });
  assert.equal(vote.status, 303);

  const after = await anna(`/p/${a}`);
  assert.match(after.text, /Anna Bērziņa/);
  assert.match(after.text, /Trūkst vēl 1/);
  assert.match(after.text, /Vēl gaida tavu atbildi/);
  assert.match(after.text, /Koncerts B/);

  // Second singer pushes it over the minimum.
  const janis = browser();
  await janis(`/p/${a}/atbilde`, { form: { name: 'Jānis', going: '1' } });
  assert.match((await janis(`/p/${a}`)).text, /Notiks/);

  // Answering B empties Anna's waiting list.
  await anna(`/p/${b}/atbilde`, { form: { going: '0', back: '/' } });
  assert.match((await anna('/')).text, /Viss atbildēts/);
});

test('same name on a new device is the same person', async () => {
  const d = await director();
  const id = await createEvent(d, { title: 'Ierakstu sesija', date: future(4), min_yes: '5' });
  const phone = browser();
  await phone(`/p/${id}/atbilde`, { form: { name: 'Līga Ozola', going: '1' } });
  const laptop = browser();
  await laptop('/vards', { form: { name: '  līga   ozola ' } });
  assert.match((await laptop(`/p/${id}`)).text, /aria-pressed="true"><svg[^]*?Būšu/);
});

test('unknown device is recognised by IP; the cookie wins when people share Wi-Fi', async () => {
  const first = browser();
  await first('/vards', { form: { name: 'Pirmais Dziedātājs' } });
  // No cookie at all: the IP remembers the last person.
  assert.match((await browser()('/')).text, /Pirmais Dziedātājs/);
  // Someone else on the same IP signs in; the first person still sees themselves.
  const second = browser();
  await second('/vards', { form: { name: 'Otrais Dziedātājs' } });
  assert.match((await first('/')).text, /Pirmais Dziedātājs/);
  assert.match((await second('/')).text, /Otrais Dziedātājs/);
  // "Mainīt" forgets this device.
  await second('/cits', { form: {} });
  assert.match((await second('/')).text, /Kā tevi sauc/);
});

test('past events cannot be answered', async () => {
  const d = await director();
  const id = await createEvent(d, { title: 'Vecais', date: '2020-01-01', min_yes: '1' });
  const m = browser();
  await m('/vards', { form: { name: 'Kārlis' } });
  await m(`/p/${id}/atbilde`, { form: { going: '1' } });
  const page = await m(`/p/${id}`);
  assert.match(page.text, /jau ir pagājis/);
  assert.match(page.text, /<b class="num">0<\/b> no 1/);
});

test('director edits, reminds and deletes', async () => {
  const d = await director();
  const id = await createEvent(d, { title: 'Labojams', date: future(5), min_yes: '3' });
  assert.equal((await d(`/vaditajs/p/${id}`, { form: { title: 'Labots', date: future(6), time: '19:00', location: '', min_yes: '4' } })).status, 303);
  assert.match((await d(`/p/${id}`)).text, /Labots/);
  const remind = await d(`/vaditajs/p/${id}/atgadinat`, { form: {} });
  assert.match(remind.location, /atgadinats=/);
  assert.match((await d(remind.location)).text, /nav ieslēdzis paziņojumus/);
  await d(`/vaditajs/p/${id}/dzest`, { form: {} });
  assert.equal((await d(`/p/${id}`)).status, 404);
});

test('push subscription needs a member and a valid subscription', async () => {
  const anon = browser();
  await anon('/cits', { form: {} });
  assert.equal((await anon('/push/subscribe', { json: { endpoint: 'https://push.example/x', keys: { p256dh: 'a', auth: 'b' } } })).status, 401);
  const m = browser();
  await m('/vards', { form: { name: 'Ilze' } });
  assert.equal((await m('/push/subscribe', { json: { endpoint: 'http://insecure' } })).status, 400);
  assert.equal((await m('/push/subscribe', { json: { endpoint: 'https://push.example/x', keys: { p256dh: 'a', auth: 'b' } } })).status, 200);
});

test('PWA files are served', async () => {
  const b = browser();
  const manifest = JSON.parse((await b('/manifest.webmanifest')).text);
  assert.equal(manifest.display, 'standalone');
  assert.equal((await b('/sw.js')).status, 200);
  assert.equal((await b('/icons/icon-192.png')).status, 200);
});

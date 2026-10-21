import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createECDH, randomBytes } from 'node:crypto';
import webpush from 'web-push';
import { openDb } from '../src/db.js';
import { createPush } from '../src/push.js';

const keys = () => ({ p256dh: createECDH('prime256v1').generateKeys().toString('base64url'), auth: randomBytes(16).toString('base64url') });

test('builds an encrypted, VAPID-signed request with the stored keys', () => {
  const db = openDb(':memory:');
  const push = createPush(db, { log: () => {} });
  const vapid = JSON.parse(db.meta('vapid'));
  assert.equal(push.publicKey, vapid.publicKey);
  const req = webpush.generateRequestDetails(
    { endpoint: 'https://push.example/abc', keys: keys() },
    JSON.stringify({ title: 'Jauns pasākums' }),
    { vapidDetails: { subject: 'mailto:koris@example.invalid', ...vapid } },
  );
  assert.equal(req.headers['Content-Encoding'], 'aes128gcm');
  assert.match(req.headers.Authorization, /^vapid t=.+, k=/);
  assert.ok(req.body.length > 0);
});

test('drops subscriptions the push service reports as gone', async (t) => {
  const db = openDb(':memory:');
  const push = createPush(db, { log: () => {} });
  const member = db.memberForName('Anna');
  db.subscribe(member.id, { endpoint: 'https://push.example/ok', keys: keys() });
  db.subscribe(member.id, { endpoint: 'https://push.example/gone', keys: keys() });

  const sent = [];
  t.mock.method(webpush, 'sendNotification', async (sub) => {
    sent.push(sub.endpoint);
    if (sub.endpoint.endsWith('/gone')) throw Object.assign(new Error('gone'), { statusCode: 410 });
    return { statusCode: 201 };
  });

  push.notify(db.subs('all'), { title: 'Jauns pasākums', body: 'Vai būsi?', url: '/p/abc' });
  await new Promise((r) => setTimeout(r, 50));

  assert.equal(sent.length, 2);
  assert.deepEqual(db.subs('all').map((s) => s.endpoint), ['https://push.example/ok']);
});

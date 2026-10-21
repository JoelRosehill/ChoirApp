import webpush from 'web-push';

/** Web Push sender. VAPID keys are generated on first run and kept in the database. */
export function createPush(db, { subject, log = console.error } = {}) {
  const keys = JSON.parse(db.meta('vapid', () => JSON.stringify(webpush.generateVAPIDKeys())));
  webpush.setVapidDetails(subject || 'mailto:koris@example.invalid', keys.publicKey, keys.privateKey);

  async function send(subs, payload) {
    const body = JSON.stringify(payload);
    await Promise.all(subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body, { TTL: 60 * 60 * 24 });
      } catch (err) {
        // Gone or invalid: the browser dropped this subscription.
        if ([400, 403, 404, 410].includes(err.statusCode)) db.unsubscribe(s.endpoint);
        else log('push failed', err.statusCode || err.message);
      }
    }));
  }

  return {
    publicKey: keys.publicKey,
    /** Fire-and-forget so a slow push service never delays a page. */
    notify(subs, payload) {
      if (subs.length) send(subs, payload).catch((err) => log('push failed', err));
    },
  };
}

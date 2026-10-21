// Progressive enhancement only: every page works without this file.

// Copy and share event links.
document.addEventListener('click', async (e) => {
  const copy = e.target.closest('[data-copy]');
  if (copy) {
    try {
      await navigator.clipboard.writeText(copy.dataset.copy);
      const label = copy.textContent;
      copy.textContent = 'Nokopēts';
      setTimeout(() => { copy.textContent = label; }, 1800);
    } catch {
      copy.parentElement.querySelector('input')?.select();
    }
  }
  const share = e.target.closest('[data-share]');
  if (share) navigator.share({ url: share.dataset.share }).catch(() => {});
});

if (navigator.share) document.querySelectorAll('[data-share]').forEach((b) => { b.hidden = false; });
document.querySelectorAll('.share-url').forEach((input) => input.addEventListener('focus', () => input.select()));

// Confirm destructive actions.
document.addEventListener('submit', (e) => {
  const message = e.target.dataset.confirm;
  if (message && !window.confirm(message)) e.preventDefault();
});

// Service worker (offline page, push notifications).
const swReady = 'serviceWorker' in navigator
  ? navigator.serviceWorker.register('/sw.js').then(() => navigator.serviceWorker.ready).catch(() => null)
  : Promise.resolve(null);

// Push notifications.
const strip = document.querySelector('[data-notify]');
const vapidKey = document.querySelector('meta[name="vapid-key"]')?.content;

const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const canPush = 'PushManager' in window && 'Notification' in window && 'serviceWorker' in navigator;

function keyBytes(base64) {
  const s = atob((base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
}

const saveSubscription = (sub) => fetch('/push/subscribe', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(sub),
});

async function setupNotifications() {
  if (!canPush) {
    // iPhone only offers push to apps added to the home screen.
    if (strip && isIos && !standalone) {
      strip.querySelector('[data-notify-text]').textContent =
        'Lai saņemtu paziņojumus iPhone, pievieno šo lapu sākuma ekrānam: Safari spied „Kopīgot”, tad „Pievienot sākuma ekrānam”, un atver to no turienes.';
      strip.querySelector('[data-notify-on]').hidden = true;
      strip.hidden = false;
    }
    return;
  }
  const reg = await swReady;
  if (!reg || !vapidKey) return;

  // Keep the server in step with this device (also after "Mainīt" switches person).
  const existing = await reg.pushManager.getSubscription();
  if (existing) {
    saveSubscription(existing).catch(() => {});
    return;
  }
  if (!strip || Notification.permission === 'denied') return;

  const text = strip.querySelector('[data-notify-text]');
  const button = strip.querySelector('[data-notify-on]');
  strip.hidden = false;
  button.addEventListener('click', async () => {
    button.disabled = true;
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        text.textContent = 'Paziņojumi nav atļauti. Tos var ieslēgt pārlūka vai tālruņa iestatījumos.';
        button.hidden = true;
        return;
      }
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(vapidKey) });
      const res = await saveSubscription(sub);
      if (!res.ok) throw new Error(String(res.status));
      text.textContent = 'Paziņojumi ieslēgti. Ziņosim par jauniem pasākumiem un izmaiņām.';
      button.hidden = true;
    } catch {
      text.textContent = 'Neizdevās ieslēgt paziņojumus. Pamēģini vēlreiz.';
      button.disabled = false;
    }
  });
}

setupNotifications();

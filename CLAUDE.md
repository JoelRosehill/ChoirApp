# Koris: notes for AI assistants

Latvian choir event attendance app. The director creates events with a minimum number of "yes" answers; singers answer "Būšu / Nebūšu" with no account. Node.js 22 server, SQLite, server-rendered HTML, PWA with Web Push, Docker + Caddy (Let's Encrypt). See README.md for the user-facing description and PRODUCT.md for product truth.

## Current status: code done, deployment not finished

Everything in the app is built and tested locally (`npm test`, 12 tests). What remains is putting it on a real server and verifying the parts that cannot be tested without a domain, HTTPS and real phones. **When asked to "finish" or "deploy", work through the checklist below in order**, and tick items off in this file (change `[ ]` to `[x]`) as they are verified, so the next session knows where things stand.

### Finish checklist

- [ ] **1. Server prerequisites.** Linux server with Docker and the Compose plugin (`docker compose version`). A domain whose DNS `A` (and `AAAA` if IPv6) record points at the server. Ports 80 and 443 open in any firewall or cloud security group (Let's Encrypt needs port 80 reachable for the HTTP challenge).
- [ ] **2. Code on the server.** `git clone` the repository and check out `main` (or the `claude/choir-event-app` branch if the PR is not merged yet).
- [ ] **3. Configure.** `cp .env.example .env` and set every value: `DOMAIN`, `ACME_EMAIL`, `CHOIR_NAME`, `DIRECTOR_PASSWORD` (generate one: `openssl rand -base64 12`), `PUSH_CONTACT` (`mailto:` address). Never commit `.env`.
- [ ] **4. First start.** `docker compose up -d --build`. **The Docker image has never been built** (no Docker daemon was available while writing it); if the build fails, fix the Dockerfile, not the app. Verify:
  - `docker compose ps` shows `app` and `caddy` running.
  - `docker compose logs caddy` shows the certificate was obtained (look for `certificate obtained successfully`). If it fails, the cause is almost always DNS not pointing at the server yet or port 80/443 closed.
  - `curl -I https://$DOMAIN/` returns `200`, and `curl -s https://$DOMAIN/manifest.webmanifest` returns JSON.
- [ ] **5. Smoke test in a browser.** Open `https://$DOMAIN/vaditajs`, log in with `DIRECTOR_PASSWORD`, create an event, copy its link, open it on a phone (mobile data, not the same Wi-Fi), enter a name, answer "Būšu". The band on the director page should gain one unit.
- [ ] **6. Identity behind the proxy.** Open the site from two different networks without signing in again: each should be asked for a name, not shown someone else's. If everyone shows up as the same person, `TRUST_PROXY=1` is not reaching the app (it is set in `docker-compose.yml`); without it every request comes from Caddy's IP.
- [ ] **7. Push on Android.** In Chrome on Android: open the site, tap **Ieslēgt paziņojumus**, allow. Then as director: create a new event → the phone should get "Jauns pasākums: …". Also test **Atgādināt neatbildējušajiem**, an event reaching its minimum ("Notiks: …"), editing the time ("Izmaiņas: …") and deleting ("Atcelts: …"). Push has never been tested on a real device; payloads and VAPID signing are covered by `test/push.test.js` only.
- [ ] **8. Push on iPhone (iOS 16.4+).** Safari → share button → **Pievienot sākuma ekrānam** → open the app from the home screen → **Ieslēgt paziņojumus** → allow. Repeat the "new event" test. In plain Safari (not installed) the app shows install instructions instead of the button; that is expected.
- [ ] **9. Backups.** Add a daily cron job on the server (the database holds all answers and the VAPID push keys):
  ```sh
  0 3 * * * cd /path/to/koris && docker compose exec -T app node -e "new (require('node:sqlite').DatabaseSync)('/data/koris.db').exec(\"VACUUM INTO '/data/backup.db'\")" && docker compose cp app:/data/backup.db ./backups/koris-$(date +\%F).db
  ```
- [ ] **10. Android APK (optional).** Only after step 4 works over HTTPS. Use pwabuilder.com → enter `https://$DOMAIN` → Package for stores → Android, package ID e.g. `lv.koris.app`. Keep the signing key it generates somewhere safe (outside the repo). Put the package ID and the SHA-256 fingerprint from its `assetlinks.json` into `.env` as `ANDROID_PACKAGE` and `ANDROID_CERT_SHA256`, run `docker compose up -d`, and check `https://$DOMAIN/.well-known/assetlinks.json` returns them. Install the APK on a phone: it should open full-screen with no address bar (an address bar means assetlinks does not match).

### Things that must not be lost or changed casually

- **The `koris-data` Docker volume.** It holds the SQLite database, including the VAPID keys in the `meta` table. Losing it, or deleting the `vapid` row, silently breaks every existing push subscription (members would have to re-enable notifications).
- **`caddy-data` volume** holds the certificates; deleting it forces re-issuing (Let's Encrypt rate limits apply).
- Changing `DIRECTOR_PASSWORD` logs the director out on every device (the director cookie is derived from it). That is intended.
- `BASE_URL` decides the links the director copies; it is set from `DOMAIN` in `docker-compose.yml`.

## Working on the code

```sh
npm install
DIRECTOR_PASSWORD=dziesma npm run dev   # http://localhost:3000, director at /vaditajs
npm test                                # node:test, must stay green
```

| File | What it holds |
|---|---|
| `src/server.js` | All routes, identity (cookie first, then IP), director auth, notification triggers |
| `src/views.js` | Every page and **all user-facing text (Latvian only)** |
| `src/db.js` | SQLite schema and queries (`node:sqlite`, no ORM) |
| `src/push.js` | Web Push; VAPID keys generated on first run and stored in the DB |
| `public/style.css` | The entire visual system (tokens on `:root`, dark mode via `prefers-color-scheme`) |
| `public/app.js` | Progressive enhancement only: copy/share, confirm, service worker, notification opt-in |
| `public/sw.js` | Service worker: push display, notification click, offline page |
| `test/` | `app.test.js` (HTTP flows), `push.test.js` (push encryption and pruning) |

Rules:

- **All UI text is Latvian** and lives in `src/views.js`. Use neutral wording (avoid gendered verb forms such as "atbildējis/atbildējusi").
- **Simplicity is the top product requirement.** Members must be able to answer in one tap with no account; do not add steps, sign-up, or settings for members.
- Pages must work without JavaScript; `public/app.js` only enhances.
- The CSP forbids inline scripts and inline `style` attributes; keep styling in `public/style.css`.
- Add a test in `test/app.test.js` for any new route or behaviour.

## Design: always use the impeccable skill

The user requires the **impeccable** skill (`.claude/skills/impeccable`, from github.com/pbakaus/impeccable) for any design or UI work. Before changing anything visual:

1. Run `.claude/skills/impeccable/scripts/impeccable context --target <file>` once per session and follow its directives.
2. Read `DESIGN.md` (the recorded system), `.impeccable/surfaces/src-views-js.md` (the direction contract: the woven-belt / josta world) and `.claude/skills/impeccable/reference/craft-floor.md` before editing.
3. Stay inside the system: linen, ink and madder red; forest green only for the "Notiks" reached state; Schibsted Grotesk only; 4px spacing grid; 3px radius; one-device-pixel hairlines; the woven band shows exact counts, never percentages.
4. The impeccable edit hooks are **not** installed (adding them to `.claude/settings.json` was blocked), so after UI changes run `.claude/skills/impeccable/scripts/impeccable detect --json public/style.css src/views.js public/offline.html` yourself and fix what it reports. The three advisories about dark-mode colours on `offline.html` are known false positives (the dark tokens are documented in DESIGN.md and `.impeccable/design.json`).
5. Check the result in screenshots at 390px and 1440px, light and dark.

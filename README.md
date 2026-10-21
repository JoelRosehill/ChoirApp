# Koris

A very simple event attendance app for a choir, in Latvian.

- **The director** creates an event (title, date, optional time, optional place) with a **minimum number of singers** needed for it to take place, then shares the link in the choir chat.
- **Singers** open the link, type their name once and tap **Būšu** or **Nebūšu**. No account, no password.
- Each event shows a woven band that fills one unit per "Būšu". Once the minimum is reached, the event shows **Notiks**.
- Opening any link also lists every other upcoming event the person hasn't answered yet.
- Installable on iPhone and Android home screens, with push notifications.

> **Status:** the code is complete and tested; deployment to a server is not finished yet. The step-by-step finish checklist is in [CLAUDE.md](CLAUDE.md).

## How people are remembered

A name is entered once. After that it's remembered two ways:

1. A long-lived browser cookie. This takes priority, so the whole choir on the rehearsal hall's Wi-Fi doesn't get mixed up.
2. The IP address. A browser without the cookie is recognised as the last person seen from that IP.

Typing the same name on a new phone (case and spacing don't matter) links to the same person and keeps their answers. **Mainīt** in the header lets someone else use the device.

## Notifications

Singers tap **Ieslēgt paziņojumus** once. They then get:

| When | Who |
|---|---|
| A new event is created | everyone with notifications on |
| The director taps **Atgādināt neatbildējušajiem** | people who haven't answered that event |
| An event reaches its minimum | people who said "Būšu" |
| An event's time, place or title changes, or it is deleted | people who said "Būšu" |

**iPhone (iOS 16.4+):** Apple only allows notifications for web apps added to the home screen. In Safari, tap **Kopīgot**, then **Pievienot sākuma ekrānam**, and open the app from there. The app shows these steps itself when needed.

**Android:** Chrome offers **Instalēt lietotni** / **Pievienot sākuma ekrānam**. Notifications work in the browser too.

## Run locally

Requires Node.js 22.5 or newer (it uses the built-in SQLite module).

```sh
npm install
DIRECTOR_PASSWORD=dziesma npm start   # http://localhost:3000, director page: /vaditajs
npm test
```

If `DIRECTOR_PASSWORD` is not set, a password is generated on first start, printed to the console and stored in the database.

## Deploy with HTTPS (Let's Encrypt)

Push notifications and home-screen installs require HTTPS. The included Docker Compose setup runs the app behind [Caddy](https://caddyserver.com), which gets and renews Let's Encrypt certificates automatically.

1. Get a small Linux server and a domain. Point the domain's DNS `A` record at the server, and open ports 80 and 443.
2. Install Docker, then on the server:

   ```sh
   git clone <this repo> koris && cd koris
   cp .env.example .env    # set DOMAIN, ACME_EMAIL, DIRECTOR_PASSWORD, CHOIR_NAME, PUSH_CONTACT
   docker compose up -d
   ```

3. Open `https://<your domain>/vaditajs`, log in, and create the first event.

The SQLite database, including the push keys, lives in the `koris-data` Docker volume. Back it up with:

```sh
docker compose exec app node -e "new (require('node:sqlite').DatabaseSync)('/data/koris.db').exec(\"VACUUM INTO '/data/backup.db'\")"
docker compose cp app:/data/backup.db ./koris-backup.db
```

**Without Docker:** run `npm ci --omit=dev && npm start` under systemd with `TRUST_PROXY=1`, `BASE_URL=https://<domain>` and `DB_FILE=/var/lib/koris/koris.db`. Put Caddy in front with a one-line Caddyfile: `koris.example.lv { reverse_proxy localhost:3000 }`.

### Settings

| Variable | Default | Meaning |
|---|---|---|
| `DIRECTOR_PASSWORD` | generated | Password for `/vaditajs` |
| `CHOIR_NAME` | `Koris` | Shown in the header and under the home-screen icon |
| `BASE_URL` | from request | Public URL used in shared links |
| `TRUST_PROXY` | off | Set to `1` behind Caddy/nginx so client IPs and HTTPS are read from proxy headers |
| `PUSH_CONTACT` | placeholder | `mailto:` or URL that push services may contact |
| `DB_FILE` | `data/koris.db` | SQLite database path |
| `TZ_EVENTS` | `Europe/Riga` | Time zone used to decide which events are past |
| `PORT` | `3000` | HTTP port |
| `ANDROID_PACKAGE`, `ANDROID_CERT_SHA256` | — | Enables `/.well-known/assetlinks.json` for the Android app |

## Android APK

The Android app is a Trusted Web Activity (TWA): a real APK that opens the deployed site full-screen, so there's only one codebase. Build it after the site is live on HTTPS:

1. Go to [pwabuilder.com](https://www.pwabuilder.com), enter `https://<your domain>`, and choose **Package for stores → Android**. Pick a package ID such as `lv.koris.app`.
2. Download the package. It contains the signed `.apk` (install directly) or `.aab` (Google Play), the signing key (keep it safe), and `assetlinks.json`.
3. Copy the package ID and the SHA-256 fingerprint from that `assetlinks.json` into `.env` as `ANDROID_PACKAGE` and `ANDROID_CERT_SHA256`, then run `docker compose up -d`. This removes the browser address bar inside the app.

Alternatively, use Google's [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) CLI: `bubblewrap init --manifest https://<domain>/manifest.webmanifest && bubblewrap build`.

## Project layout

```
src/server.js    routes, identity, director auth, notification triggers
src/views.js     every page and all Latvian text
src/db.js        SQLite schema and queries
src/push.js      Web Push (VAPID keys generated on first run)
public/          stylesheet, script, service worker, icons, self-hosted font
test/            node:test suites (npm test)
PRODUCT.md       product record; .impeccable/ holds the design brief
DESIGN.md        the visual system
```

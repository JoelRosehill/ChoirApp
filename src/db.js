import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomBytes } from 'node:crypto';

export function openDb(file) {
  if (file !== ':memory:') mkdirSync(dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS members (
      id         INTEGER PRIMARY KEY,
      name       TEXT NOT NULL,
      name_key   TEXT NOT NULL UNIQUE,
      token      TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Last person seen from each IP address.
    CREATE TABLE IF NOT EXISTS ips (
      ip        TEXT PRIMARY KEY,
      member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      seen_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS events (
      id         TEXT PRIMARY KEY,
      title      TEXT NOT NULL,
      date       TEXT NOT NULL,  -- YYYY-MM-DD, local time
      time       TEXT,           -- HH:MM, optional
      location   TEXT,           -- optional
      min_yes    INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS answers (
      event_id   TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      member_id  INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      going      INTEGER NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (event_id, member_id)
    );

    CREATE TABLE IF NOT EXISTS push_subs (
      endpoint   TEXT PRIMARY KEY,
      member_id  INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      p256dh     TEXT NOT NULL,
      auth       TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS meta (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
  return new Store(db);
}

export const nameKey = (name) => name.trim().replace(/\s+/g, ' ').toLocaleLowerCase('lv');

const ID_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';
function shortId(len = 6) {
  const bytes = randomBytes(len);
  let id = '';
  for (const b of bytes) id += ID_ALPHABET[b % ID_ALPHABET.length];
  return id;
}

const EVENT_COLUMNS = `
  e.*,
  COALESCE(SUM(a.going = 1), 0) AS yes,
  COALESCE(SUM(a.going = 0), 0) AS no
`;

class Store {
  constructor(db) {
    this.db = db;
    this.q = {
      metaGet: db.prepare('SELECT value FROM meta WHERE key = ?'),
      metaSet: db.prepare('INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'),

      memberByToken: db.prepare('SELECT * FROM members WHERE token = ?'),
      memberByKey: db.prepare('SELECT * FROM members WHERE name_key = ?'),
      memberByIp: db.prepare('SELECT m.* FROM ips i JOIN members m ON m.id = i.member_id WHERE i.ip = ?'),
      memberInsert: db.prepare('INSERT INTO members (name, name_key, token) VALUES (?, ?, ?) RETURNING *'),
      memberRename: db.prepare('UPDATE members SET name = ? WHERE id = ?'),
      ipSet: db.prepare(`INSERT INTO ips (ip, member_id) VALUES (?, ?)
        ON CONFLICT(ip) DO UPDATE SET member_id = excluded.member_id, seen_at = datetime('now')`),
      ipForget: db.prepare('DELETE FROM ips WHERE ip = ? AND member_id = ?'),

      eventGet: db.prepare(`SELECT ${EVENT_COLUMNS} FROM events e
        LEFT JOIN answers a ON a.event_id = e.id WHERE e.id = ? GROUP BY e.id`),
      eventsFrom: db.prepare(`SELECT ${EVENT_COLUMNS} FROM events e
        LEFT JOIN answers a ON a.event_id = e.id
        WHERE e.date >= ? GROUP BY e.id ORDER BY e.date, COALESCE(e.time, ''), e.created_at`),
      eventsBefore: db.prepare(`SELECT ${EVENT_COLUMNS} FROM events e
        LEFT JOIN answers a ON a.event_id = e.id
        WHERE e.date < ? GROUP BY e.id ORDER BY e.date DESC, COALESCE(e.time, '') DESC`),
      eventsFromFor: db.prepare(`SELECT ${EVENT_COLUMNS}, my.going AS mine FROM events e
        LEFT JOIN answers a ON a.event_id = e.id
        LEFT JOIN answers my ON my.event_id = e.id AND my.member_id = ?
        WHERE e.date >= ? GROUP BY e.id ORDER BY e.date, COALESCE(e.time, ''), e.created_at`),
      eventInsert: db.prepare('INSERT INTO events (id, title, date, time, location, min_yes) VALUES (?, ?, ?, ?, ?, ?)'),
      eventUpdate: db.prepare('UPDATE events SET title = ?, date = ?, time = ?, location = ?, min_yes = ? WHERE id = ?'),
      eventDelete: db.prepare('DELETE FROM events WHERE id = ?'),
      lastMinYes: db.prepare('SELECT min_yes FROM events ORDER BY created_at DESC, rowid DESC LIMIT 1'),

      answerSet: db.prepare(`INSERT INTO answers (event_id, member_id, going) VALUES (?, ?, ?)
        ON CONFLICT(event_id, member_id) DO UPDATE SET going = excluded.going, updated_at = datetime('now')`),
      answerGet: db.prepare('SELECT going FROM answers WHERE event_id = ? AND member_id = ?'),
      subSet: db.prepare(`INSERT INTO push_subs (endpoint, member_id, p256dh, auth) VALUES (?, ?, ?, ?)
        ON CONFLICT(endpoint) DO UPDATE SET member_id = excluded.member_id, p256dh = excluded.p256dh, auth = excluded.auth`),
      subDelete: db.prepare('DELETE FROM push_subs WHERE endpoint = ?'),
      subsAll: db.prepare('SELECT * FROM push_subs'),
      subsGoing: db.prepare(`SELECT s.* FROM push_subs s JOIN answers a ON a.member_id = s.member_id
        WHERE a.event_id = ? AND a.going = 1`),
      subsUnanswered: db.prepare(`SELECT s.* FROM push_subs s
        WHERE NOT EXISTS (SELECT 1 FROM answers a WHERE a.event_id = ? AND a.member_id = s.member_id)`),
      answersFor: db.prepare(`SELECT m.name, a.going FROM answers a JOIN members m ON m.id = a.member_id
        WHERE a.event_id = ? ORDER BY a.updated_at, m.name`),
    };
  }

  /** Returns the stored value for `key`, creating it with `make()` the first time. */
  meta(key, make) {
    const row = this.q.metaGet.get(key);
    if (row) return row.value;
    const value = make();
    this.q.metaSet.run(key, value);
    return value;
  }

  memberByToken(token) { return this.q.memberByToken.get(token); }
  memberByIp(ip) { return this.q.memberByIp.get(ip); }

  /** Finds a member by name (case-insensitive) or creates one. */
  memberForName(name) {
    const clean = name.trim().replace(/\s+/g, ' ');
    const existing = this.q.memberByKey.get(nameKey(clean));
    if (existing) {
      if (existing.name !== clean) this.q.memberRename.run(clean, existing.id);
      return { ...existing, name: clean };
    }
    return this.q.memberInsert.get(clean, nameKey(clean), randomBytes(18).toString('base64url'));
  }

  rememberIp(ip, memberId) { this.q.ipSet.run(ip, memberId); }
  forgetIp(ip, memberId) { this.q.ipForget.run(ip, memberId); }

  event(id) { return this.q.eventGet.get(id); }
  upcoming(today) { return this.q.eventsFrom.all(today); }
  past(today) { return this.q.eventsBefore.all(today); }
  upcomingFor(memberId, today) { return this.q.eventsFromFor.all(memberId, today); }
  lastMinYes() { return this.q.lastMinYes.get()?.min_yes; }

  createEvent({ title, date, time, location, minYes }) {
    for (;;) {
      const id = shortId();
      try {
        this.q.eventInsert.run(id, title, date, time, location, minYes);
        return id;
      } catch (err) {
        if (!String(err.message).includes('UNIQUE')) throw err;
      }
    }
  }
  updateEvent(id, { title, date, time, location, minYes }) {
    this.q.eventUpdate.run(title, date, time, location, minYes, id);
  }
  deleteEvent(id) { this.q.eventDelete.run(id); }

  answer(eventId, memberId, going) { this.q.answerSet.run(eventId, memberId, going ? 1 : 0); }
  myAnswer(eventId, memberId) {
    const row = this.q.answerGet.get(eventId, memberId);
    return row ? row.going : null;
  }
  answers(eventId) { return this.q.answersFor.all(eventId); }

  subscribe(memberId, { endpoint, keys }) { this.q.subSet.run(endpoint, memberId, keys.p256dh, keys.auth); }
  unsubscribe(endpoint) { this.q.subDelete.run(endpoint); }
  /** Push subscriptions for: 'all' members, those 'going' to an event, or those who have not answered it. */
  subs(who, eventId) {
    if (who === 'going') return this.q.subsGoing.all(eventId);
    if (who === 'unanswered') return this.q.subsUnanswered.all(eventId);
    return this.q.subsAll.all();
  }
}

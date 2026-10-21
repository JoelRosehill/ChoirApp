# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Node.js server (dependencies allowed) with a server-side SQLite database, server-rendered HTML. Installable PWA for iPhone and Android home screens with Web Push notifications; Android APK as a Trusted Web Activity wrapping the same PWA. HTTPS via Let's Encrypt (Caddy reverse proxy, automatic certificates).

## Users

- **Choir director (diriģents):** one person who creates events (rehearsals, concerts, trips), sends the link to the choir chat, and needs to know whether enough singers will come for the event to happen.
- **Choir members (dziedātāji):** open the link from a group chat on their phone, often once, between other things. They want to answer "būšu / nebūšu" in seconds with no account, no password, no app store.

## Product Purpose

A Latvian-language event attendance tool for a choir. The director makes a simple link to an event with an optional location name and a minimum number of "yes" answers needed for it to take place. Members answer yes or no. Success is the director seeing, at a glance, whether each event reaches its minimum, and members answering without friction.

## Positioning

Simpler than any poll or scheduling tool: no sign-up, no password, one tap to answer. Members type their name once and are remembered. Every unanswered event surfaces automatically, so one link pulls people into answering everything outstanding.

## Operating Context

- Links are shared in group chats (WhatsApp and similar) and opened on phones, often on the rehearsal hall's shared Wi-Fi.
- Some members install it to the home screen and get push notifications; others only ever use links.

## Capabilities and Constraints

- All UI text in Latvian.
- Event: title, date, optional time, optional location name, minimum yes count. Status "Notiks" once the minimum is reached.
- Identity: the name is entered once and remembered by IP address and a long-lived browser cookie (cookie wins, so shared Wi-Fi does not swap people). The same name typed on a new device links to the same person.
- Opening any event also shows the other upcoming events this person has not answered.
- Director access: one shared password set on the server; the session is remembered on that device.
- Push notifications: new event, event reached its minimum, event changed or cancelled, and a director-triggered reminder for people who have not answered.
- Simplicity is the top requirement: as simple as possible while keeping every function above.

## Brand Commitments

Choir name is configurable (defaults to "Koris"). No logo or brand assets have been supplied.

## Evidence on Hand

None. Do not invent choir names, members, or testimonials.

## Product Principles

1. One tap to answer. Anything that adds a step for members must justify itself.
2. Nobody needs an account. A name is enough.
3. The director's question, "will this happen?", is answered on sight.
4. Never lose someone's answer: identity has to survive shared Wi-Fi and changing phones.

## Accessibility & Inclusion

Members range widely in age; many are older singers on phones. Large touch targets, high contrast, readable type sizes, no reliance on colour alone for status.

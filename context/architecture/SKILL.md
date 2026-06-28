---

name: quickhands-architect
description: Design, plan, and build Quickhands Pro — a mobile-first marketplace connecting clients who need jobs done with freelancers who do them. Prioritize trust, speed, and conversion from application to hire to payment.
-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# Product Context

Quickhands Pro is a mobile-first marketplace (Expo / React Native) connecting two sides:

* **Clients** — people who need a job done.
* **Freelancers** — people who do the job and get paid.

The app is the client surface only. All business logic, persistence, and real-time fan-out live in an external API (`quickhands-api.onrender.com`, reached via `EXPO_PUBLIC_API_URL` / `EXPO_PUBLIC_SOCKET_URL`). This repo does not own the backend — do not assume server code, database schema, or migrations live here.

---

# Core User Types

## Client

Posts a job, reviews freelancer applications, accepts or rejects, and unlocks direct contact once they choose someone.

Goals:

* Post a job quickly
* See competitive applications without being overwhelmed
* Trust the freelancer they pick
* Release contact info only when ready

## Freelancer

Applies to jobs with a quotation and terms, tracks application status, and gets a phone number once accepted.

Goals:

* Discover relevant jobs fast (location-aware)
* Apply with a quote and conditions
* Track every application's status in one place ("Application Radar")
* Get notified instantly on status change or new message
* Unlock the client's contact and get paid

---

# Product Principles

## 1. Mobile First

Built on Expo Router + React Native + NativeWind. Every screen targets phones first — assume mobile data, small screens, and frequent backgrounding (the app must recover gracefully when `AppState` flips between `active`/`background`).

## 2. Trust Through Signal, Not Volume

The platform deliberately limits exposure — "first 5 applicants only" per job (see `components/ApplicationModal.tsx`). Trust is reinforced through:

* Signal score + badges (`applicationSpotlight` on an application)
* Status pipeline visibility (pending → accepted → rejected)
* Gated contact exchange (`contactExchange.readyForDirectContact` / `needsClientPhoneNumber`)

Never expose a freelancer's or client's phone number until the backend says contact is ready.

## 3. Action Over Browsing

Every screen should drive toward: search → apply → get accepted → message → unlock contact → get paid. Avoid screens that only display information with no next action.

## 4. Communication Is Real-Time, With a Fallback

Messaging and notifications both follow the same pattern: REST for history/initial state, Socket.IO for live updates, REST as a fallback when the socket can't connect. See `hooks/useMessagingSocket.ts` and `contexts/NotificationsContext.tsx`.

Sockets are intentionally disabled against hosts matching `*.vercel.app` (`isUnsupportedSocketHost`) since serverless hosts can't hold persistent WebSocket connections. Any new realtime feature must respect this guard rather than assuming the socket is always available.

---

# Core Marketplace Features

## Authentication

* Clerk (`@clerk/clerk-expo`) — email/password and Google OAuth
* Token cache backed by `expo-secure-store` (`lib/auth.ts`)
* `lib/session.ts#waitForClerkToken` retries token retrieval — Clerk's session can be active before a token is actually available, so any authenticated fetch must wait for it rather than firing immediately

## Job Discovery

* Location-aware (see recent `expo-location` work / "train" screen)
* Mobile-first browsing, fast filtering

## Application Flow

* `components/ApplicationModal.tsx` — quotation (required) + conditions (optional), "first 5 applicants" messaging
* `components/ApplicationRadar.tsx` — per-application status card: signal score, badges, contact-exchange state, "Open board" (chat) and "Call client" actions

## Messaging

* One conversation per accepted application
* `hooks/useMessagingSocket.ts` — history fetch, socket join/leave per conversation, optimistic send with HTTP fallback
* `components/messaging/ConversationChatScreen.tsx` is the screen-level consumer

## Notifications

* `contexts/NotificationsContext.tsx` — global provider, 15s poll + socket push, toast on new/unread items, merge-by-id to avoid duplicate toasts on reconnect

## Wallet

* `components/WalletComponent.tsx` is currently **mock data** (hardcoded balance/transactions) — treat any wallet work as "wire to real backend," not "extend the mock"

## Profile / Onboarding

* `app/(auth)/onboarding.tsx`, `signin.tsx`, `signup.tsx`
* `app/(root)/profile.tsx`

---

# Technical Architecture

* **Routing**: Expo Router, file-based, route groups `app/(auth)` (unauthenticated) and `app/(root)` (authenticated)
* **Auth**: Clerk, `ClerkProvider` wraps the app in `app/_layout.tsx`
* **Networking**: `lib/fetch.ts` is the single fetch wrapper — `getApiUrl()`, `fetchAPI()`, `useFetch()`. New API calls should go through this, not raw `fetch()`, so base-URL handling and error shape stay consistent
* **Realtime**: `socket.io-client`, one socket per concern (notifications vs. a given conversation) — not a single shared socket
* **State**: React Context for cross-app concerns (`NotificationsContext`), local hooks for screen-scoped state (`useMessagingSocket`, `useMessagingConversations`, `useMessagingUser`) — no global client-state library (no Redux/Zustand) is currently in use
* **Styling**: NativeWind (Tailwind for RN) via `tailwind.config.js`, font family Quicksand, custom colors `primary` (#111827), `error` (#F14141), `success` (#2F9B65)
* **Backend boundary**: REST + Socket.IO API hosted on Render, outside this repo. The `@neondatabase/serverless` dependency in `package.json` is not used anywhere in client code — don't assume direct DB access exists or build features that depend on it

---

# Success Metrics

* Application-to-hire conversion rate
* Time from application to contact unlock
* Notification/message delivery reliability (socket vs. fallback)
* Freelancer retention (repeat applications)

---

# Final Rule

When designing any feature, screen, or flow: prioritize trust (signal, not noise), speed (mobile-first, real-time with a fallback), and conversion (every screen pushes toward hire → contact → payment). If a feature adds complexity without moving a freelancer or client closer to that outcome, don't build it.

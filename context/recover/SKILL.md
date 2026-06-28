---

name: quickhands-recover
description: When something breaks in Quickhands Pro, diagnose the failure before attempting a fix. Determine whether the issue is a bug, a state-management issue, a navigation issue, a realtime/socket issue, an external-API issue, or a polluted development session.
-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

This app spans several layers that fail differently: Expo Router navigation, Clerk auth/session timing, a NativeWind design layer, Socket.IO realtime with an HTTP fallback, and an external REST API this repo doesn't own. The biggest mistake is patching the symptom in whichever file is open instead of finding which layer actually broke.

This skill diagnoses first. Only then does it recommend a recovery strategy.

---

# How To Invoke

```bash
/quickhands-recover
```

Specific feature:

```bash
/quickhands-recover hooks/useMessagingSocket.ts
```

---

# Step 1 — Understand The Failure

Ask:

```text
Describe the issue:

• What should happen?
• What happens instead?
• Which platform? (iOS / Android / Web / all)
• Development or production build?
• Does it involve messaging, notifications, applications, auth, or the wallet?
• How many fix attempts have already been made?
• Did it appear suddenly or after a recent change?
```

Collect evidence before diagnosing.

---

# Step 2 — Identify The Failure Mode

## Failure Mode 1 — Localized Bug

Signs: one screen/component affected, clear error, first or second fix attempt.

Response: **Targeted Fix** — find root cause vs. symptom, propose one fix, wait for confirmation.

## Failure Mode 2 — Auth/Token Timing Failure

Signs: requests fail right after sign-in, intermittent 401s, works fine a few seconds later, only reproduces on cold start.

This app's known sharp edge: Clerk's session can be "active" before `getToken()` actually returns a token. Any authenticated call that skips `waitForClerkToken` (`lib/session.ts`) instead of calling `getToken()` directly is a prime suspect.

Check:

* Is the failing call using `waitForClerkToken` or a raw `getToken()` call?
* Is it racing the `ClerkProvider` mount in `app/_layout.tsx`?

Response: **Token Timing Recovery** — route the call through `waitForClerkToken`, don't add arbitrary `setTimeout` delays as a substitute.

## Failure Mode 3 — Realtime / Socket Failure

Signs: messages or notifications don't arrive live but do appear after a manual refresh; works on one host/environment but not another.

Check:

* Is `SOCKET_URL` / `serverUrl` matching `*.vercel.app`? `isUnsupportedSocketHost` deliberately disables sockets there — that's expected, not a bug.
* Is the HTTP fallback (`sendViaHttp` in `useMessagingSocket.ts`, polling in `NotificationsContext.tsx`) actually firing, or silently failing too?
* Is the socket being recreated on every render instead of once per `conversationId`/session (check the `useEffect` dependency array)?
* Are messages/notifications being deduped correctly by `id`/`clientMessageId`, or are duplicates appearing on reconnect?

Response: **Realtime Recovery** — confirm which transport (socket vs. HTTP) actually delivered or dropped the data before touching either.

## Failure Mode 4 — State Management Failure

Signs: UI shows stale data after a mutation, two screens disagree about the same application/conversation, a manual refresh "fixes" it temporarily.

Check: is the same data duplicated into more than one piece of local state instead of having one source of truth (context, or a single hook's state)?

Response: **State Recovery** — identify the one place that should own this data, recommend what to remove.

## Failure Mode 5 — Navigation Failure

Signs: wrong screen opens, back behavior wrong, deep link/OAuth redirect lands in the wrong place.

Check: route group boundaries (`(auth)` vs `(root)`), the OAuth `redirectUrl` in `lib/auth.ts` (`Linking.createURL("/(root)/home")`), stack vs. modal usage.

Response: **Navigation Recovery** — map current flow vs. expected flow, identify the wrong route/param.

## Failure Mode 6 — External API / Backend Failure

Signs: every request fails the same way regardless of platform, error responses are 5xx or timeouts, behavior matches a cold start (first request after idle is slow/fails, then it's fine).

This repo doesn't own the backend (`quickhands-api.onrender.com`). Render free/low tiers cold-start after idle — slow or failing first requests after inactivity look like a client bug but aren't.

Check: does `lib/fetch.ts#fetchAPI` get a real HTTP error response, or does the request never complete? Is the failure consistent across every endpoint (backend down/cold) or isolated to one endpoint (backend bug, file an issue against the API instead of patching the client)?

Response: **Backend Recovery** — do not paper over a backend failure with client-side retries/mocks unless explicitly asked; identify and name the layer that's actually wrong.

## Failure Mode 7 — Polluted Development Session

Signs: five or more fix attempts, new bugs appearing, original issue unclear, multiple unrelated changes stacked up.

Response: **Hard Reset** — stop patching, write a reset note (original goal, what works, what failed, lessons learned, rebuild strategy), wait for developer confirmation before rebuilding.

## Failure Mode 8 — Wrong Architecture

Signs: the code works but the approach can't scale or contradicts [[quickhands-architect]] decisions (e.g. local state replacing the realtime+fallback pattern, a new screen bypassing `lib/fetch.ts`).

Response: **Rethink** — name the wrong assumption, what can be salvaged, propose new architecture, wait for confirmation before rebuilding.

---

# Report Format

```text
Diagnosis:

Failure Mode: [type]

Reason:
[explanation, naming the specific layer/file]

Recommended Recovery:
[strategy]
```

---

# Recovery Principle

Never fix what you haven't diagnosed. Never patch a backend problem in the client, or a token-timing problem with a delay, or a socket problem by polling harder without checking why the socket dropped. Find the layer that actually failed.

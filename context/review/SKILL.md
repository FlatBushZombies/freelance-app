---
name: review
description: After building a feature in Quickhands Pro, verify it matches what was planned, respects this project's architecture and design system, and is ready for production. Reports issues clearly so the developer decides what to fix.
---

Building is not done when the code runs. It is done when the code is correct. Run this after every feature, before moving on.

## What This Skill Does Not Do

It does not fix anything. It reports what it finds and lets the developer decide. Fixing without understanding is how problems get buried, not solved.

---

## Step 1 — Understand What Should Have Been Built

Read, in order: the implementation plan if one exists, the feature description/task given, and the relevant context file(s) under `context/` (especially [[quickhands-architect]] for product rules and [[quickhands-imprint]] for design tokens).

If no plan exists, ask the developer to describe the intended behavior before reviewing.

---

## Step 2 — Review in Three Layers

### Layer 1 — Does it match the plan?

* Is every part of the feature description present?
* Are the decisions made during planning reflected in the code?
* Did the implementation stay in scope, or add things that weren't asked for?

Flag anything planned-but-missing, and anything built-but-not-planned.

### Layer 2 — Does it respect the system?

This is where drift happens most. Check against this project's actual conventions:

* **Networking** — does every API call go through `lib/fetch.ts` (`fetchAPI`/`getApiUrl`/`useFetch`), or does something call raw `fetch()` and bypass base-URL/error handling?
* **Auth timing** — does any authenticated call use `getToken()` directly instead of `waitForClerkToken` (`lib/session.ts`)? That's a known source of intermittent 401s in this app.
* **Realtime** — if the feature touches messaging or notifications, does it follow the socket-with-HTTP-fallback pattern (`useMessagingSocket.ts`, `NotificationsContext.tsx`), dedupe by id, and respect `isUnsupportedSocketHost`?
* **Routing** — is the screen in the correct Expo Router group (`(auth)` vs `(root)`)? Does it avoid hardcoding routes that should use `Linking.createURL` or typed routes?
* **Design tokens** — does it use the declared `primary`/`error`/`success` colors and `font-quicksand*` classes, or does it introduce another one-off palette/inline `fontFamily`? (See [[quickhands-imprint]] for the existing, accepted drift — new drift is what to flag.)
* **State ownership** — is server data duplicated into more than one piece of local state instead of having a single source of truth?

### Layer 3 — Is it production ready?

* Error handling — does a failed request fail loudly to logs but gracefully to the user (no raw error strings surfaced in UI), or does it fail silently?
* Edge cases — empty states (title + description + action, matching the `ApplicationRadar` empty-state pattern), loading states, missing/partial data from the API.
* Platform — does anything behave differently on iOS vs. Android vs. web that wasn't accounted for?
* Obvious bugs — anything that would clearly break for a real client or freelancer using the app.

---

## Step 3 — Report What You Found

```
## Review — [Feature Name]

### Layer 1 — Plan alignment
[PASS / ISSUES FOUND]

### Layer 2 — System integrity
[PASS / ISSUES FOUND]

### Layer 3 — Production readiness
[PASS / ISSUES FOUND]

### Summary
[X] issues found across [Y] layers.
[If none: "No issues found. This feature is ready to ship."]
```

---

## Step 4 — Let the Developer Decide

Stop after the report. Don't start fixing. Wait for the developer to ask for a specific fix, confirm an issue is intentional, or confirm it's ready to move on.

---

## Severity Guide

**Critical — fix before moving on**
* Bypassing `lib/fetch.ts` or `waitForClerkToken` in a way that will cause intermittent failures
* Realtime feature with no HTTP fallback
* Planned functionality that's completely missing

**Important — fix soon**
* New one-off colors/fonts instead of declared tokens
* Server state duplicated across multiple local states
* Edge cases a real client/freelancer will hit (empty applications, no network, cold-start backend)

**Minor — fix when convenient**
* Naming inconsistencies that don't affect behavior
* Missing optimizations
* Style issues that don't affect the design system

Label each issue with severity so the developer can triage quickly. The question isn't "does it work" — it's "is it correct."

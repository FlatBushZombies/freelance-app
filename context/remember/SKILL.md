---

name: quickhands-remember
description: Save critical Quickhands Pro project context at the end of a session and restore it at the start of a new one. Preserve architecture, feature progress, design decisions, and next actions without storing secrets.
----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Quickhands Pro spans Expo Router screens, Clerk auth, a NativeWind design layer, Socket.IO realtime, and an external API this repo doesn't own. Without a reliable handoff, every session re-discovers the same context.

Run this at the end of a session to save. Run it at the start of a session to restore.

---

# Security Boundary

Never store:

* Clerk secret keys
* Any backend/database credentials (even though `@neondatabase/serverless` is unused in this repo, never record a connection string if one surfaces)
* Session tokens / Clerk session ids
* Render/EAS deployment credentials
* Actual values of any `.env` variable

The `EXPO_PUBLIC_*` variables (`EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_SOCKET_URL`, `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`) are client-exposed by design, but still record only their *names*, never their values — treat `[REDACTED]` as the default when uncertain.

---

# How To Invoke

Save:

```bash
/quickhands-remember save
```

Restore:

```bash
/quickhands-remember restore
```

If invoked with no argument, ask whether to save or restore.

---

# Save Mode

Review the current session. Capture only what's needed to resume work later — not a transcript, not full code.

## Product State

What's complete: which flows (application, messaging, notifications, wallet, onboarding) are wired to the real backend vs. still mocked (e.g. `WalletComponent.tsx` is mock data as of this writing).

## Screens/Files Touched

Be specific with paths, e.g.:

```text
contexts/NotificationsContext.tsx
hooks/useMessagingSocket.ts
components/messaging/ConversationChatScreen.tsx
```

## Architecture Decisions

Only decisions future work depends on, e.g.:

```text
All API calls go through lib/fetch.ts (fetchAPI/getApiUrl), not raw fetch().
Realtime uses socket.io-client with an HTTP fallback when the socket can't connect.
Authenticated calls must use waitForClerkToken, not a bare getToken() call.
```

## Design System Decisions

```text
Primary: #111827   Error: #F14141   Success: #2F9B65
Font family: Quicksand (note: font-loading key casing mismatch in app/_layout.tsx vs tailwind.config.js — see context/imprint/SKILL.md)
```

## Problems Solved

Difficult discoveries worth not re-debugging, e.g.:

```text
Sockets disabled against *.vercel.app hosts (isUnsupportedSocketHost) because serverless can't hold a persistent WebSocket.
Notification toasts deduped by merging on notification.id to avoid re-toasting on reconnect/poll overlap.
```

## Current State

What works, what's partial, what's known broken.

## Next Session Starts With

Exactly one actionable next step.

## Open Questions

Unresolved product/architecture decisions.

---

# What Not To Capture

Source code, large snippets, generated UI, build logs, secrets. Only what future work depends on.

---

# Where To Save

```text
memory.md
```

In the project root. One file, always representing the latest session. If it already exists, summarize its current contents and ask before overwriting.

---

# Memory Format

```markdown
# Quickhands Pro Project Memory

Last Updated: [date]

## Product
[summary]

## Features Completed
[list — note real-backend vs. mocked]

## Files Touched This Session
[list]

## Architecture Decisions
[list]

## Design System Decisions
Primary: #111827 / Error: #F14141 / Success: #2F9B65
[list]

## Problems Solved
[list]

## Current State
[list]

## Next Session Starts With
[single actionable task]

## Open Questions
[list]
```

---

# Restore Mode

1. Look for `memory.md`. If missing, say so and stop — this is a new/uninitialized memory, use `save` at the end of this session.
2. Read, in order: `memory.md`, `CLAUDE.md`, `context/architecture/SKILL.md`, `context/imprint/SKILL.md`, `app-registry.md` (if present). Don't scan the whole repo.
3. Build understanding of product state, architecture decisions, design tokens, and the next task.
4. Present a summary and wait for confirmation before starting work:

```text
Memory restored.

Product: [summary]
Current State: [summary]
Architecture: [summary]
Design System: Primary #111827 / Error #F14141 / Success #2F9B65
Next Task: [summary]
Open Questions: [summary]

Is this correct? Say yes to continue or provide corrections.
```

Never guess or invent context that isn't in the memory file.

---

# Rule

Every session ends with `/quickhands-remember save`. Every session starts with `/quickhands-remember restore`. Consistency across sessions comes from disciplined handoff, not from re-reading the whole codebase each time.

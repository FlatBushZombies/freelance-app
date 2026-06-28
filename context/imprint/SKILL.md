---

name: quickhands-imprint
description: After building any Quickhands Pro screen, component, or feature, extract design system, navigation, and architecture patterns into app-registry.md so future screens stay consistent, and flag drift from the project's declared design tokens.
-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

React Native apps drift fast when screens are built independently — different spacing, different button styles, different one-off hex colors. This skill captures what was actually built and checks it against the design tokens this project already declares, so the drift gets caught instead of compounding.

Run it after building any screen, feature, component, or flow.

---

# Declared Design Tokens

These come from `tailwind.config.js` and are the source of truth:

## Brand Colors

```text
primary: #111827
error:   #F14141
success: #2F9B65
```

## Font Family

```text
font-quicksand          Quicksand-Regular
font-quicksand-bold      Quicksand-Bold
font-quicksand-semibold  Quicksand-SemiBold
font-quicksand-light     Quicksand-Light
font-quicksand-medium    Quicksand-Medium
```

---

# Known Drift — Check For This Every Time

## Font Loading Case Mismatch

`app/_layout.tsx` loads fonts under these keys:

```text
Quicksand-Bold
QuickSand-Medium
QuickSand-Regular
QuickSand-SemiBold
QuickSand-Light
```

`tailwind.config.js` declares the family names as:

```text
Quicksand-Regular
Quicksand-Bold
Quicksand-SemiBold
Quicksand-Light
Quicksand-Medium
```

Every key except `Bold` has a casing mismatch (`QuickSand` vs `Quicksand`). This means `className="font-quicksand"` (and every weight except bold) likely silently falls back to the system font on at least one platform, while components that set `style={{ fontFamily: "Quicksand-Bold" }}` directly (e.g. `ApplicationRadar.tsx`) work correctly because they bypass Tailwind's family name. **Flag this every audit** until it's fixed — don't silently "work around" it by adding more inline `fontFamily` styles, since that's how `ApplicationRadar.tsx` ended up styled entirely inline instead of via NativeWind classes.

## Ad-Hoc Color Usage

Several existing components don't use the declared `primary`/`error`/`success` tokens at all:

* `components/ApplicationModal.tsx` — `indigo-600`, `blue-50`, `indigo-700`
* `components/ApplicationRadar.tsx` — inline hex (`#2D4A6A`, `#2E7D52`, `#C2410C`, `#EBEff2`, etc.)
* `components/WalletComponent.tsx` — `blue-600`/`purple-600` gradient, `green-600`, `red-600`, `yellow-600`

This is existing, accepted drift — not something to "fix" opportunistically mid-feature. But every new screen should be checked against it: does it introduce *another* one-off palette, or does it converge toward the declared tokens? Flag new one-off hex/Tailwind-color usage that isn't `primary`/`error`/`success` so the developer can decide whether it's intentional.

---

# How To Invoke

After creating a screen:

```bash
/quickhands-imprint
```

Specific file:

```bash
/quickhands-imprint components/SomeScreen.tsx
```

Audit application:

```bash
/quickhands-imprint audit
```

---

# Step 1 — Discover What Was Built

Read the screen or component. Identify:

* Purpose and primary action
* Navigation behavior (which Expo Router segment it lives in: `(auth)` or `(root)`)
* Data source (`lib/fetch.ts` call, `useFetch`, a messaging/notifications hook, or local-only state)
* Component composition
* Loading / empty / error states

If no screen can be identified, ask which file to capture patterns from.

---

# Step 2 — Extract Patterns

## Screen Structure

Capture: SafeArea usage, ScrollView/FlatList usage, screen padding, header structure, section spacing.

## Navigation

Capture: which route group it belongs to, modal vs. stack vs. tab, how it gets there (e.g. `onOpenChat` callback into `ConversationChatScreen`), back behavior.

## Design System

Capture: which colors were used and whether they're the declared tokens or one-offs, border radius, font classes vs. inline `fontFamily`, shadows/elevation.

## Networking & State

Capture: did it go through `lib/fetch.ts` (`fetchAPI`/`getApiUrl`/`useFetch`) or call `fetch()` directly? Did it use `waitForClerkToken` before an authenticated call? Is server state duplicated into local component state in a way that will go stale?

## Realtime

If the feature touches messaging or notifications: does it respect `isUnsupportedSocketHost`, does it fall back to HTTP when the socket isn't connected, does it dedupe by `id`/`clientMessageId` the way `useMessagingSocket.ts` does?

## Loading / Empty / Error States

Every empty state should have a title, description, and (where relevant) an action — see `ApplicationRadar.tsx`'s empty state as the existing pattern. Error states should never expose raw error messages to the user; they're already only logged via `console.error`.

---

# Step 3 — Write To app-registry.md

Create `app-registry.md` in the project root if missing. Append new patterns, update existing entries, never duplicate.

```markdown
## [Screen or Component Name]

File: [path]
Last Updated: [date]

### Layout
| Property | Value |
|----------|-------|

### Navigation
[patterns]

### Design Tokens Used
[declared tokens used] / [one-offs introduced, if any]

### Networking
[fetch path, auth handling, realtime behavior]

### States
Loading: ...
Empty: ...
Error: ...

### Notes
[reusable decisions]
```

---

# Step 4 — Confirm Capture

```text
Imprinted [Name] → app-registry.md

Captured:
- Layout patterns
- Navigation patterns
- Design token usage (declared vs. one-off)
- Networking/realtime patterns
- Loading/empty/error states

Flags:
[any new one-off colors, any font-loading workarounds, any direct fetch() bypassing lib/fetch.ts]
```

---

# Rule

Build screen. Run `/quickhands-imprint`. Update `app-registry.md`. Every screen, every feature, every time — consistency comes from the registry, not from memory.

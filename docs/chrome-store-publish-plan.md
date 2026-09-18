# Prepare FocusSpace config for Chrome Web Store publication

## Context

The extension is about to be submitted to the Chrome Web Store for the first time. `docs/chrome-store-listing-revised.md` is the audited listing copy and it flags a hard blocker: the built manifest currently requests permissions the code never uses (`audio`, `bookmarks`, `browsingData`, `downloads`) plus `host_permissions: ["https://*/*"]`. Shipping unused permissions is the most common Minimum Permissions rejection. Beyond that, the app metadata (name, description, version, author) still reflects the pre-release scaffold.

Verified against the code (`background.ts`, `lib/tabs.ts`, `lib/history.ts`, `store/store.ts`): the only Chrome APIs used are `alarms`, `history`, `notifications`, `storage`, `tabs`. `lib/bookmarks.ts` is empty. Onboarding is opened with `chrome.tabs.create(chrome.runtime.getURL("static/onboarding.html"))` from `background.ts:118` and `lib/utils.ts:15`, so the `web_accessible_resources` entry scoped to `mail.google.com` is a dead leftover.

User decisions (already made):
- Store name: **Option A** → `FocusSpace: Pomodoro Timer, History Wipe & Tab Cleaner`
- Summary: **Option 4** → `Close distracting tabs, clear history, and stay in deep work with a Pomodoro timer. 100% local, open source, and zero tracking.` (124 chars)
- Version: **1.0.0**
- Extras: add `PRIVACY.md` and `LICENSE` (GPLv3)

## Changes

### 1. `package.json` (the manifest source for Plasmo)

Top-level fields:
- `displayName` → `"FocusSpace: Pomodoro Timer, History Wipe & Tab Cleaner"`
- `version` → `"1.0.0"`
- `description` → Option 4 text above
- `author` → `"Jose Orono <joseomaker@gmail.com>"` (drop the leading space)
- add `"homepage": "https://focusspace-web.vercel.app/"`, `"repository": "github:joseorono/focus-space"`, `"license": "GPL-3.0"` (npm metadata; harmless, documents the claims made in the listing)

`manifest` override block, replace wholesale with:
```json
"manifest": {
  "short_name": "FocusSpace",
  "homepage_url": "https://focusspace-web.vercel.app/",
  "author": { "email": "joseomaker@gmail.com" },
  "permissions": ["alarms", "history", "notifications", "storage", "tabs"]
}
```
- Removes `host_permissions` entirely.
- Removes `web_accessible_resources` entirely (see Context; the onboarding page is still bundled because Plasmo copies `static/` and the background script references it).
- `author` as an object matches Chrome's documented manifest shape; Plasmo spreads the `manifest` block last so it overrides the string derived from the npm `author` field. Confirm in the built manifest during verification.

### 2. Version sync
- `.env.production`, `.env.development`, `.env.example`: `PLASMO_PUBLIC_VERSION = 1.0.0` (the variable is not read anywhere in code, but keep it consistent).
- `package-lock.json` lines 3 and 9: `"version": "1.0.0"` so the lockfile does not drift from `package.json`.

### 3. New `PRIVACY.md` (repo root)
Plain-English policy the user can link from the CWS dashboard "Privacy policy" field. Content, derived from section 5 of the listing doc:
- What the extension does (single-purpose statement).
- Data handling: everything stays in `chrome.storage.local`; no network requests, no analytics, no accounts, no third-party sharing.
- Per-permission explanation using the 5-row justification table from the doc.
- What "clear history" and "close tabs" actually do (they act on the user's own browser data on the user's explicit click; nothing is read back or stored).
- Contact: GitHub issues URL. Effective date 2026-09-17.

### 4. New `LICENSE` (repo root)
Verbatim GPLv3 text. Fetch it from `https://www.gnu.org/licenses/gpl-3.0.txt` at execution time (WebFetch or `curl -o LICENSE ...`) rather than typing it. Do not paraphrase.

### 5. `README.md` small touches
- Fix "Building for Production": `pnpm build` produces the folder; `pnpm package` produces the zip.
- Add a short "License" section (GPLv3, link to LICENSE) and a "Privacy" line linking `PRIVACY.md`.

## Deviations applied during implementation
- npm `name` was renamed `clean-my-history` → `focus-space` (both lockfile entries, plus the
  notification `tag` in `lib/notification.ts` and the `docs/todo.md` heading).
- The manifest `author` object override was **removed**: Plasmo 0.84 / Parcel rejects the object
  form with "Invalid Web Extension manifest". Plasmo derives a string `author` from the npm
  `author` field instead, which is its default output shape.
- Removing `web_accessible_resources` also removed the only thing that pulled
  `static/onboarding.html` into the bundle, so the build and package scripts now chain
  `node scripts/sync-onboarding.js prod`. The script takes a `dev|prod` argument.

## Not changing (deliberately)
- `static/onboarding.html` store links still point at a search URL; swap to the real listing URL after the first publish (follow-up).
- `static/onboarding.html` links `../style.css`, which no build emits. The page carries a complete
  inline `<style>` block, so it renders correctly and the dangling link is a pre-existing 404.
- `.github/workflows/submit.yml` pins Node 16; only matters if the automated publish action is used later.

## Verification
1. `pnpm build`, then open `build/chrome-mv3-prod/manifest.json` and confirm:
   - `permissions` is exactly `["alarms","history","notifications","storage","tabs"]`
   - no `host_permissions`, no `web_accessible_resources`
   - `name`, `short_name`, `version` = 1.0.0, `description`, `homepage_url`, `author` as specified
2. Check description length ≤ 132: `node -e "console.log(require('./package.json').description.length)"`
3. Confirm `build/chrome-mv3-prod/static/onboarding.html` still exists after the build.
4. Load `build/chrome-mv3-prod` unpacked in Chrome, then: install-time onboarding tab opens; popup renders; Session Cleaner closes a matching tab; Browser Cleaner clears a 15-minute range; start a 1-minute Pomodoro and confirm the alarm-driven notification fires.
5. `pnpm package` produces `build/chrome-mv3-prod.zip`; that is the upload artifact.

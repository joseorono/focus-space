# FocusSpace — Bundle Size & Chrome Web Store Compliance

Measured on 2026-09-14 against `plasmo build` (v0.84.0) output, using
`source-map-explorer` via `npm run visualize-bundle:json`. Every number here came out of a
command — nothing is estimated.

**Verdict: compliant, with room to spare.** The submission ZIP is **380.5 KB** against
Google's **2 GB** package limit — 0.018% of it. Size will never be what gets this extension
rejected. Measuring it did, however, turn up two things that _would_ have caused problems at
submission time, plus 388 KB of fonts we were shipping and never rendering. All three are
fixed; see [What changed](#what-changed).

---

## 📊 The numbers

|                         | Value                        |
| ----------------------- | ---------------------------- |
| **Submission ZIP**      | **380.5 KB** (389,624 bytes) |
| Unpacked build          | 1,077.1 KB across 20 files   |
| Compression ratio       | 2.8×                         |
| Share of the 2 GB limit | 0.018%                       |

### Unpacked build, by category

| Category          | Size           | Files  | Share |
| ----------------- | -------------- | ------ | ----- |
| JavaScript        | 907.5 KB       | 2      | 84.2% |
| Fonts (woff2)     | 108.0 KB       | 8      | 10.0% |
| HTML              | 31.1 KB        | 2      | 2.9%  |
| CSS               | 19.0 KB        | 1      | 1.8%  |
| Icons (PNG + SVG) | 10.7 KB        | 6      | 1.0%  |
| `manifest.json`   | 0.9 KB         | 1      | 0.1%  |
| **Total**         | **1,077.1 KB** | **20** |       |

JavaScript is 84% of the package and `popup.js` is essentially all of it — the background
service worker is only 14.3 KB.

### What's inside `popup.js` (907.6 KB total, 99.5% mapped)

| Package                                | Size        | Share    |
| -------------------------------------- | ----------- | -------- |
| `@mui/material`                        | 207.5 KB    | 22.9%    |
| _(unmapped — Parcel runtime, helpers)_ | 188.5 KB    | 20.8%    |
| `react-dom`                            | 126.0 KB    | 13.9%    |
| **our own source**                     | **66.6 KB** | **7.3%** |
| `@mui/system`                          | 33.5 KB     | 3.7%     |
| `@tanstack/query-core`                 | 33.0 KB     | 3.6%     |
| `@popperjs/core`                       | 29.1 KB     | 3.2%     |
| `tailwind-merge`                       | 25.2 KB     | 2.8%     |
| `@mui/base`                            | 21.8 KB     | 2.4%     |
| `@reduxjs/toolkit`                     | 19.8 KB     | 2.2%     |
| _(41 others)_                          | 146.6 KB    | 16.2%    |

Grouped, the picture is blunter:

| Stack         | Size        | Share    |
| ------------- | ----------- | -------- |
| MUI + Emotion | 309.5 KB    | 34.1%    |
| React runtime | 136.6 KB    | 15.0%    |
| Redux         | 31.8 KB     | 3.5%     |
| **Our code**  | **66.6 KB** | **7.3%** |

We write 7% of what we ship. That is normal for a React app and not a problem at this size —
but it's the reason any real reduction has to come from dependencies, not from our own files.

---

## ✅ Compliance against Google's limits

| Requirement             | Limit                        | FocusSpace                | Status    |
| ----------------------- | ---------------------------- | ------------------------- | --------- |
| Extension package (ZIP) | 2 GB                         | 380.5 KB                  | ✅ 0.018% |
| `manifest.description`  | 132 chars                    | 115                       | ✅        |
| `manifest.name`         | 75 chars                     | 10 (`FocusSpace`)         | ✅        |
| Store icon              | 128×128 PNG                  | present (16/32/48/64/128) | ✅        |
| Obfuscated code         | Banned; minification allowed | minified, not obfuscated  | ✅        |
| Manifest version        | MV3 required                 | `manifest_version: 3`     | ✅        |
| Manifest at ZIP root    | required                     | yes                       | ✅        |

Listing assets (screenshots at 1280×800 or 640×400, a 440×280 small promo tile) are a
_listing_ requirement, not a package one — they're uploaded separately in the dashboard and
don't count toward the 380 KB. Tracked in [chrome-store-listing.md](chrome-store-listing.md).

---

## 🔧 What changed

### 1. `visualize-bundle` was leaving the build dir unshippable

`npm run visualize-bundle` runs `plasmo build --source-maps`. That writes a **5.2 MB**
`popup.js.map` next to the bundle _and_ leaves `//# sourceMappingURL=` comments in the
shipped JS. Zipping `build/chrome-mv3-prod` after running it would have shipped the complete
original source of the extension to the Web Store — a 5 MB package that hands a reviewer, and
anyone who downloads the CRX, every file we wrote.

Nothing prevented that, because there was no packaging step at all. Which was the next problem.

### 2. `.github/workflows/submit.yml` could not have worked

The workflow runs `pnpm package` at line 28 and hands `build/chrome-mv3-prod.zip` to the
Plasmo publish action. There was **no `package` script in `package.json`** — Plasmo's own
scaffold generates one, this repo never had it. The automated submission path was broken.

Added:

```json
"package": "node -e \"require('fs').rmSync('build/chrome-mv3-prod',{recursive:true,force:true})\" && plasmo build && plasmo package"
```

The `rmSync` is what closes problem #1: the ZIP is always built from an empty directory, so
stale source maps from a `visualize-bundle` run can't survive into a submission. No new
dependency, and it works on Windows and the Ubuntu runner.

> Deliberately **not** a `prepackage` hook: pnpm 7+ defaults `enable-pre-post-scripts` to
> false, and CI runs pnpm, so a pre-hook would silently never fire.

### 3. 78% of the font payload was never rendered

`style.css` imported `@fontsource/roboto/{300,400,500,700}.css`. Each of those declares one
`@font-face` **per subset** — cyrillic, cyrillic-ext, greek, greek-ext, vietnamese, latin-ext,
latin — in both woff2 and woff. That's 7 × 2 × 4 = **56 files, 489.9 KB**.

`unicode-range` stops the browser _downloading_ a subset it doesn't need. It does not stop
Parcel _packaging_ it, and the Web Store weighs the package.

| Subset       | woff2   | woff    | Total    |
| ------------ | ------- | ------- | -------- |
| latin        | 61.8 KB | 56.5 KB | 118.2 KB |
| cyrillic-ext | 58.6 KB | 52.6 KB | 111.2 KB |
| latin-ext    | 46.2 KB | 40.0 KB | 86.1 KB  |
| cyrillic     | 37.8 KB | 33.4 KB | 71.2 KB  |
| greek        | 27.5 KB | 24.8 KB | 52.3 KB  |
| vietnamese   | 21.7 KB | 18.5 KB | 40.2 KB  |
| greek-ext    | 5.8 KB  | 4.9 KB  | 10.6 KB  |

The four imports were replaced with eight hand-written `@font-face` rules: latin and
latin-ext only, at the four weights actually used, **woff2 only**. The `unicode-range` values
are copied verbatim from `@fontsource/roboto`, so glyph matching is unchanged. The `.woff`
copies were pure dead weight — MV3 requires Chrome 88+ and woff2 has shipped since Chrome 36.

**489.9 KB / 56 files → 108.0 KB / 8 files. Saves 382 KB.**

> **Behavioral note.** FocusSpace renders tab titles and history entries, which can be in any
> script. Text in Cyrillic, Greek or Vietnamese now falls back to the system sans-serif
> instead of Roboto. This extends behavior that already existed — Roboto never covered CJK,
> Arabic or Hebrew — and affects only how such titles look, never whether they're readable.
> Verified in Chrome: all four weights, Spanish accented text (`áéíóúñü ¿ ¡`) and latin-ext
> (`Ćwiczenie Żółć Đà Ħ Ŧ`) all render in Roboto; Cyrillic falls back cleanly.

### Net effect

|                  | Before           | After      | Δ                |
| ---------------- | ---------------- | ---------- | ---------------- |
| Unpacked build   | 1,465.0 KB       | 1,077.1 KB | −387.9 KB (−26%) |
| Files in package | 68               | 20         | −48              |
| Font payload     | 489.9 KB         | 108.0 KB   | −382.0 KB (−78%) |
| Submission ZIP   | _never produced_ | 380.5 KB   | —                |

---

## 📋 Recommendations (not done)

**Fix CI before the next submission.** `.github/workflows/submit.yml` pins **Node 16**, which
is end-of-life, and installs with `pnpm` + `run_install: true` against a `pnpm-lock.yaml` last
touched in Oct 2025. That lockfile predates the `source-map-explorer` devDependency, so a
frozen-lockfile install will fail. The repo now carries both `package-lock.json` (maintained)
and `pnpm-lock.yaml` (stale) — pick one. Switching CI to `npm ci` on Node 20+ matches what's
actually being maintained locally.

**The MUI question.** `@mui/material` + `@mui/system` + `@mui/base` + Emotion is 309.5 KB,
34% of the JS, and the app also ships Tailwind (`tailwind-merge`, 25.2 KB, plus the generated
CSS). Two styling systems for one popup. Consolidating on Tailwind would be the single
largest reduction available — and the largest amount of work. Not urgent: at 380 KB zipped
there's no compliance pressure, and popup startup is already fast. Worth doing when a
redesign makes it cheap, not as a standalone project.

**Small cleanups.** `assets/logos/cubo1.svg` is referenced nowhere. `docs/improvements.md` is
linked from `README.md` and `docs/todo.md` but has never existed.

---

## 🔁 Reproducing this

```bash
npm run visualize-bundle        # interactive treemap -> bundle-stats.html
npm run visualize-bundle:json   # raw data -> bundle-stats.json
npm run visualize-bundle:cli    # TSV to stdout
npm run package                 # clean build + build/chrome-mv3-prod.zip
```

All three `visualize-bundle` variants run `plasmo build --source-maps` first, because
`plasmo build` emits no source maps by default and `source-map-explorer` needs them. They pass
`--no-border-checks`: Parcel's maps trip the tool's boundary validation on the last column of
the minified line, which is cosmetic. Mapping coverage is 99.5% on `popup.js` and 99.97% on
the service worker.

**After running any of them, run `npm run package` before submitting anything** — or just use
`npm run package`, which rebuilds clean on its own. `bundle-stats.html` and `bundle-stats.json`
are gitignored.

---

## Sources

- [Publish in the Chrome Web Store](https://developer.chrome.com/docs/webstore/publish) — the 2 GB package limit
- [Prepare your extension](https://developer.chrome.com/docs/webstore/prepare/) — 132-char description, manifest at ZIP root
- [Supplying images](https://developer.chrome.com/docs/webstore/images) — icon and listing asset dimensions
- [Code Readability Requirements](https://developer.chrome.com/docs/webstore/program-policies/code-readability) — obfuscation banned, minification allowed

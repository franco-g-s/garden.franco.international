# Personal Web Presence Roadmap

## Overview

A full rebrand of `franco.international` from a standalone digital garden into a **three-site personal hub**:

| Site                          | Repo                                           | Purpose                                     |
| ----------------------------- | ---------------------------------------------- | ------------------------------------------- |
| `franco.international`        | `franco.international` (new, replaces current) | Personal hub — landing page + section links |
| `garden.franco.international` | `franco.international` (current repo, renamed) | Digital garden (Quartz)                     |
| `cv.franco.international`     | `cv.franco.international` (new)                | Standalone CV                               |

**Tech stack:**

- `franco.international` → **Astro** (static, GitHub Pages)
- `cv.franco.international` → **Plain HTML/CSS** (single page, printable)
- `garden.franco.international` → **Quartz v4** (existing, no framework change)

---

## Phase 1: cv.franco.international ✅ **COMPLETE**

### Goal

A clean, Apple-inspired black-on-white CV page sourced from `/Personal/CV.md` in the private Obsidian vault. Printable to PDF via a print button.

### Tasks

- [x] Create new GitHub repo: `cv.franco.international`
- [x] Build HTML/CSS CV page from vault CV content
  - [x] Header: name, location, email, LinkedIn
  - [x] Sections: About, Education, Experience, Skills, International Background
  - [x] Apple-inspired typography and spacing (Inter, tight kerning, generous whitespace)
  - [x] Accent color: subtle blue (`#0066cc`) — section labels, links
  - [x] Print styles: `@media print` — hide print button, clean margins, no orphaned gaps
  - [x] Print button: `window.print()`
- [x] Set up GitHub Pages deployment (GitHub Actions workflow)
- [x] Configure DNS: `cv.franco.international` → GitHub Pages _(add CNAME `cv` → `franco-g-s.github.io` in DNS, then set custom domain in repo settings)_
- [x] Test print to PDF output

### Future (Phase 4+)

- Interactive CV with timeline, expandable roles, filterable skills
- Print button that downloads a rendered PDF of the interactive version

---

## Phase 2: garden.franco.international migration ✅ **COMPLETE**

### Goal

Move the existing Quartz digital garden from `franco.international` to `garden.franco.international` with zero content changes.

### Tasks

- [x] Add JSON feed emitter to Quartz (`quartz/plugins/emitters/jsonFeed.ts`) — outputs `/notes.json` with title, slug, date, description sorted by date
- [x] Update GitHub Pages custom domain on the Quartz repo → `garden.franco.international`
- [x] Configure DNS: `garden.franco.international` CNAME → `franco-g-s.github.io`
- [x] Set up temporary redirect: `franco.international` → `garden.franco.international` (placeholder hub repo `franco-international-hub`)
- [x] Verify SSL + propagation
- [x] Update the Obsidian vault note `Digital Garden - garden.franco.international.md` with new URL

---

## Phase 3: franco.international hub ✅ **COMPLETE**

### Goal

A custom Astro site that is the main face of the personal web presence. Minimal, clean, white. Three sections below the landing screen.

### Landing Screen — Floating Photos

**Animation concept: "harbor bobbing"**

Photos are anchored at fixed positions around the name. Each photo oscillates around its anchor using overlapping sine waves — simulating the motion of a boat on water. The name text is completely stationary.

Implementation:

- Each photo gets a random anchor position (screensaver-style spread, not grid)
- Per-photo randomized parameters: amplitude (5–15px), frequency (slow, 0.3–0.8 rad/s), phase offset
- Two overlapping sine waves per axis (X and Y) for organic, non-repetitive feel
- Gentle rotation oscillation (±3–5°)
- Driven by `requestAnimationFrame` with a shared time counter
- No physics engine needed — pure math

Photos: personal photos from various life moments (outdoor/sports/travel), displayed as slightly rounded rectangles with a subtle drop shadow.

**Layout:**

- White background (`#ffffff` or near-white)
- Name centered: `Franco Gómez Schumacher` in a large, clean serif or weight-contrast sans
- ~10–12 photos scattered in a roughly even spread around the name
- Photos do not obscure the name at rest (layout checked for overlap with name bounding box)
- No scroll indicator needed — sections reveal naturally on scroll

### Scroll Sections

All sections follow the same minimal aesthetic as the landing — lots of whitespace, nothing crowded.

**Section 1: Digital Garden**

- Headline: "Garden" or "Notes"
- 3 most recent notes pulled from `garden.franco.international/index.json` at Astro build time
- Each note: title + date, subtle underline link
- "Visit the garden →" link

**Section 2: CV**

- Headline: "About" or "CV"
- 3–4 highlight lines pulled from CV content at build time (current role/internship, education, location)
- "Full CV →" link to `cv.franco.international`

**Section 3: Elsewhere**

- Headline: "Elsewhere" or "Find me"
- Clean icon + label links: Instagram, YouTube, Strava, LinkedIn, GitHub
- Static links for now (see future enhancement below)
- **Future:** Pull latest Strava activity at Astro build time — distance, sport type, date — displayed as a subtle live card beneath the Strava link

### Tasks

- [x] Initialize Astro project, configure GitHub Pages deploy
- [x] Implement floating photos landing screen
  - [x] Harbor-bobbing animation (layered sine waves, `requestAnimationFrame`)
  - [x] Responsive layout: name stays centered, 4 corner photos on mobile
  - [x] Photo selection: 26 photos added to `public/photos/01.jpg`–`26.jpg`, compressed to ≤300KB each
- [x] Implement scroll sections
  - [x] Build-time JSON fetch from garden feed (`notes.json`)
  - [x] CV highlights (hardcoded from CV content)
  - [x] Elsewhere section (Instagram, Strava, YouTube, LinkedIn, GitHub)
- [x] Typography and visual polish
- [x] Mobile responsiveness
- [x] Configure DNS: `franco.international` A records → GitHub Pages (pre-existing)
- [x] Verify SSL + live deploy at franco.international

---

## Phase 3.5: Hub Mobile Optimization _(future)_

### Goals

- Review and improve the mobile layout of `franco.international`
- Card and photo positions are currently shared with desktop — audit for mobile readability
- Consider dedicated mobile photo/card positions or a simplified stacked layout
- Ensure all floating elements are reachable and readable on small screens
- Test on real devices (iPhone, iPad)

---

## Phase 4: Digital Garden Revamp _(future)_

### Goals (to be defined in detail when we get here)

- Reduce coupling to private Obsidian vault structure
- Cleaner content organization
- Revisit component set (FrontmatterProperties, Explorer, Graph)
- Potentially wait for Quartz Bases PR #2292 to merge first
- Better homepage for the garden itself
- Reconsider what content gets published and how it's structured

### Hub integration (update after revamp)

Once Phase 4 defines the garden's structure, update the Digital Garden section of `franco.international` to reflect that structure:

- **Replace** the "5 most recent notes" feed with the garden's top-level areas / folders / sections (whatever the Phase 4 structure uses)
- Each floating card represents an area, not an individual note
- Cards link to the corresponding section in the garden rather than a single note
- The `notes.json` feed emitter in the garden may need to be replaced or supplemented with an `areas.json` (or equivalent) that the hub fetches at build time

---

## Decisions Log

| Date       | Decision                        | Reason                                                       |
| ---------- | ------------------------------- | ------------------------------------------------------------ |
| 2026-05-20 | 3 separate repos                | Clean separation, independent deploys                        |
| 2026-05-20 | Astro for hub                   | Build-time data fetching for garden/CV previews; scales well |
| 2026-05-20 | Plain HTML for CV               | Single page; full print control; no framework overhead       |
| 2026-05-20 | Harbor-bobbing animation        | Boats-on-water feel, photos stay anchored (not random drift) |
| 2026-05-20 | White/minimal aesthetic         | Matches concept image; zen/calm feel across all sections     |
| 2026-05-20 | Apple design language for CV    | Clean, typographic, tasteful — fits black-on-white CV        |
| 2026-05-20 | No dark mode initially          | Design focus; can add toggle later                           |
| 2026-05-20 | Strava integration (build-time) | Enrich "Elsewhere" section; pull latest activity at deploy   |

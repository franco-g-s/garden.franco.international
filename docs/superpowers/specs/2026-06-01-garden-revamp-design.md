# Garden Revamp Design

**Date:** 2026-06-01
**Status:** approved — ready for implementation planning

## Context

The garden (garden.franco.international) was originally a near-direct mirror of the private Obsidian vault, synced via a 1037-line publish script that routed notes by tag. This revamp has two goals:

1. **Decouple the garden from the vault** — no more special vault formatting for publishing (web-path properties, script-specific wikilink conventions); the garden becomes its own curated artifact
2. **Hand publishing to the Hermes Publisher agent** — which reads the vault, adapts notes intelligently for a public audience, and requests approval before publishing

The new structure is enabled by decoupling: the garden can now be organized around its own taxonomy rather than mirroring the vault's folder structure.

---

## 1. Garden Structure

### Sitemap

```
garden.franco.international/
│
├── /                         ← landing: what the garden is, section overview,
│                               link to About
│
├── /about                    ← who Franco is as a person, values, interests
│                               + link to cv.franco.international
│
├── /notes/
│   ├── index.md              ← description + recent notes Base embed
│   └── [note pages]
│
├── /projects/
│   ├── index.md              ← description + projects Base embed
│   └── [project pages]
│
├── /log/
│   ├── index.md              ← intro + full log Base (all books/films/youtube)
│   ├── /books/
│   │   ├── index.md          ← description + books Base (card view)
│   │   └── [book pages]      ← notes + ![[books.base#This Book's Notes]]
│   ├── /films/
│   │   ├── index.md          ← description + films Base (card view)
│   │   └── [film pages]      ← notes + ![[films.base#This Film's Notes]]
│   └── /youtube/
│       ├── index.md          ← description + youtube Base
│       └── [video pages]     ← only where substantial notes exist
│
└── /topics/
    ├── philosophy-and-thinking.base
    ├── wellbeing-and-growth.base
    ├── travel-and-adventure.base
    ├── society-and-systems.base
    ├── psychology.base
    ├── building.base
    └── health.base
```

**Not included in this revamp:** ETH notes (to be added in ~1 year when relevant).

### Section descriptions

| Section      | Purpose                                                                           |
| ------------ | --------------------------------------------------------------------------------- |
| **Notes**    | Short-form ideas, reflections, published thinking                                 |
| **Projects** | What Franco is building                                                           |
| **Log**      | Personal record of books read, films watched, YouTube videos                      |
| **Topics**   | Cross-cutting thematic views via Bases — 7 broad clusters                         |
| **About**    | Who Franco is as a person; not credentials (those are at cv.franco.international) |

### Landing page

- Brief intro: what the garden is and what you'll find here
- Section cards/links: Notes, Projects, Log, Topics
- Link to About
- Footer: link to cv.franco.international + GitHub, email, social links

### About page

Personal — who Franco is, what he cares about, his values and interests. Not a CV or professional profile. Includes a link to cv.franco.international.

---

## 2. Sidebar Explorer — Dual Tab

Custom Quartz component replacing the single-tab file tree explorer. Two tabs:

**Tab 1 — Content (default):** standard file tree showing Notes, Projects, Log, About. Excludes Topics, Tags, ETH.

**Tab 2 — Topics:** flat list of 7 topic cluster links → `/topics/*.base` pages.

### Topic clusters

Living taxonomy — one of the Hermes Publisher's ongoing tasks is to propose additions/removals/renames as the garden grows.

| Cluster               | Core topics                                                              |
| --------------------- | ------------------------------------------------------------------------ |
| Philosophy & Thinking | Philosophy, Buddhism, Presence, Time, Meaning, Free Will                 |
| Wellbeing & Growth    | Personal Growth, Habits, Mindfulness, Happiness, Self-Improvement        |
| Travel & Adventure    | Travel, Bikepacking, Solitude, Wilderness, Nature, Adventure             |
| Society & Systems     | Network Science, Social Networks, Complexity, Organizations, Game Theory |
| Psychology            | Psychology, Emotions, Relationships, Neuroscience, Communication         |
| Building              | Projects, Technology, AI, Automation, Coding                             |
| Health                | Exercise, Nutrition, Physical habits                                     |

### Implementation

Custom Preact component `quartz/components/DualExplorer.tsx` (~150 lines of TSX + CSS). Wraps:

- `ContentExplorer` — the existing file tree with the current filterFn (excludes `tags/` and `eth/`)
- `TopicsExplorer` — a flat list component linking to each `/topics/*.base` page

Tab state in local component state. Replaces the current `explorer` component in `quartz.config.yaml`.

---

## 3. Floating Controls

Restore the v4 `FloatingControls` component, which was dropped during the v4→v5 upgrade (dark/reader mode controls moved to the toolbar instead).

**What it is:** a fixed bottom-left frosted-glass pill (`bottom: 1rem; left: 1rem; z-index: 999`) containing the `Darkmode()` and `ReaderMode()` toggles. It uses `backdrop-filter: blur(10px)`, `border-radius: 12px`, and a subtle box-shadow. Stays visible even when reader mode is active. It's a generic wrapper — takes child components via a `components: []` option and propagates their CSS and scripts via `concatenateResources`.

**Implementation:** port `quartz/components/FloatingControls.tsx` and `quartz/components/styles/floatingcontrols.scss` from v4 to v5. The main change is updating import paths to v5 conventions (v4 used `./types`, `../util/resources`, `./styles/*.scss`). Register in `quartz.config.yaml` layout (same position as v4: `afterBody`).

**Usage in config:**

```yaml
- component: FloatingControls
  options:
    components:
      - Darkmode
      - ReaderMode
```

The existing `darkmode` and `reader-mode` entries in the toolbar can be removed once the floating controls are working.

---

## 4. Bases Setup

### Content section bases

Each section index page embeds a Base. Individual pages in Log embed a view filtered to that item.

| Base file       | Location               | Filters                                   | View  |
| --------------- | ---------------------- | ----------------------------------------- | ----- |
| `notes.base`    | `content/notes/`       | all notes, sorted by date DESC            | table |
| `projects.base` | `content/projects/`    | all projects, grouped by status           | table |
| `log.base`      | `content/log/`         | all log entries (books + films + youtube) | table |
| `books.base`    | `content/log/books/`   | books only, grouped by status             | cards |
| `films.base`    | `content/log/films/`   | films only                                | cards |
| `youtube.base`  | `content/log/youtube/` | youtube only                              | table |

Individual book/film/youtube pages embed a named view of the relevant base filtered to notes referencing that item (mirrors the `![[Notes.base#Project Notes]]` pattern already used in the vault).

### Topic bases

One `.base` file per cluster in `content/topics/`. Each filters across all sections by topic frontmatter property, mapping to the cluster's core topics.

### Folder-listing suppression

Configure Quartz `folderPage` options to suppress auto-generated file listings for Log subsections, since the Base serves as the listing. Prevents duplication of the card/table view + folder tree.

---

## 5. Hermes Publisher Integration

### Workflow

1. **Scan** — reads all vault notes with `publish: true` via vault git clone, diffs current hashes against `garden-state.json` → produces three lists: new, changed, removed
2. **Adapt** — for each new/changed note: reads full content + any unpublished notes it references (for reader context), rewrites for public audience per the rules below
3. **Route** — assigns content section + topic cluster(s) from frontmatter and content
4. **Propose** — Discord message: summary of all changes + diffs for significant rewrites; approval button (pre-action gate per Hermes §11)
5. **Publish** — on approval: commits adapted notes + updated `garden-state.json` to garden repo → GitHub Actions deploys

### garden-state.json schema

Tracks the relationship between vault sources and garden notes. Supports N:1 (multiple vault notes combined into one garden note).

```json
{
  "notes/impermanence.md": {
    "sources": ["Personal/Impermanence Gives Life Meaning.md"],
    "sourceHashes": {
      "Personal/Impermanence Gives Life Meaning.md": "d0c1aa6e"
    },
    "topics": ["philosophy-and-thinking"],
    "publishedAt": "2026-06-01"
  },
  "notes/philosophy-of-time.md": {
    "sources": ["Personal/Impermanence Gives Life Meaning.md", "Personal/The Cycle of Craving.md"],
    "sourceHashes": {
      "Personal/Impermanence Gives Life Meaning.md": "d0c1aa6e",
      "Personal/The Cycle of Craving.md": "f3a9bb12"
    },
    "topics": ["philosophy-and-thinking", "wellbeing-and-growth"],
    "publishedAt": "2026-06-01"
  }
}
```

When any source note changes, the Publisher flags all garden notes that incorporate it for re-evaluation.

### Vault MCP tool

Part of the FastMCP server planned in Hermes Setup §4.4. Tools exposed to the Publisher:

| Tool                  | Purpose                                       |
| --------------------- | --------------------------------------------- |
| `get_note(path)`      | Full content + frontmatter of any vault note  |
| `search_vault(query)` | Full-text search across vault                 |
| `list_publishable()`  | All notes with `publish: true` + current hash |
| `get_garden_state()`  | Current `garden-state.json`                   |

**Access level:** full vault read — not filtered to publishable notes. The `publish: true` property is a publishing decision rule, not an access boundary. Full access is needed so the Publisher can read unpublished notes referenced by published ones and add appropriate reader context.

### Publisher adaptation rules

**Always applied:**

- Strip private frontmatter: `publish`, `people`, `space`, `packing list`, `expenses`, `groups`
- Resolve wikilinks: published notes → real links; unpublished → plain text or inline reader context
- Remove `.base` embeds and `%%Obsidian comments%%`
- Assign content section and one or more topic clusters

**Adaptation level — per-note judgment:**

| Level        | When                                              | What changes                                                                             |
| ------------ | ------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| **Light**    | Note is well-formed and self-contained            | Metadata cleanup only, minimal edits                                                     |
| **Moderate** | Note has private sections or missing context      | Some sections removed, wording smoothed, reader context added for unpublished references |
| **Heavy**    | Note needs significant work for a public audience | Restructuring, sections cut or rewritten, tone adjusted                                  |

**Note combining:** only when multiple vault notes are tightly related and each is too thin to stand alone. Always proposed to user, never automatic.

**Always requires pre-action approval:** publish, delete existing garden note, combine notes, heavy rewrites.

**Topic routing:** `topics:` frontmatter mapped to the 7 clusters. Ambiguous cases flagged with a suggested assignment.

---

## 6. Roadmap

### This revamp (implementation order)

1. Set up new content structure (create section folders, index stubs, migrate/archive old content)
2. Create Base files for each section and topic cluster
3. Write/adapt landing page and About page content
4. Build `DualExplorer` component (dual-tab sidebar)
5. Build `FloatingIsland` component (dark/reader mode toggles)
6. Update `quartz.config.yaml` (new components, folder suppression, explorer filterFn)
7. Replace `.publish-manifest.json` with `garden-state.json` (new schema)
8. Build Publisher vault MCP tools (`get_note`, `search_vault`, `list_publishable`, `get_garden_state`)
9. Write Publisher agent system prompt + adaptation rules
10. End-to-end test: vault note → Publisher scan → Discord proposal → approval → deploy

### Post-revamp

- **Cloudflare analytics — verify garden**: confirm analytics are still firing after the v4→v5 upgrade (check Cloudflare dashboard for recent traffic; verify beacon fires in browser network tab)
- **Cloudflare analytics — other sites**: add the same Cloudflare tracking token/script to `franco.international` and `cv.franco.international`
- **ETH notes**: add ETH section to garden when relevant (~1 year out); will need a new topic cluster and content section
- **Topic cluster maintenance**: ongoing Hermes Publisher task — propose additions, removals, renames as garden content evolves

---

## 7. Verification

1. **Build**: `npm run build` succeeds with no errors; all section index pages render
2. **Bases**: each index page shows its embedded Base with correct content; topic bases aggregate correctly across sections
3. **Dual-tab explorer**: Tab 1 shows file tree, Tab 2 shows topic cluster list; switching works on mobile and desktop
4. **Floating island**: appears fixed over content; both toggles work in light and dark mode
5. **Folder suppression**: Log subsection pages don't show duplicate file listings below the Base
6. **Hermes Publisher dry-run**: test with one vault note → `garden-state.json` updates correctly → Discord proposal message is well-formed → approval flow commits and GitHub Actions deploys
7. **Cloudflare**: dashboard shows traffic for garden; network tab shows beacon firing on page load

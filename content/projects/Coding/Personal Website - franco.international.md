---
title: Personal Website
created: '2026-02-06'
tags:
  - project
areas:
  - '[[projects/index|Projects]]'
  - Coding
  - Obsidian
status: in progress
url:
  - 'https://github.com/franco-g-s/franco.international'
  - 'https://quartz.jzhao.xyz/'
  - 'https://stephango.com/vault'
  - 'https://ewan.my'
---


## Project Overview
A personal website at **[franco.international](https://franco.international)** that publishes selected content from this private Obsidian vault to the web. Showcases CV, class notes, projects, book reviews, and other public-facing content while keeping the private vault completely separate and secure.  

## Inspiration
- **[Steph Ango's approach](https://stephango.com/vault)**: Separate vault for website with different structure than private vault
- **[ewan.my](https://ewan.my/)**: Digital garden built with Quartz, featuring interconnected notes, graph view, and Obsidian Bases rendering
- **[Quartz static site generator](https://quartz.jzhao.xyz/)**: Purpose-built for publishing Obsidian vaults as static websites

## Architecture

### Two-Vault System
- **Private Vault**: Stays private on iCloud + GitHub private repo, unchanged structure
- **Public Website Vault**: Separate Quartz project folder , public GitHub repo at [github.com/franco-g-s/franco.international](https://github.com/franco-g-s/franco.international)

This separation ensures: private vault structure stays intact, website has different organization optimized for web, zero risk of exposing private notes, and different structures for different audiences.  

### Publishing Flow
1. Mark notes with `publish: true` in private vault  
2. Run `node scripts/publish.mjs` from website repo (dry-run by default)
3. Script transforms notes (strips private properties, removes `.base` embeds, strips ``)
4. Run with `--execute` to publish, preview locally, then push
5. GitHub Pages auto-deploys on push to main

### Content to Publish
- CV and about page
- Selected ETH class notes (post-processed atomic notes, not raw class notes)
- Public project notes (coding, research)
- Book notes and reviews
- Selected media notes (movies, etc.)
- Public research notes

## Technology Stack
- **Static Site Generator**: [Quartz v4.5.2](https://quartz.jzhao.xyz/)
- **Hosting**: GitHub Pages with custom domain
- **Domain**: franco.international
- **Analytics**: Cloudflare Web Analytics
- **Repository**: [github.com/franco-g-s/franco.international](https://github.com/franco-g-s/franco.international) (public)
- **Build**: Auto-deployment via GitHub Actions on push

### Website Features
- Obsidian wikilinks and backlinks
- Local + global graph view (conditional: full on homepage, local on other pages)
- Full-text search
- Responsive design
- Cupertino-inspired theme with Inter font and custom blue accent `RGB(50, 130, 247)`
- Floating controls island (bottom-left): dark mode toggle + reader mode
- Scroll buttons (bottom-right): top/bottom navigation
- Reader mode with persistent state and smooth fade transitions
- Explorer sidebar (desktop collapse disabled, TOC collapse kept)
- Broken wikilinks rendered as plain text (no dead-link 404s)
- Date display: created date + last updated date + reading time
- Tags hidden from published pages

### Website Content Structure
```
content/
  about/         # CV and about page
  projects/      # Project notes (coding, research, etc.)
  notes/         # General notes and clippings
  books/         # Book notes and reviews
  media/         # Movie notes
  eth/           # ETH class notes (mirrors vault folder structure)
  attachments/   # Images and media files
```

Each section has an `index.md` landing page.

## Publishing System

### Publishing Properties
- `publish: true` — Required. Marks note for publication
- `web-path` — Optional. Explicit destination folder (e.g., `about`, `projects/coding`). Auto-populated on first publish
- `web-title` — Optional. Different title on website (becomes `title` in published frontmatter)
- `` — Obsidian comments for inline redaction (invisible in Obsidian reading mode, stripped during publishing)

### Routing Rules (first match wins)
1. Explicit `web-path` property → use literally
2. File in `ETH/` → mirror folder structure under `eth/` (slugified)
3. Tag `books` or area `[[log/books/Books|Books]]` → `books/`
4. Tag `movies` or area `[[log/films/Movies|Movies]]` → `media/`
5. Tag `project`/`business` or area `Projects` → `projects/`
6. Tag `clippings` → `notes/`
7. Fallback → `notes/`

### Script Commands

```bash
node scripts/publish.mjs                  # Dry-run (default)
node scripts/publish.mjs --execute        # Publish + commit + preview + push
node scripts/publish.mjs --clean          # Remove all script-created files
node scripts/publish.mjs --verify         # Check published files match source
```

### Content Transformations
During publishing, the script:
- **Strips private frontmatter**: `people`, `collections`, `expenses`, `projects`, `related`, `space`, `packing list`, `groups`, `attachments`  
- **Keeps public frontmatter**: `created`, `tags`, `title`, `status`, `url`, `author`, `year`, `genre`, `rating`, `language`, `topics`, `areas`, `aliases`, `description`, `coordinates`
- **Removes** `.base` embed lines (`!*.base*`)
- **Removes** orphaned headings (headings with no content before next heading)
- **Strips** `` Obsidian comments
- **Applies** `web-title` → `title` override
- **Strips** wikilink syntax from remaining properties (`Topic` → `Topic`)
- **Formats** dates as YYYY-MM-DD strings
- **Copies** referenced attachments to `content/attachments/`
- **Extracts property wikilinks** and appends as hidden markdown for backlink generation (pure markdown, not HTML, so Quartz processes them)

### Safety Features
- **Dry-run by default** — must pass `--execute` to write anything
- **Manifest tracking** (`.publish-manifest.json`, gitignored) — only touches files the script created
- **Change detection** — skips unchanged files for clean git diffs
- **Orphan detection** — removes files whose source no longer has `publish: true`
- **Preview before push** — starts local Quartz server + auto-opens browser for review
- **Web-path writeback** — auto-populates routing metadata back to source notes in private vault

## Progress

### Phase 1: Setup ✅
- [x] Install Quartz locally
- [x] Initialize Quartz project
- [x] Create public GitHub repository
- [x] Purchase franco.international domain
- [x] Document project in private vault
- [x] Update CLAUDE.md with publishing workflow

### Phase 2: Website Design ✅
- [x] Configure Quartz theme (Cupertino-inspired, Inter fonts, custom colors)
- [x] Floating controls island with dark mode + reader mode
- [x] Scroll buttons for navigation
- [x] Reader mode with persistent state
- [x] Conditional graph view (full on homepage, local on other pages)
- [x] Create section index pages (about, projects, notes, books, media, eth)

### Phase 3: Publishing Automation ✅
- [x] Define `publish` property system
- [x] Design routing rules
- [x] Create `scripts/publish.mjs`
- [x] Metadata transformation and content cleaning
- [x] Attachment handling
- [x] Manifest-based change detection and orphan cleanup
- [x] `web-path` writeback
- [x] Dry-run report and execute mode with preview

### Phase 4: Deployment ✅
- [x] Configure GitHub Pages with custom domain
- [x] SSL certificate (automatic)
- [x] Cloudflare analytics
- [x] Broken wikilinks rendered as plain text (Quartz config)
- [x] Tags hidden from published pages
- [x] Date display: created date + last updated
- [x] Dark mode toggle only in floating island (removed from list page sidebar)

### Phase 4.5: Metadata & UI Enhancements ✅
**Custom Components:**
- [x] **FrontmatterProperties Component** - Displays metadata in Obsidian-style collapsible panel
  - Obsidian-inspired design with gray background and fold icon
  - Shows 30+ property types (status, rating, author, genre, topics, dates, location, media metadata, etc.)
  - Privacy-aware: excludes people, areas, attachments, journal metrics
  - Wikilinks in properties render as clickable links (only to published notes)
  - Proper vertical alignment and spacing

**Explorer Improvements:**
- [x] Single-line note names with ellipsis overflow
- [x] Reduced font weight for files (folders stay bold)
- [x] Templates folder excluded from publishing

**Table of Contents:**
- [x] Collapsed by default with configurable option
- [x] No animation flicker on page load (no-transition class)
- [x] Smooth animations for user interactions

**Backlinks:**
- [x] Always visible in sidebar (shows "No backlinks found" when empty)
- [x] Positioned below graph and TOC in right sidebar
- [x] **Property Backlinks Feature** - Includes links from frontmatter properties in link graph
  - Extracts wikilinks from all frontmatter properties (e.g., `books: Book Title`)
  - Appends property links as hidden markdown after content (hidden with CSS)
  - Quartz's link crawler processes the markdown wikilinks for backlink generation
  - Enables Obsidian-like behavior where property links create backlinks
  - CSS hides the property link section using `:last-of-type` selector on `<hr>`

**Wikilink Resolution System:**
- [x] **Custom link transformation** during publishing
  - Builds note title map (by filename, frontmatter title, and aliases)
  - Case-insensitive matching (like Obsidian)
  - Transforms `Note Title` → `Note Title`
  - Wikilinks to unpublished notes → plain text
  - Works in note content AND properties
- [x] Why custom solution needed: Quartz can't handle different vault/website structures or Obsidian-style title matching
- [x] Proper URL generation with space-to-hyphen conversion

**Property System Expansion:**
- [x] Added 30+ properties: source, published, description, start/end dates, due dates, filming dates, categories, seasons, books, clippings, collections, trips, related, projects, countries, cities, coordinates, cast, director, producer, writer, duration, r-value, journal-index, areas
- [x] Smart property stripping: keep public metadata, remove private data (people, groups, attachments, journal metrics)
- [x] Date formatting: YYYY-MM-DD strings
- [x] Trimmed whitespace from array values
- [x] **Areas property now published** - Added to frontmatter display and included in published notes

### Phase 5: Content Population (Paused — waiting for Bases feature)
- [x] Publish CV and about page
- [ ] Publish exercise area
- [ ] Add trips area 
- [ ] Publish health area
- [ ] Select and publish class notes
- [ ] Publish project notes
- [ ] Publish book reviews
- [x] Publish select books, movies, and videos

> Paused until Quartz officially merges Bases support (PR #2292). Bases would significantly change how the website is navigated and structured, so it makes sense to wait before investing time in content organization.

### Phase 6: Bases Integration (Waiting for Quartz PR #2292)
- [ ] Quartz merges official Bases support (PR #2292)
- [ ] Update Quartz to version with Bases
- [ ] Test `.base` file rendering on website
- [ ] Adapt publishing script to handle `.base` files (currently stripped)

### Phase 7: Future Enhancements
- [x] **Recently edited notes section** (implemented on homepage, shows 5 most recent)
- [x] **Created/modified date display** (ContentMeta already shows both when different)
- [ ] QuickAdd script for publishing from within Obsidian
- [ ] Automated publishing via cron job or GitHub Action
- [ ] Blog/essays section
- [ ] Newsletter/RSS feed
- [ ] Interactive elements (executable code blocks)
- [ ] Dynamic content (trip maps, book rating visualizations)
- [ ] Include emoji in note title

## Inspiration & References

### Eilleen's Quartz Customizations
**Website**: [quartz.eilleeenz.com](https://quartz.eilleeenz.com/)
**GitHub**: [fanteastick/quartz-test](https://github.com/fanteastick/quartz-test)
**Customization Log**: [Quartz-customization-log](https://quartz.eilleeenz.com/Quartz-customization-log)

Eilleen has created an extensively customized Quartz v4 site with many genius modifications. Key features to potentially adopt:

**Implemented by her (Inspiration for Future):**  
- **RecentNotes Component**: Shows recently edited notes with configurable options
  - Located in: `quartz/components/RecentNotes.tsx`
  - Configuration: limit, showTags, showDate, linkToMore, excludeTags, custom filter/sort
  - Position: afterBody section, uses `OnlyFor` wrapper to show on specific pages
  - Custom styling with decorative prefixes ("✿") and separators ("₊⊹⊹₊")
  - Example config: `showDate: true`, `title: "Recently edited notes:"`, `linkToMore: "All-files-chronologically-modified"`

- **Created vs Modified Date Display**: Smart date handling in ContentMeta
  - Shows created date always
  - Only shows modified date when it differs from created date
  - Uses `_getDateCustom()` helper with date comparison
  - Avoids redundant date display when dates are identical

**Other Notable Customizations** (for potential future implementation):
- Image carousel with lightbox zoom functionality
- Interactive image galleries (clickable)
- Custom callout styling (Minimal theme aesthetics)
- Spoiler/blurred text implementation
- Floating buttons for graph access and random page navigation
- Slug display on tag pages
- Broken link differentiation (prevents navigation)
- External link favicons
- ABC.js music notation plugin
- Text replacer transformer for markdown preprocessing
- Password-protected page support

**Why Reference Her Work:**
Eilleen's implementation provides excellent examples of how to extend Quartz v4 with custom components and features while maintaining clean, maintainable code. Her customization log documents the technical approach for each feature.

### Ewan's Obsidian Database (Bases)
**Website**: [ewan.my](https://ewan.my)
**GitHub**: [gassandrid/ewan.my](https://github.com/gassandrid/ewan.my)

Ewan built a custom Quartz implementation that renders Obsidian Bases (`.base` files) as interactive database views with tables, cards, lists, and maps. His implementation includes:

**Key Features:**  
- **Database Views**: Tables, cards, lists, and maps with live filtering and sorting
- **Query Engine**: Full filter evaluation, property resolution, formula computation
- **Interactive Controls**: View selector tabs, search bars, grouping, summaries
- **~4,800 lines of TypeScript/SCSS**: Transformer plugin, emitter plugin, query engine, type system, UI components

**Contribution:**
Ewan contributed his Bases implementation upstream to Quartz as [PR #2292](https://github.com/jackyzha0/quartz/pull/2292). This is the feature we're waiting for to properly display database views on the website.  

**Why Reference:**
Ewan's work demonstrates how to build complex, data-driven components in Quartz. His implementation shows how to parse YAML schemas, evaluate filters, compute formulas, and render interactive views - all critical for Bases support.

### Kepano's Minimal Theme & Design Philosophy
**Website**: [kepano.com](https://kepano.com)
**GitHub**: [kepano/obsidian-minimal](https://github.com/kepano/obsidian-minimal)

Kepano is the creator of the Minimal theme for Obsidian and has extensive design philosophy around note-taking and personal knowledge management.

**Design Principles:**
- Clean, distraction-free interfaces
- Typography-first design
- Thoughtful use of whitespace
- Consistent visual hierarchy
- Performance-focused (minimal CSS)

**Notable Work:**
- **Minimal Theme**: Most popular Obsidian theme with extensive customization options
- **Design Writing**: Essays on note-taking, design, and digital tools
- **Style Settings Plugin**: Allows theme customization without editing CSS

**Why Reference:**
Kepano's design philosophy influences how we think about presenting knowledge on the web. His emphasis on readability, simplicity, and user control informs our approach to the website's visual design and information architecture.

## Bases Feature Research

### Official Quartz Support (PR #2292)
Bases rendering is being added to Quartz as an official feature via [PR #2292](https://github.com/jackyzha0/quartz/pull/2292) (`feat/bases` branch). This is the same feature that powers [ewan.my](https://ewan.my) — Ewan contributed his implementation upstream.  

- **PR opened**: January 30, 2026
- **Status**: Open, with unresolved review feedback (anchor normalization bugs, documentation gaps, unanswered maintainer questions)
- **Estimated timeline**: Likely weeks to months — needs revision cycles before approval and merge
- **Staging preview**: Available at the PR's deploy preview URL

**Decision**: Wait for the official merge rather than porting Ewan's custom implementation. This avoids maintaining a fork and ensures compatibility with future Quartz updates.

### Ewan's Implementation (Reference)
Ewan's website ([ewan.my](https://ewan.my)) already renders `.base` files as interactive card/table views. His implementation is in his [public Quartz fork](https://github.com/gassandrid/ewan.my) and consists of ~4,800 lines of custom TypeScript/SCSS:  
- **Transformer plugin** (`quartz/plugins/transformers/bases.ts`): Parses `.base` YAML, handles inline base code blocks
- **Emitter plugin** (`quartz/plugins/emitters/base.tsx`): Renders tables, cards, lists, and maps with filtering, sorting, grouping, and summaries
- **Query engine** (`quartz/util/base/query.ts`): Full filter evaluation, property resolution, formula computation
- **Type system** (`quartz/util/base/types.ts`): YAML schema parsing, view configurations
- **UI components**: View selector tabs, search bar, map rendering, card grid layout

This code is now being contributed upstream as PR #2292, so porting it manually is unnecessary.

## Key Decisions
### Why Separate Vaults?
- Private vault structure unchanged (no "Public/" folder)
- Website has different organization optimized for web
- Zero risk of exposing private notes
- Different audiences: personal vault for me, website for public

### Why Property-Based Publishing?
- Fits existing vault's property system
- Granular control over what gets published
- Customize titles/categorization for web (`web-*` properties)
- No folder structure disruption

### Why GitHub Pages?
- Free hosting, zero maintenance, better uptime than self-hosting
- Global CDN for international visitors
- Automatic SSL with custom domain
- $0 ongoing cost

## Related Notes
- Obsidian Rules - Core vault principles
- Automation - Vault automation strategies

---

[[projects/index]] 

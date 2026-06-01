# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A heavily customized [Quartz v5](https://quartz.jzhao.xyz/) static site generator that publishes a curated subset of a private Obsidian vault as a public digital garden. Content lives in `content/` as Markdown; the build pipeline transforms it into a static site deployed to GitHub Pages.

## Commands

```bash
# Develop with hot reload
npx quartz build --serve

# Build for production (plugins auto-installed via prebuild)
npx quartz build

# Type check + Prettier validation
npm run check

# Auto-format
npm run format

# Run tests
npm test

# Run a single test file
npx tsx --test path/to/test.ts
```

Run `npm run check` before committing; CI fails on formatting or type errors.

## Publishing Workflow

Content is sourced from a private Obsidian vault via `scripts/publish.mjs`. Notes with `publish: true` frontmatter get selected, transformed (wikilinks resolved, private metadata stripped), and copied to `content/`. This script is not relevant when editing site code or content directly.

## Architecture

### Build Pipeline

Quartz processes Markdown through a three-stage plugin pipeline:

1. **Transformers** — parse and mutate individual content nodes (frontmatter, Obsidian Markdown, syntax highlighting, LaTeX, etc.)
2. **Filters** — remove nodes from the build graph (e.g. draft notes)
3. **Emitters** — take the full content graph and write output files (HTML pages, RSS, sitemap, etc.)

### Configuration Files

- **`quartz.config.yaml`** — full site config: theme (Cupertino-inspired, Inter/JetBrains Mono), plugin selection, analytics, ignored paths
- **`quartz.ts`** — TypeScript-level overrides that can't be expressed in YAML: `Explorer` filterFn, custom `registerCondition` calls (e.g. `"index-only"` for homepage-only components)
- **`quartz.lock.json`** — tracks installed community plugin versions (like a lockfile); plugins auto-install via `npm run install-plugins` (runs as a `prebuild` hook)

### Plugin Management

Community plugins are installed from the Quartz plugin registry:

```bash
npx quartz plugin install <plugin-name>
```

Plugins install to `.quartz/plugins/` and are tracked in `quartz.lock.json`. The `prebuild` npm script runs `install-plugins` automatically before every build.

### Custom Local Plugins (`plugins/`)

Saved plugins not currently active on the live site — kept for a future garden revamp:

- **`plugins/frontmatter-properties/`** — custom FrontmatterProperties component that rendered 30+ Obsidian property types; replaced by the community `note-properties` plugin in v5
- **`plugins/json-feed/`** — emits `/notes.json` for `franco.international` to consume at build time (title, slug, date, description, sorted by date); currently active via community plugin install

### Content Sections

```
content/
├── about/      # Bio, CV
├── eth/        # ETH Zürich coursework
├── exercise/   # Training and sports notes
├── media/      # Books, films, videos
├── notes/      # General academic notes
├── projects/   # Coding, hardware, research
└── index.md    # Homepage (feeds RecentNotes component, index-only condition)
```

### CI/CD

- `ci.yaml` — runs `npm run check` + `npx quartz build` on push and PRs; caches plugins via `quartz.lock.json`
- `deploy-v5.yaml` — push to `main` → `npx quartz build` → GitHub Pages
- `build-preview.yaml` — PRs get a preview build (`npm run check` + `npx quartz build -d docs`)
- `docker-build-push.yaml` — builds and pushes a Docker image to `ghcr.io`

## Code Style

Prettier enforces: 100-char line width, 2-space indent, trailing commas, no semicolons. TypeScript strict mode with `noUnusedLocals` and `noUnusedParameters`. JSX targets Preact (`react-jsx` with Preact as the runtime). `content/` is excluded from Prettier formatting (`.prettierignore`).

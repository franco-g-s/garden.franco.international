# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A heavily customized [Quartz v4](https://quartz.jzhao.xyz/) static site generator that publishes a curated subset of a private Obsidian vault as a public digital garden. Content lives in `content/` as Markdown; the build pipeline (TypeScript + Preact + remark/rehype) transforms it into a static site deployed to GitHub Pages.

## Commands

```bash
# Develop with hot reload
npx quartz build --serve

# Build for production
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

## Publishing Workflow

Content is sourced from a private Obsidian vault via `scripts/publish.mjs`. Notes with `publish: true` frontmatter get selected, transformed (wikilinks resolved, private metadata stripped), and copied to `content/`. This script is not relevant when editing site code or content directly.

## Architecture

### Build Pipeline

Quartz processes Markdown through a three-stage plugin pipeline configured in `quartz.config.ts`:

1. **Transformers** — parse and mutate individual `QuartzContent` nodes (frontmatter, Obsidian-flavored Markdown, syntax highlighting, LaTeX, etc.)
2. **Filters** — remove nodes from the build graph (e.g. `RemoveDrafts` drops `draft: true` notes)
3. **Emitters** — take the full content graph and write output files (HTML pages, RSS, sitemap, OG images, etc.)

### Configuration Files

- **`quartz.config.ts`** — plugin selection, theme (Cupertino-inspired, Inter/JetBrains Mono), analytics, ignored paths
- **`quartz.layout.ts`** — Preact component layout for three page types: `sharedLayout` (all pages), `defaultContentPageLayout` (notes), `defaultListPageLayout` (folder/tag index pages)

### Custom Components (`quartz/components/`)

This repo has meaningfully modified upstream Quartz components. Notable ones:

- **`FrontmatterProperties.tsx`** — renders 30+ Obsidian property types in a collapsible panel; extends base Quartz to support typed properties (dates, links, numbers, lists, checkboxes)
- **`Backlinks.tsx`** — augmented to surface wikilinks found in frontmatter properties, not just body text
- **`Explorer.tsx`** — file tree with custom filtering logic
- **`Graph.tsx`** — interactive D3/Pixi.js graph with local and global view modes

### Content Sections

```
content/
├── about/      # Bio, CV
├── eth/        # ETH Zürich coursework
├── exercise/   # Training and sports notes
├── media/      # Books, films, videos
├── notes/      # General academic notes
├── projects/   # Coding, hardware, research
└── index.md    # Homepage (feeds RecentNotes component)
```

### CI/CD

- `deploy.yml` — push to `main` → `npx quartz build` → GitHub Pages
- `build-preview.yaml` — PRs get a preview build (`npm run check` + `npx quartz build -d docs`)
- `docker-build-push.yaml` — builds and pushes a Docker image to `ghcr.io`

## Code Style

Prettier enforces: 100-char line width, 2-space indent, trailing commas, no semicolons. TypeScript strict mode with `noUnusedLocals` and `noUnusedParameters`. JSX targets Preact (`react-jsx` with Preact as the runtime).

Run `npm run check` before committing; CI will fail on formatting or type errors.

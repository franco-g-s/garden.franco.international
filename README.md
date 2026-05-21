# garden.franco.international

My personal digital garden — a curated public subset of my private Obsidian vault, built with Quartz and published via a custom scripted workflow.

🌐 **Live site:** [garden.franco.international](https://garden.franco.international)

Part of a three-site personal web presence:
- [franco.international](https://franco.international) — personal hub
- **[garden.franco.international](https://garden.franco.international)** — this digital garden
- [cv.franco.international](https://cv.franco.international) — CV

## About

A growing collection of public notes:
- Academic notes from ETH Zürich (Mechanical Engineering)
- Projects — coding, hardware design, research
- Book notes and reviews
- Media notes and reflections

## Tech Stack

- **Static Site Generator:** [Quartz v4](https://quartz.jzhao.xyz)
- **Content Source:** Private Obsidian vault
- **Hosting:** GitHub Pages
- **Domain:** garden.franco.international
- **Publishing:** Property-based selective publishing (`publish: true`)

## Architecture

Content is selectively published from a private Obsidian vault:

1. Notes marked with `publish: true` in the private vault
2. Publishing script (`scripts/publish.mjs`) transforms content:
   - **Wikilink resolution:** `[[Note Title]]` → proper web paths (case-insensitive, alias-aware)
   - **Metadata filtering:** strips private properties, preserves public metadata
   - **Content cleaning:** removes Obsidian comments, base embeds, orphaned headings
   - **Attachment handling:** copies referenced images and media files
3. Quartz builds the static site with custom components
4. GitHub Pages auto-deploys on push to main

**Two-vault system:**
- **Private vault** (iCloud + private repo): full personal knowledge base
- **Public website** (this repo): curated selection for public consumption

**Custom Components:**
- `FrontmatterProperties`: note metadata in a collapsible Obsidian-style panel
- Enhanced Explorer with single-line overflow
- Collapsible Table of Contents
- Always-visible Backlinks with property link support
- JSON feed emitter — outputs `/notes.json` for the hub to consume at build time

## Features

- Wikilinks and backlinks
- Full-text search
- Interactive graph view (full network on homepage, local on pages)
- Dark/light mode toggle
- Responsive design
- Cupertino-inspired design with custom Inter typography
- Property backlinks — backlinks generated from wikilinks in frontmatter properties

## Content Structure

```
content/
├── about/      # About me
├── notes/      # General academic notes
├── eth/        # ETH Zürich coursework
├── projects/   # Coding, hardware, research
├── books/      # Book notes and reviews
└── media/      # Films, videos
```

## Local Development

```bash
npm install
npx quartz build --serve   # dev server with hot reload
npx quartz build           # production build
```

## Contact

- **Email:** franco@goxcoworld.com
- **GitHub:** [@franco-g-s](https://github.com/franco-g-s)

## License

Content © 2026 Franco Gómez Schumacher. All rights reserved.
Site built with [Quartz](https://github.com/jackyzha0/quartz) (MIT License).

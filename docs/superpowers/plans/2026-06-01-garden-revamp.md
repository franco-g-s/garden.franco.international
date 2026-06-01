# Garden Revamp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the garden's content structure, navigation, and UI to match the revamp design — new Notes/Projects/Log/Topics taxonomy, dual-tab sidebar explorer, restored FloatingControls, Bases-powered section indexes, and a new landing page and About page.

**Architecture:** Content migrates from the old media/exercise structure to a new log/ hierarchy. Seven topic Base files in content/topics/ serve as cross-cutting thematic views. Two Quartz TSX components (FloatingControls ported from v4, DualExplorer built new) replace the single-tab explorer and toolbar toggles. All section index pages embed their respective Bases.

**Tech Stack:** Quartz v5, Preact/TSX, SCSS, Obsidian Bases query syntax (YAML), TypeScript strict mode

**Scope:** Garden repository only. Hermes Publisher MCP tools and garden-state.json population are a separate plan (done when Hermes is set up). This plan creates garden-state.json as an empty placeholder.

---

### Task 1: Migrate content to new folder structure

**Files:**

- Move: `content/media/books/*` → `content/log/books/`
- Move: `content/media/movies/*` → `content/log/films/`
- Move: `content/media/youtube/*` → `content/log/youtube/`
- Move: `content/exercise/*` → `content/log/exercise/`
- Remove: `content/media/`, `content/exercise/`
- Create: `content/log/`, `content/topics/`

- [ ] **Step 1: Create new directories**

```bash
mkdir -p content/log/books content/log/films content/log/youtube content/log/exercise content/topics
```

- [ ] **Step 2: Move media content**

```bash
git mv content/media/books/* content/log/books/
git mv content/media/movies/* content/log/films/
git mv content/media/youtube/* content/log/youtube/
git mv content/exercise/* content/log/exercise/
```

- [ ] **Step 3: Remove old directories**

```bash
git rm -r content/media/ content/exercise/
```

- [ ] **Step 4: Update the films index title (was "Movies")**

Open `content/log/films/index.md` and change `title: Movies` to `title: Films` if present.

- [ ] **Step 5: Find and fix internal wikilinks pointing to old paths**

```bash
grep -rl "media/books\|media/movies\|media/youtube" content/ --include="*.md"
```

For each file found, replace:

- `[[media/books/` → `[[log/books/`
- `[[media/movies/` → `[[log/films/`
- `[[media/youtube/` → `[[log/youtube/`

- [ ] **Step 6: Build to confirm no fatal errors**

```bash
npm run build 2>&1 | grep -E "^error|Error:" | head -20
```

Expected: build completes (some broken wikilinks are acceptable at this stage).

- [ ] **Step 7: Commit**

```bash
git add content/
git commit -m "refactor: migrate content — media→log, create topics dir"
```

---

### Task 2: Create section Base files

**Files:**

- Create: `content/notes/notes.base`
- Create: `content/projects/projects.base`
- Create: `content/log/log.base`
- Create: `content/log/books/books.base`
- Create: `content/log/films/films.base`
- Create: `content/log/youtube/youtube.base`
- Create: `content/log/exercise/exercise.base`

- [ ] **Step 1: Create notes.base**

```yaml
filters:
  and:
    - file.inFolder("notes")
    - "!file.name.equals('index')"
views:
  - type: table
    name: All Notes
    order:
      - file.name
      - created
      - topics
    sort:
      - property: created
        direction: DESC
    columnSize:
      file.name: 400
```

- [ ] **Step 2: Create projects.base**

```yaml
filters:
  and:
    - file.inFolder("projects")
    - "!file.name.equals('index')"
views:
  - type: table
    name: All Projects
    groupBy:
      property: status
      direction: DESC
    order:
      - file.name
      - status
      - url
    sort:
      - property: status
        direction: DESC
    columnSize:
      file.name: 400
```

- [ ] **Step 3: Create log.base**

```yaml
filters:
  or:
    - file.inFolder("log/books")
    - file.inFolder("log/films")
    - file.inFolder("log/youtube")
    - file.inFolder("log/exercise")
views:
  - type: table
    name: All
    filters:
      and:
        - "!file.name.equals('index')"
    order:
      - file.name
      - type
      - status
      - created
    sort:
      - property: created
        direction: DESC
```

- [ ] **Step 4: Create books.base**

```yaml
filters:
  and:
    - file.inFolder("log/books")
    - "!file.name.equals('index')"
views:
  - type: cards
    name: All Books
    groupBy:
      property: status
      direction: DESC
    order:
      - file.name
      - author
      - status
      - rating
    sort:
      - property: created
        direction: DESC
    image: note.image
    imageAspectRatio: 1.5
  - type: table
    name: This Book's Notes
    filters:
      and:
        - list(books).contains(this)
```

- [ ] **Step 5: Create films.base**

```yaml
filters:
  and:
    - file.inFolder("log/films")
    - "!file.name.equals('index')"
views:
  - type: cards
    name: All Films
    groupBy:
      property: status
      direction: DESC
    order:
      - file.name
      - director
      - year
      - rating
    sort:
      - property: year
        direction: DESC
    image: note.image
    imageAspectRatio: 1.5
  - type: table
    name: This Film's Notes
    filters:
      and:
        - list(movies).contains(this)
```

- [ ] **Step 6: Create youtube.base**

```yaml
filters:
  and:
    - file.inFolder("log/youtube")
    - "!file.name.equals('index')"
views:
  - type: table
    name: All Videos
    order:
      - file.name
      - source
      - created
    sort:
      - property: created
        direction: DESC
    columnSize:
      file.name: 400
  - type: table
    name: This Video's Notes
    filters:
      and:
        - list(collections).contains(this)
```

- [ ] **Step 7: Create exercise.base**

```yaml
filters:
  and:
    - file.inFolder("log/exercise")
    - "!file.name.equals('index')"
views:
  - type: table
    name: All
    order:
      - file.name
      - type
      - created
    sort:
      - property: created
        direction: DESC
```

- [ ] **Step 8: Build and verify base files generate pages**

```bash
npm run build 2>&1 | grep -E "^error|Error:" | head -20
```

Expected: build succeeds; check `public/` for `notes/notes/index.html`, `log/books/books/index.html` etc.

- [ ] **Step 9: Commit**

```bash
git add content/
git commit -m "feat: add section Base files (notes, projects, log subsections)"
```

---

### Task 3: Create topic Base files

**Files:**

- Create: `content/topics/philosophy-and-thinking.base`
- Create: `content/topics/wellbeing-and-growth.base`
- Create: `content/topics/travel-and-adventure.base`
- Create: `content/topics/society-and-systems.base`
- Create: `content/topics/psychology.base`
- Create: `content/topics/building.base`
- Create: `content/topics/health.base`

- [ ] **Step 1: Create philosophy-and-thinking.base**

```yaml
filters:
  or:
    - list(topics).contains("Philosophy")
    - list(topics).contains("Buddhism")
    - list(topics).contains("Presence")
    - list(topics).contains("Time")
    - list(topics).contains("Meaning")
    - list(topics).contains("Free Will")
    - list(topics).contains("Consciousness")
    - list(topics).contains("Determinism")
views:
  - type: cards
    name: All
    order:
      - file.name
      - created
    sort:
      - property: created
        direction: DESC
  - type: table
    name: Table
    order:
      - file.name
      - created
      - topics
    sort:
      - property: created
        direction: DESC
```

- [ ] **Step 2: Create wellbeing-and-growth.base**

```yaml
filters:
  or:
    - list(topics).contains("Personal Growth")
    - list(topics).contains("Habits")
    - list(topics).contains("Mindfulness")
    - list(topics).contains("Happiness")
    - list(topics).contains("Self-Improvement")
    - list(topics).contains("Motivation")
    - list(topics).contains("Intentionality")
    - list(topics).contains("Lifestyle Design")
views:
  - type: cards
    name: All
    order:
      - file.name
      - created
    sort:
      - property: created
        direction: DESC
  - type: table
    name: Table
    order:
      - file.name
      - created
      - topics
    sort:
      - property: created
        direction: DESC
```

- [ ] **Step 3: Create travel-and-adventure.base**

```yaml
filters:
  or:
    - list(topics).contains("Travel")
    - list(topics).contains("Bikepacking")
    - list(topics).contains("Solitude")
    - list(topics).contains("Wilderness")
    - list(topics).contains("Nature")
    - list(topics).contains("Adventure")
views:
  - type: cards
    name: All
    order:
      - file.name
      - created
    sort:
      - property: created
        direction: DESC
  - type: table
    name: Table
    order:
      - file.name
      - created
      - topics
    sort:
      - property: created
        direction: DESC
```

- [ ] **Step 4: Create society-and-systems.base**

```yaml
filters:
  or:
    - list(topics).contains("Network Science")
    - list(topics).contains("Social Networks")
    - list(topics).contains("Complexity")
    - list(topics).contains("Organizations")
    - list(topics).contains("Game Theory")
    - list(topics).contains("Groupthink")
    - list(topics).contains("Social Change")
    - list(topics).contains("Cooperation")
views:
  - type: cards
    name: All
    order:
      - file.name
      - created
    sort:
      - property: created
        direction: DESC
  - type: table
    name: Table
    order:
      - file.name
      - created
      - topics
    sort:
      - property: created
        direction: DESC
```

- [ ] **Step 5: Create psychology.base**

```yaml
filters:
  or:
    - list(topics).contains("Psychology")
    - list(topics).contains("Emotions")
    - list(topics).contains("Relationships")
    - list(topics).contains("Neuroscience")
    - list(topics).contains("Communication")
    - list(topics).contains("Perception")
    - list(topics).contains("Attention")
    - list(topics).contains("Dopamine")
views:
  - type: cards
    name: All
    order:
      - file.name
      - created
    sort:
      - property: created
        direction: DESC
  - type: table
    name: Table
    order:
      - file.name
      - created
      - topics
    sort:
      - property: created
        direction: DESC
```

- [ ] **Step 6: Create building.base**

```yaml
filters:
  or:
    - list(topics).contains("Technology")
    - list(topics).contains("AI")
    - list(topics).contains("Automation")
    - list(topics).contains("Coding")
    - list(topics).contains("Entrepreneurship")
    - list(topics).contains("Problem-Solving")
    - list(topics).contains("Creativity")
    - list(topics).contains("Innovation")
views:
  - type: table
    name: Notes
    filters:
      and:
        - "!file.inFolder('projects')"
    order:
      - file.name
      - created
      - topics
    sort:
      - property: created
        direction: DESC
  - type: table
    name: Projects
    filters:
      and:
        - file.inFolder("projects")
    order:
      - file.name
      - status
    sort:
      - property: status
        direction: DESC
```

- [ ] **Step 7: Create health.base**

```yaml
filters:
  or:
    - list(topics).contains("Exercise")
    - list(topics).contains("Nutrition")
    - list(topics).contains("Physical Health")
    - file.inFolder("log/exercise")
views:
  - type: table
    name: All
    filters:
      and:
        - "!file.name.equals('index')"
    order:
      - file.name
      - created
      - topics
    sort:
      - property: created
        direction: DESC
```

- [ ] **Step 8: Build and verify 7 topic pages appear**

```bash
npm run build 2>&1 | grep -E "^error|Error:" | head -20
ls public/topics/
```

Expected: 7 directories in `public/topics/`, one per cluster.

- [ ] **Step 9: Commit**

```bash
git add content/topics/
git commit -m "feat: add 7 topic cluster Base files"
```

---

### Task 4: Create section index pages

**Files:**

- Modify: `content/notes/index.md`
- Modify: `content/projects/index.md`
- Create: `content/log/index.md`
- Create: `content/log/books/index.md`
- Create: `content/log/films/index.md`
- Create: `content/log/youtube/index.md`
- Create: `content/log/exercise/index.md`

- [ ] **Step 1: Update content/notes/index.md**

Replace body content (keep any existing frontmatter):

```markdown
Ideas, reflections, and thinking in progress. These are working notes — some polished, some rough.

![[notes.base]]
```

- [ ] **Step 2: Update content/projects/index.md**

```markdown
Things I'm building — software, tools, and experiments.

![[projects.base]]
```

- [ ] **Step 3: Create content/log/index.md**

```markdown
---
title: Log
---

A personal record of what I'm reading, watching, and doing.

![[log.base]]
```

- [ ] **Step 4: Create content/log/books/index.md**

```markdown
---
title: Books
---

Books I've read, with notes where I had something to say.

![[books.base]]
```

- [ ] **Step 5: Create content/log/films/index.md**

```markdown
---
title: Films
---

Films I've watched, with notes where something stayed with me.

![[films.base]]
```

- [ ] **Step 6: Create content/log/youtube/index.md**

```markdown
---
title: YouTube
---

Videos and talks worth keeping a record of.

![[youtube.base]]
```

- [ ] **Step 7: Create content/log/exercise/index.md**

```markdown
---
title: Exercise
---

Training logs and notes.

![[exercise.base]]
```

- [ ] **Step 8: Build and spot-check index pages**

```bash
npm run build 2>&1 | grep -E "^error|Error:" | head -20
npm run preview
```

Open each: `/notes`, `/projects`, `/log`, `/log/books`, `/log/films`, `/log/youtube`, `/log/exercise`. Each should render with its embedded Base below the description text.

- [ ] **Step 9: Commit**

```bash
git add content/
git commit -m "feat: create section index pages with embedded Base views"
```

---

### Task 5: Write landing page and About page

**Files:**

- Modify: `content/index.md`
- Create or modify: `content/about.md`

- [ ] **Step 1: Check existing about content**

```bash
ls content/about* 2>/dev/null
cat content/about/index.md 2>/dev/null || cat content/about.md 2>/dev/null || echo "none found"
```

If `content/about/` is a directory, consolidate:

```bash
git mv content/about/index.md content/about.md
git rm -r content/about/
```

- [ ] **Step 2: Write landing page (content/index.md)**

Preserve existing frontmatter, replace body:

```markdown
This is my digital garden — a collection of notes, projects, and logs that I tend over time. Nothing here is finished; notes evolve, ideas connect unexpectedly, and things get updated as I learn more.

**[Notes](/notes)** — ideas and reflections on things I find interesting.

**[Projects](/projects)** — things I'm building.

**[Log](/log)** — books I've read, films I've watched, training I've done.

**[Topics](/topics/philosophy-and-thinking)** — browse by theme rather than content type.

→ [About me](/about)
```

Adapt this prose to Franco's voice before committing.

- [ ] **Step 3: Write About page (content/about.md)**

```markdown
---
title: About
---

I'm Franco — I grew up between Buenos Aires, Zurich, and Shanghai, and studied mechanical engineering at ETH Zürich.

I'm interested in how things work: social networks, physical systems, my own habits and thinking. Most of the notes in this garden are the product of trying to understand something, not of having understood it.

Outside of ideas: I cycle a lot (including long bikepacking trips), train regularly, and think about how to live well.

Professional background: [cv.franco.international](https://cv.franco.international)
```

Adapt to match what Franco wants to say about himself.

- [ ] **Step 4: Build and verify**

```bash
npm run build 2>&1 | grep -E "^error|Error:" | head -20
npm run preview
```

Check `/` and `/about` render correctly. Confirm the CV link is present on About.

- [ ] **Step 5: Commit**

```bash
git add content/index.md content/about.md
git commit -m "feat: write landing page and about page"
```

---

### Task 6: Port FloatingControls from v4

**Files:**

- Create: `quartz/components/FloatingControls.tsx`
- Create: `quartz/components/styles/floatingcontrols.scss`
- Modify: `quartz/components/index.ts`

- [ ] **Step 1: Verify the v5 import path for concatenateResources**

```bash
grep -r "concatenateResources" quartz/ --include="*.ts" --include="*.tsx" -l | head -5
grep "concatenateResources" quartz/util/resources.ts 2>/dev/null | head -3
```

Note the exact import path — it may differ from v4's `"../util/resources"`.

- [ ] **Step 2: Create FloatingControls.tsx**

```tsx
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { concatenateResources } from "../util/resources" // update path if Step 1 found differently
import style from "./styles/floatingcontrols.scss"

interface FloatingControlsOptions {
  components: QuartzComponent[]
}

export default ((opts?: Partial<FloatingControlsOptions>) => {
  const FloatingControlsComponent: QuartzComponent = (props: QuartzComponentProps) => {
    const components = opts?.components ?? []
    return (
      <div class="floating-controls">
        {components.map((Component) => (
          <Component {...props} displayClass="" />
        ))}
      </div>
    )
  }

  const childComponents = opts?.components ?? []

  const allStyles = childComponents
    .map((c) => c.css)
    .filter((css): css is string => css !== undefined)
  FloatingControlsComponent.css =
    allStyles.length > 0 ? concatenateResources([style, ...allStyles]) : style

  const beforeScripts = childComponents
    .map((c) => c.beforeDOMLoaded)
    .filter((s): s is string => s !== undefined)
  if (beforeScripts.length > 0) {
    FloatingControlsComponent.beforeDOMLoaded = concatenateResources(beforeScripts)
  }

  const afterScripts = childComponents
    .map((c) => c.afterDOMLoaded)
    .filter((s): s is string => s !== undefined)
  if (afterScripts.length > 0) {
    FloatingControlsComponent.afterDOMLoaded = concatenateResources(afterScripts)
  }

  return FloatingControlsComponent
}) satisfies QuartzComponentConstructor
```

- [ ] **Step 3: Create floatingcontrols.scss**

```scss
@use "../../styles/variables.scss" as *;

.floating-controls {
  position: fixed;
  bottom: 1rem;
  left: 1rem;
  z-index: 999;
  display: flex;
  gap: 0.5rem;
  background-color: var(--light);
  padding: 0.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid var(--lightgray);

  @media #{$mobile} {
    bottom: 0.75rem;
    left: 0.75rem;
    padding: 0.4rem;
    gap: 0.4rem;
  }

  html[reader-mode="on"] & {
    display: flex !important;
  }

  button {
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0.4rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    transition: background-color 0.2s ease;

    &:hover {
      background-color: var(--lightgray);
    }

    svg {
      width: 1.2rem;
      height: 1.2rem;
    }
  }
}
```

- [ ] **Step 4: Add export to quartz/components/index.ts**

```bash
grep -n "export" quartz/components/index.ts | tail -5
```

Add following the existing export pattern. Example — if existing exports look like:

```ts
export { default as Darkmode } from "./Darkmode"
```

Then add:

```ts
export { default as FloatingControls } from "./FloatingControls"
```

- [ ] **Step 5: Type check**

```bash
npm run check 2>&1 | grep -i "floatingcontrols\|error" | head -20
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add quartz/components/FloatingControls.tsx quartz/components/styles/floatingcontrols.scss quartz/components/index.ts
git commit -m "feat: port FloatingControls component from v4 to v5"
```

---

### Task 7: Build DualExplorer component

**Files:**

- Create: `quartz/components/DualExplorer.tsx`
- Create: `quartz/components/styles/dualexplorer.scss`
- Modify: `quartz/components/index.ts`

- [ ] **Step 1: Read Explorer source to understand constructor signature**

```bash
head -60 quartz/components/Explorer.tsx
grep -n "satisfies QuartzComponentConstructor\|export default" quartz/components/Explorer.tsx
```

Note the options interface — specifically the `filterFn` option type.

- [ ] **Step 2: Create DualExplorer.tsx**

```tsx
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import ExplorerConstructor from "./Explorer"
import { concatenateResources } from "../util/resources" // update if path differs
import style from "./styles/dualexplorer.scss"

interface TopicLink {
  label: string
  slug: string
}

interface DualExplorerOptions {
  topics: TopicLink[]
}

const defaultTopics: TopicLink[] = [
  { label: "Philosophy & Thinking", slug: "topics/philosophy-and-thinking" },
  { label: "Wellbeing & Growth", slug: "topics/wellbeing-and-growth" },
  { label: "Travel & Adventure", slug: "topics/travel-and-adventure" },
  { label: "Society & Systems", slug: "topics/society-and-systems" },
  { label: "Psychology", slug: "topics/psychology" },
  { label: "Building", slug: "topics/building" },
  { label: "Health", slug: "topics/health" },
]

const tabScript = `
;(function () {
  const KEY = "dual-explorer-tab"
  function init() {
    const tabs = document.querySelectorAll(".dual-explorer .tab-btn")
    const panels = document.querySelectorAll(".dual-explorer .tab-panel")
    if (!tabs.length) return
    const saved = localStorage.getItem(KEY) ?? "content"
    function activate(name) {
      tabs.forEach(t => t.classList.toggle("active", t.dataset.tab === name))
      panels.forEach(p => p.classList.toggle("hidden", p.dataset.panel !== name))
      localStorage.setItem(KEY, name)
    }
    activate(saved)
    tabs.forEach(tab => tab.addEventListener("click", () => activate(tab.dataset.tab)))
  }
  document.addEventListener("DOMContentLoaded", init)
  document.addEventListener("nav", init)
})()
`

export default ((opts?: Partial<DualExplorerOptions>) => {
  const topics = opts?.topics ?? defaultTopics

  const ExplorerInstance = ExplorerConstructor({
    filterFn: (node: { slugSegment: string }) =>
      node.slugSegment !== "tags" && node.slugSegment !== "eth" && node.slugSegment !== "topics",
  })

  const DualExplorerComponent: QuartzComponent = (props: QuartzComponentProps) => (
    <div class="dual-explorer">
      <div class="dual-explorer-tabs" role="tablist">
        <button class="tab-btn" data-tab="content" role="tab">
          Content
        </button>
        <button class="tab-btn" data-tab="topics" role="tab">
          Topics
        </button>
      </div>
      <div class="tab-panel" data-panel="content" role="tabpanel">
        <ExplorerInstance {...props} />
      </div>
      <div class="tab-panel hidden" data-panel="topics" role="tabpanel">
        <ul class="topics-list">
          {topics.map((t) => (
            <li key={t.slug}>
              <a href={`/${t.slug}`}>{t.label}</a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )

  const explorerCss = ExplorerInstance.css
  DualExplorerComponent.css = explorerCss ? concatenateResources([style, explorerCss]) : style

  if (ExplorerInstance.beforeDOMLoaded) {
    DualExplorerComponent.beforeDOMLoaded = ExplorerInstance.beforeDOMLoaded
  }

  DualExplorerComponent.afterDOMLoaded = ExplorerInstance.afterDOMLoaded
    ? concatenateResources([ExplorerInstance.afterDOMLoaded, tabScript])
    : tabScript

  return DualExplorerComponent
}) satisfies QuartzComponentConstructor
```

- [ ] **Step 3: Create dualexplorer.scss**

```scss
.dual-explorer {
  display: flex;
  flex-direction: column;
}

.dual-explorer-tabs {
  display: flex;
  border-bottom: 1px solid var(--lightgray);
  margin-bottom: 0.5rem;
}

.tab-btn {
  flex: 1;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  padding: 0.35rem 0.5rem;
  font-size: 0.82rem;
  font-family: var(--bodyFont);
  color: var(--darkgray);
  cursor: pointer;
  transition:
    color 0.15s,
    border-color 0.15s;

  &:hover {
    color: var(--dark);
  }

  &.active {
    color: var(--secondary);
    border-bottom-color: var(--secondary);
    font-weight: 600;
  }
}

.tab-panel.hidden {
  display: none;
}

.topics-list {
  list-style: none;
  padding: 0;
  margin: 0;

  li {
    padding: 0.15rem 0;
  }

  a {
    display: block;
    padding: 0.3rem 0.5rem;
    border-radius: 4px;
    font-size: 0.88rem;
    color: var(--dark);
    text-decoration: none;
    transition:
      background-color 0.15s,
      color 0.15s;

    &:hover {
      background-color: var(--lightgray);
      color: var(--secondary);
    }
  }
}
```

- [ ] **Step 4: Export from quartz/components/index.ts**

Add alongside the FloatingControls export added in Task 6:

```ts
export { default as DualExplorer } from "./DualExplorer"
```

- [ ] **Step 5: Type check**

```bash
npm run check 2>&1 | grep -i "dualexplorer\|error" | head -20
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add quartz/components/DualExplorer.tsx quartz/components/styles/dualexplorer.scss quartz/components/index.ts
git commit -m "feat: add DualExplorer with content/topics tab switcher"
```

---

### Task 8: Update quartz.config.yaml and quartz.ts

**Files:**

- Modify: `quartz.config.yaml`
- Modify: `quartz.ts`

- [ ] **Step 1: Read current layout**

```bash
grep -n "component:\|priority:\|explorer\|darkmode\|reader-mode\|toolbar\|afterBody\|left:" quartz.config.yaml | head -40
cat quartz.ts
```

- [ ] **Step 2: Replace explorer with DualExplorer in left sidebar**

Find the explorer entry under `left:` in quartz.config.yaml:

```yaml
- component: explorer
  priority: 50
```

Replace with:

```yaml
- component: DualExplorer
  priority: 50
```

- [ ] **Step 3: Add FloatingControls to afterBody**

Under `afterBody:` in quartz.config.yaml, add:

```yaml
- component: FloatingControls
  options:
    components:
      - Darkmode
      - ReaderMode
```

- [ ] **Step 4: Remove darkmode and reader-mode from toolbar**

Find the toolbar section and remove the `Darkmode` and `ReaderMode` entries — they now live in FloatingControls. Keep `search` in the toolbar.

- [ ] **Step 5: Update quartz.ts — remove the old explorer filterFn override**

The `"explorer"` component no longer exists in the layout (replaced by `"DualExplorer"`), and DualExplorer passes its own `filterFn` directly to `ExplorerConstructor` in its TSX file. The override is now dead code — remove it:

```ts
componentRegistry.setOptionOverrides("explorer", {
  filterFn: (node: { slugSegment: string }) =>
    node.slugSegment !== "tags" && node.slugSegment !== "eth",
})
```

- [ ] **Step 6: Build and verify**

```bash
npm run build 2>&1 | grep -E "^error|Error:" | head -20
npm run preview
```

Open `http://localhost:4173` and verify:

- Left sidebar shows DualExplorer with "Content" and "Topics" tabs
- Content tab: file tree with Notes, Projects, Log, About — no topics/, eth/, tags/
- Topics tab: 7 topic cluster links
- Bottom-left: FloatingControls pill with dark/reader mode buttons
- Both toggles work from the pill
- Tab selection persists when navigating between pages (localStorage)

- [ ] **Step 7: Commit**

```bash
git add quartz.config.yaml quartz.ts
git commit -m "feat: wire up DualExplorer and FloatingControls in config"
```

---

### Task 9: Replace publish manifest with garden-state.json

**Files:**

- Create: `garden-state.json`
- Remove: `.publish-manifest.json` from git tracking

- [ ] **Step 1: Archive the old manifest for reference**

```bash
cp .publish-manifest.json .publish-manifest.json.archive
```

- [ ] **Step 2: Create empty garden-state.json**

Create `garden-state.json` with contents:

```json
{}
```

- [ ] **Step 3: Stop tracking the old manifest**

```bash
git rm .publish-manifest.json
```

- [ ] **Step 4: Add deprecation notice to publish script**

At the top of `scripts/publish.mjs`, add:

```js
// DEPRECATED: superseded by the Hermes Publisher agent.
// Do not run this script. See docs/superpowers/specs/2026-06-01-garden-revamp-design.md
```

- [ ] **Step 5: Commit**

```bash
git add garden-state.json scripts/publish.mjs
git commit -m "feat: replace .publish-manifest.json with garden-state.json (Hermes-managed)"
```

---

### Task 10: End-to-end verification

**Files:** none

- [ ] **Step 1: Full production build**

```bash
npm run build
```

Expected: 0 errors. Note any warnings.

- [ ] **Step 2: Check all routes render**

```bash
npm run preview
```

Open each URL and confirm it renders without a blank page or 404:

| URL                               | Expected                                    |
| --------------------------------- | ------------------------------------------- |
| `/`                               | Landing page with section links and → About |
| `/about`                          | About page with CV link                     |
| `/notes`                          | Notes index with embedded Base table        |
| `/projects`                       | Projects index with embedded Base           |
| `/log`                            | Log index with embedded Base                |
| `/log/books`                      | Books index with card Base                  |
| `/log/films`                      | Films index with card Base                  |
| `/log/youtube`                    | YouTube index                               |
| `/log/exercise`                   | Exercise index                              |
| `/topics/philosophy-and-thinking` | Topic Base page with filtered notes         |
| `/topics/wellbeing-and-growth`    | Topic Base page                             |
| `/topics/travel-and-adventure`    | Topic Base page                             |
| `/topics/society-and-systems`     | Topic Base page                             |
| `/topics/psychology`              | Topic Base page                             |
| `/topics/building`                | Topic Base page with Notes + Projects views |
| `/topics/health`                  | Topic Base page                             |

- [ ] **Step 3: Check Cloudflare analytics beacon**

Open browser devtools → Network tab → navigate to any page → filter requests by `cloudflareinsights`. Confirm the beacon fires.

If it doesn't fire: check that the Cloudflare token in `quartz.config.yaml` under `analytics:` still matches the token from before the v4→v5 upgrade (`a4f83cd948034998979ee9c2f5d992d4`).

- [ ] **Step 4: Push to deploy**

```bash
git push origin main
```

Expected: GitHub Actions deploy workflow triggers. Confirm deploy succeeds and `garden.franco.international` reflects the new structure.

---

## Out of scope — separate plans

- **Cloudflare analytics on other sites**: add tracking to `franco.international` and `cv.franco.international`; verify garden analytics post-v5
- **Hermes Publisher MCP tools**: `get_note`, `search_vault`, `list_publishable`, `get_garden_state`
- **Publisher system prompt + adaptation rules**
- **garden-state.json population**: Hermes does this on first publish run
- **ETH notes section**: add in ~1 year (2027)

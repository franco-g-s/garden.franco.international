import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { concatenateResources } from "../util/resources"
import { External } from "./external"

interface TopicLink {
  label: string
  slug: string
}

interface DualExplorerOptions {
  topics: TopicLink[]
  /** Options forwarded to the Explorer plugin component */
  explorerOptions?: {
    filterFn?: (node: { name: string; slugSegment: string; isFolder: boolean }) => boolean
    [key: string]: unknown
  }
}

const defaultTopics: TopicLink[] = [
  { label: "Philosophy & Thinking", slug: "topics/philosophy-and-thinking.base" },
  { label: "Wellbeing & Growth", slug: "topics/wellbeing-and-growth.base" },
  { label: "Travel & Adventure", slug: "topics/travel-and-adventure.base" },
  { label: "Society & Systems", slug: "topics/society-and-systems.base" },
  { label: "Psychology", slug: "topics/psychology.base" },
  { label: "Building", slug: "topics/building.base" },
  { label: "Health & Exercise", slug: "topics/health-and-exercise.base" },
]

/** Tab persistence: saves/restores active tab across Quartz SPA navigations */
const tabScript = `
;(function () {
  var KEY = "dual-explorer-tab"
  function init() {
    var container = document.querySelector(".dual-explorer")
    if (!container) return
    var tabs = container.querySelectorAll(".tab-btn")
    var panels = container.querySelectorAll(".tab-panel")
    if (!tabs.length) return
    var saved = localStorage.getItem(KEY) || "content"
    function activate(name) {
      tabs.forEach(function(t) { t.classList.toggle("active", t.dataset.tab === name) })
      panels.forEach(function(p) { p.classList.toggle("hidden", p.dataset.panel !== name) })
      localStorage.setItem(KEY, name)
    }
    activate(saved)
    tabs.forEach(function(tab) {
      tab.addEventListener("click", function() { activate(tab.dataset.tab) })
    })
  }
  document.addEventListener("DOMContentLoaded", init)
  document.addEventListener("nav", init)
})()
`

const css = `
.dual-explorer { display: flex; flex-direction: column; }
.dual-explorer-tabs { display: flex; border-bottom: 1px solid var(--lightgray); margin-bottom: 0.5rem; }
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
  transition: color 0.15s, border-color 0.15s;
}
.tab-btn:hover { color: var(--dark); }
.tab-btn.active { color: var(--secondary); border-bottom-color: var(--secondary); font-weight: 600; }
.tab-panel.hidden { display: none; }
.topics-list { list-style: none; padding: 0; margin: 0; }
.topics-list li { padding: 0.15rem 0; }
.topics-list a {
  display: block;
  padding: 0.3rem 0.5rem;
  border-radius: 4px;
  font-size: 0.88rem;
  color: var(--dark);
  text-decoration: none;
  transition: background-color 0.15s, color 0.15s;
}
.topics-list a:hover { background-color: var(--lightgray); color: var(--secondary); }
.dual-explorer .title-button.desktop-explorer { display: none; }
.dual-explorer .explorer-ul > li > a.nav-file-title {
  color: var(--secondary);
  font-family: var(--headerFont);
  font-size: 0.95rem;
  font-weight: 600;
  line-height: 1.5rem;
}
`

export default ((opts?: Partial<DualExplorerOptions>) => {
  const topics = opts?.topics ?? defaultTopics

  // Get the Explorer component from the plugin registry.
  // Explorer must be installed (github:quartz-community/explorer) and loaded before this runs.
  let ExplorerInstance: QuartzComponent | null = null
  try {
    ExplorerInstance = External("explorer", opts?.explorerOptions)
  } catch {
    // Explorer plugin not yet installed — degrade gracefully (topics tab still works)
    ExplorerInstance = null
  }

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
        {ExplorerInstance ? <ExplorerInstance {...props} /> : null}
      </div>
      <div class="tab-panel hidden" data-panel="topics" role="tabpanel">
        <ul class="topics-list">
          {topics.map((t) => (
            <li>
              <a href={`/${t.slug}`}>{t.label}</a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )

  DualExplorerComponent.css = concatenateResources(ExplorerInstance?.css, css)
  DualExplorerComponent.afterDOMLoaded = concatenateResources(
    ExplorerInstance?.afterDOMLoaded,
    tabScript,
  )
  if (ExplorerInstance?.beforeDOMLoaded) {
    DualExplorerComponent.beforeDOMLoaded = ExplorerInstance.beforeDOMLoaded
  }

  return DualExplorerComponent
}) satisfies QuartzComponentConstructor

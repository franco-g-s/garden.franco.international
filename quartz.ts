import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"
import { registerCondition } from "./quartz/plugins/loader/conditions"
import { componentRegistry } from "./quartz/components/registry"
import DualExplorer from "./quartz/components/DualExplorer"
import FloatingControls from "./quartz/components/FloatingControls"

// Register custom condition: show only on the index/homepage
registerCondition("index-only", (props) => props.fileData.slug === "index")

// Register built-in custom components in the component registry so the YAML config-loader
// can resolve them by PascalCase name (e.g. "DualExplorer", "FloatingControls").
// The YAML entries for these use fake github sources (github:quartz-builtin/...) which will
// fail to install, but the install failure is non-fatal — the components are found via the
// registry lookup that follows.
componentRegistry.register("DualExplorer", DualExplorer, "builtin")
componentRegistry.register("FloatingControls", FloatingControls, "builtin")

// Pass the explorer filterFn via DualExplorer's explorerOptions.
// The config-loader will merge this into DualExplorer's options when instantiating it.
// DualExplorer forwards explorerOptions to External("explorer", opts?.explorerOptions).
// The override key must match extractPluginName(entry.source) = "dual-explorer".
componentRegistry.setOptionOverrides("dual-explorer", {
  explorerOptions: {
    filterFn: (node: { slugSegment: string }) =>
      node.slugSegment !== "tags" &&
      node.slugSegment !== "eth" &&
      node.slugSegment !== "topics" &&
      node.slugSegment !== "index",
  },
})

const config = await loadQuartzConfig()
export default config
export const layout = await loadQuartzLayout()

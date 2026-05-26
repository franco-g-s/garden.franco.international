import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"
import { registerCondition } from "./quartz/plugins/loader/conditions"
import { componentRegistry } from "./quartz/components/registry"

// Register custom condition: show only on the index/homepage
registerCondition("index-only", (props) => props.fileData.slug === "index")

// Set TypeScript-level option overrides for the Explorer plugin.
// filterFn cannot be expressed in YAML, so it's set here before loadQuartzConfig()
// is called. The config-loader will merge this into the plugin options when
// instantiating the Explorer component.
componentRegistry.setOptionOverrides("explorer", {
  filterFn: (node: { slugSegment: string }) =>
    node.slugSegment !== "tags" && node.slugSegment !== "eth",
})

const config = await loadQuartzConfig()
export default config
export const layout = await loadQuartzLayout()

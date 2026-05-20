import { QuartzEmitterPlugin } from "../types"
import { write } from "./helpers"
import { FullSlug, simplifySlug } from "../../util/path"
import { getDate } from "../../components/Date"

interface Options {
  limit: number
}

const defaultOptions: Options = {
  limit: 10,
}

export const JsonFeed: QuartzEmitterPlugin<Options> = (userOpts) => {
  const opts = { ...defaultOptions, ...userOpts }
  return {
    name: "JsonFeed",
    async emit(ctx, content) {
      const cfg = ctx.cfg.configuration

      const entries = content
        .map((file) => {
          const [_tree, vfile] = file
          const fm = vfile.data.frontmatter
          const date = getDate(cfg, vfile.data)
          return {
            title: (fm?.title as string) ?? vfile.data.slug ?? "",
            slug: simplifySlug(vfile.data.slug!),
            date: date ? date.toISOString().split("T")[0] : null,
            description: (fm?.description as string) ?? null,
          }
        })
        .filter((e) => e.title && e.slug !== "index" && !e.slug.startsWith("tags/"))
        .sort((a, b) => {
          if (a.date && b.date) return b.date.localeCompare(a.date)
          if (a.date) return -1
          if (b.date) return 1
          return a.title.localeCompare(b.title)
        })
        .slice(0, opts.limit)

      const path = await write({
        ctx,
        slug: "notes.json" as FullSlug,
        ext: "",
        content: JSON.stringify(entries, null, 2),
      })
      return [path]
    },
    async *partialEmit() {},
  }
}

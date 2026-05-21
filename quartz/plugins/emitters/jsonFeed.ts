import { QuartzEmitterPlugin } from "../types"
import { write } from "./helpers"
import { FullSlug, simplifySlug } from "../../util/path"
import { getDate } from "../../components/Date"
import { toString } from "mdast-util-to-string"

interface Options {
  limit: number
  excerptLength?: number
}

const defaultOptions: Options = {
  limit: 40,
  excerptLength: 280,
}

// Extract description: use the first line of body text that is long enough
// to be a prose sentence rather than a heading (>= 50 chars). Falls back
// to the first non-empty line if nothing longer is found.
function extractDescription(tree: any, maxLen: number): string | null {
  const raw = toString(tree)
  if (!raw.trim()) return null

  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean)
  const body = lines.find((l) => l.length >= 50) ?? lines[0] ?? ""
  if (!body) return null

  return body.length > maxLen ? body.slice(0, maxLen).trimEnd() + "…" : body
}

export const JsonFeed: QuartzEmitterPlugin<Options> = (userOpts) => {
  const opts = { ...defaultOptions, ...userOpts }
  return {
    name: "JsonFeed",
    async emit(ctx, content) {
      const cfg = ctx.cfg.configuration

      const entries = content
        .map((file) => {
          const [tree, vfile] = file
          const fm = vfile.data.frontmatter
          const date = getDate(cfg, vfile.data)

          const maxLen = opts.excerptLength ?? 280
          const description: string | null =
            (fm?.description as string) ?? extractDescription(tree, maxLen)

          return {
            title: (fm?.title as string) ?? vfile.data.slug ?? "",
            slug: simplifySlug(vfile.data.slug!),
            date: date ? date.toISOString().split("T")[0] : null,
            description,
          }
        })
        .filter((e) => e.title && e.slug !== "index" && !e.slug.startsWith("tags/"))
        .sort((a, b) => {
          // Section index pages (slug ends with /) always sort first so they
          // are never pushed out of the feed by newer leaf-note entries.
          const aIdx = a.slug.endsWith("/")
          const bIdx = b.slug.endsWith("/")
          if (aIdx !== bIdx) return aIdx ? -1 : 1
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

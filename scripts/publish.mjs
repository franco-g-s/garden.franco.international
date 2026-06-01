#!/usr/bin/env node

/**
 * Publishing script for franco.international
 *
 * Publishes selected notes from the private Obsidian vault to the public
 * Quartz website. Notes are selected by the `publish: true` frontmatter
 * property and routed to website directories based on tags/areas/web-path.
 *
 * Usage:
 *   node scripts/publish.mjs                 # Dry-run (default)
 *   node scripts/publish.mjs --execute       # Publish + commit + preview + push
 *   node scripts/publish.mjs --clean         # Remove all script-created files
 *   node scripts/publish.mjs --verify        # Check published files match source
 */

import fs from "fs"
import path from "path"
import { execSync } from "child_process"
import { createHash } from "crypto"
import { createRequire } from "module"
import readline from "readline"

// Use Quartz's gray-matter (already installed)
const require = createRequire(import.meta.url)
const matter = require("gray-matter")

// ── Configuration ──────────────────────────────────────────────────────

const WEBSITE_ROOT = path.resolve(import.meta.dirname, "..")
const VAULT_ROOT = path.join(
  process.env.HOME,
  "Library/Mobile Documents/iCloud~md~obsidian/Documents/FGS",
)
const CONTENT_DIR = path.join(WEBSITE_ROOT, "content")
const MANIFEST_PATH = path.join(WEBSITE_ROOT, ".publish-manifest.json")

// Properties to strip from published frontmatter
const STRIP_PROPERTIES = new Set([
  "publish",
  "web-path",
  "web-title",
  "people",
  "space",
  "packing list",
  "expenses",
  "groups",
  "attachments",
])

// Properties to keep in published frontmatter
const KEEP_PROPERTIES = new Set([
  // Basic metadata
  "created",
  "tags",
  "title",
  "source",
  "author",
  "published",
  "description",
  "web-description",

  // Status & rating
  "status",
  "rating",

  // Dates
  "start",
  "end",
  "due",
  "date",
  "filming_date",
  "filmed",

  // Categorization
  "type",
  "categories",
  "genre",
  "seasons",

  // References & links
  "url",
  "topics",
  "books",
  "clippings",
  "collections",
  "trips",
  "related",
  "projects",

  // Location
  "countries",
  "cities",
  "coordinates",

  // Media metadata
  "cast",
  "director",
  "producer",
  "writer",
  "duration",
  "year",
  "language",
  "image",

  // Other
  "r-value",
  "aliases",
  "cssclasses",
  "journal-index",
])

// Image/media extensions for attachment detection
const ATTACHMENT_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".svg",
  ".webp",
  ".bmp",
  ".ico",
  ".mp4",
  ".webm",
  ".ogv",
  ".mov",
  ".mp3",
  ".ogg",
  ".wav",
  ".flac",
  ".pdf",
])

// ── Helpers ────────────────────────────────────────────────────────────

function slugify(str) {
  return str.toLowerCase().replace(/\s+/g, "-")
}

function contentHash(content) {
  return createHash("sha256").update(content).digest("hex").slice(0, 16)
}

function loadManifest() {
  if (fs.existsSync(MANIFEST_PATH)) {
    return JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf-8"))
  }
  return { files: {}, attachments: {} }
}

function saveManifest(manifest) {
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n")
}

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.trim().toLowerCase())
    })
  })
}

// ── Note Discovery ─────────────────────────────────────────────────────

function findPublishableNotes() {
  const notes = []
  walkDir(VAULT_ROOT, notes)
  return notes
}

function walkDir(dir, notes) {
  // Skip hidden dirs, node_modules, .obsidian, Attachments, Templates
  const basename = path.basename(dir)
  if (
    basename.startsWith(".") ||
    basename === "node_modules" ||
    basename === "Attachments" ||
    basename === "Templates"
  )
    return

  let entries
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walkDir(fullPath, notes)
    } else if (entry.name.endsWith(".md") && !entry.name.startsWith(".")) {
      try {
        const raw = fs.readFileSync(fullPath, "utf-8")
        const { data, content } = matter(raw)
        if (data.publish === true) {
          const relativePath = path.relative(VAULT_ROOT, fullPath)
          notes.push({ fullPath, relativePath, data, content, raw })
        }
      } catch {
        // Skip files that can't be parsed
      }
    }
  }
}

// ── Routing ────────────────────────────────────────────────────────────

function computeRoute(note) {
  const { data, relativePath } = note
  const tags = Array.isArray(data.tags) ? data.tags : []
  const areas = Array.isArray(data.areas)
    ? data.areas.map((a) => (typeof a === "string" ? a : ""))
    : []

  // Rule 1: Explicit web-path
  if (data["web-path"]) {
    return { webPath: data["web-path"], rule: `web-path: ${data["web-path"]} (explicit)` }
  }

  // Rule 2: ETH notes — mirror folder structure
  if (relativePath.startsWith("ETH/") || relativePath.startsWith("ETH\\")) {
    const parts = relativePath.split(path.sep)
    // ETH / CourseName / ... / file.md → eth/course-name/
    if (parts.length >= 2) {
      const courseParts = parts.slice(1, -1) // exclude "ETH" and filename
      const slugged = courseParts.map(slugify)
      const webPath = ["eth", ...slugged].join("/")
      return { webPath, rule: `ETH path → ${webPath}` }
    }
    return { webPath: "eth", rule: "ETH root" }
  }

  // Rule 3: books tag
  if (tags.includes("books")) return { webPath: "books", rule: "tags:books → books" }

  // Rule 4: movies tag
  if (tags.includes("movies")) return { webPath: "media", rule: "tags:movies → media" }

  // Rule 5: project or business tag
  if (tags.includes("project") || tags.includes("business"))
    return { webPath: "projects", rule: "tags:project/business → projects" }

  // Rule 6: clippings tag
  if (tags.includes("clippings")) return { webPath: "notes", rule: "tags:clippings → notes" }

  // Rule 7: Books area
  if (areas.some((a) => a.includes("[[Books]]")))
    return { webPath: "books", rule: "areas:Books → books" }

  // Rule 8: Movies area
  if (areas.some((a) => a.includes("[[Movies]]")))
    return { webPath: "media", rule: "areas:Movies → media" }

  // Rule 9: Projects area
  if (areas.some((a) => a.includes("[[Projects]]")))
    return { webPath: "projects", rule: "areas:Projects → projects" }

  // Rule 10: Fallback
  return { webPath: "notes", rule: "fallback → notes" }
}

// ── Content Transformation ─────────────────────────────────────────────

/**
 * Transform wikilinks to use correct web paths
 * @param {string} content - The markdown content
 * @param {Map} noteTitleMap - Map of note titles (lowercase) to {webPath, filename, basename}
 * @returns {string} - Content with transformed wikilinks
 */
function transformWikilinks(content, noteTitleMap) {
  // Match [[Title]] or [[Title|Display Text]] or [[Title#heading]]
  const wikilinkRegex = /\[\[([^\]|#]+)(?:#([^\]|]+))?(?:\|([^\]]+))?\]\]/g

  return content.replace(wikilinkRegex, (match, title, heading, displayText) => {
    const normalizedTitle = title.trim().toLowerCase()

    // Look up the note in our mapping
    const target = noteTitleMap.get(normalizedTitle)

    if (!target) {
      // Note not found in published notes - keep as plain text (broken link)
      return displayText || title
    }

    // Build the full path
    const fullPath = target.webPath ? `${target.webPath}/${target.basename}` : target.basename
    const display = displayText || title
    const headingPart = heading ? `#${heading}` : ""

    // Return transformed wikilink with full path
    return `[[${fullPath}${headingPart}|${display}]]`
  })
}

/**
 * Extract wikilinks from frontmatter for backlink crawling
 * Returns array of wikilink paths (e.g., ["notes/File Name", "books/Book Title"])
 */
function extractPropertyLinks(frontmatter) {
  const links = []
  const wikilinkRegex = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g

  // Check all property values for wikilinks
  for (const value of Object.values(frontmatter)) {
    if (typeof value === "string") {
      let match
      while ((match = wikilinkRegex.exec(value)) !== null) {
        links.push(match[1].trim())
      }
    } else if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string") {
          let match
          while ((match = wikilinkRegex.exec(item)) !== null) {
            links.push(match[1].trim())
          }
        }
      }
    }
  }

  return links
}

function transformContent(content, noteTitleMap = null, frontmatter = null) {
  let result = content

  // Strip %%...%% comments (single-line and multi-line)
  result = result.replace(/%%[\s\S]*?%%/g, "")

  // Remove .base embed lines (BEFORE wikilink transformation)
  result = result.replace(/^\s*!\[\[.*\.base.*\]\]\s*$/gm, "")

  // Remove heading directly above base embed (if it exists)
  result = result.replace(/^#{1,6}\s+.+\n(?:\s*!\[\[.*\.base.*\]\]\s*\n?)+/gm, "")

  // Transform wikilinks if we have the mapping
  if (noteTitleMap) {
    result = transformWikilinks(result, noteTitleMap)
  }

  // Remove trailing orphaned headings (heading at the very end with no content after)
  const lines = result.split("\n")
  while (lines.length > 0) {
    const last = lines[lines.length - 1].trim()
    if (last === "") {
      lines.pop()
      continue
    }
    if (/^#{1,6}\s+/.test(last)) {
      lines.pop()
      continue
    }
    break
  }
  result = lines.join("\n")

  // Clean up excessive blank lines (more than 2 consecutive)
  result = result.replace(/\n{4,}/g, "\n\n\n")

  // Escape > at the start of list items to prevent callout rendering
  result = result.replace(/^(\s*[-*+]\s+)>/gm, "$1\\>")

  // Add double spaces at end of lines that match "Label: value" pattern
  // to force line breaks in markdown (only if not already a list item or heading)
  result = result.replace(/^([^#\-*+\s][^:\n]*:\s*[^\n]+)$/gm, "$1  ")

  // Trim trailing whitespace
  result = result.trimEnd()

  // Add hidden section with property links for backlink crawling
  // Output as pure markdown (not HTML) so Quartz processes the wikilinks
  if (frontmatter && noteTitleMap) {
    const propertyLinks = extractPropertyLinks(frontmatter)
    if (propertyLinks.length > 0) {
      // Add horizontal rule to separate, then links as markdown paragraph
      result += "\n\n---\n\n"
      for (const link of propertyLinks) {
        result += `[[${link}]] `
      }
      result += "\n"
    }
  }

  return result
}

function transformFrontmatter(data, noteTitleMap = null, indexNoteTitle = null) {
  const result = {}

  // Apply web-title override
  if (data["web-title"]) {
    result.title = data["web-title"]
  }

  // Copy kept properties
  for (const [key, value] of Object.entries(data)) {
    if (STRIP_PROPERTIES.has(key)) continue
    if (key === "title" && data["web-title"]) continue // web-title takes precedence
    if (value === null || value === undefined || value === "") continue
    if (Array.isArray(value) && value.length === 0) continue
    result[key] = value
  }

  // If this is an index note and no title is set, use the basename (capitalized)
  if (indexNoteTitle && !result.title) {
    result.title = indexNoteTitle.charAt(0).toUpperCase() + indexNoteTitle.slice(1)
  }

  // Format dates as YYYY-MM-DD strings (gray-matter parses them into Date objects)
  for (const [key, value] of Object.entries(result)) {
    if (value instanceof Date) {
      result[key] = value.toISOString().slice(0, 10)
    }
  }

  // Transform or strip wikilink syntax from properties
  for (const [key, value] of Object.entries(result)) {
    if (typeof value === "string") {
      result[key] = transformPropertyWikilinks(value, noteTitleMap).trim()
    } else if (Array.isArray(value)) {
      result[key] = value
        .map((v) =>
          typeof v === "string" ? transformPropertyWikilinks(v, noteTitleMap).trim() : v,
        )
        .filter((v) => v !== "") // Remove empty strings
    }
  }

  return result
}

/**
 * Transform wikilinks in property values
 * If note exists in published notes, keep as wikilink; otherwise strip to plain text
 */
function transformPropertyWikilinks(value, noteTitleMap) {
  if (!noteTitleMap) {
    // No map available, just strip wikilinks
    return value.replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, "$1")
  }

  // Map area names to their index pages
  const areaIndexMap = {
    books: "media/books/index",
    movies: "media/movies/index",
    youtube: "media/youtube/index",
    media: "media/index",
    notes: "notes/index",
    projects: "projects/index",
    exercise: "exercise/index",
    about: "about/index",
  }

  return value.replace(
    /\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|([^\]]+))?\]\]/g,
    (match, title, displayText) => {
      const normalizedTitle = title.trim().toLowerCase()

      // Check if this is a known area name
      if (areaIndexMap[normalizedTitle]) {
        const display = displayText || title
        return `[[${areaIndexMap[normalizedTitle]}|${display}]]`
      }

      const target = noteTitleMap.get(normalizedTitle)

      if (!target) {
        // Note not published - strip to plain text
        return displayText || title
      }

      // Note exists - keep as wikilink with full path
      const fullPath = target.webPath ? `${target.webPath}/${target.basename}` : target.basename
      const display = displayText || title
      return `[[${fullPath}|${display}]]`
    },
  )
}

// ── Attachment Handling ────────────────────────────────────────────────

function findReferencedAttachments(content) {
  const attachments = []
  // Match ![[filename.ext]] where ext is an image/media type
  const regex = /!\[\[([^\]]+)\]\]/g
  let match
  while ((match = regex.exec(content)) !== null) {
    const ref = match[1].split("|")[0].trim() // strip aliases like |300
    const ext = path.extname(ref).toLowerCase()
    if (ATTACHMENT_EXTENSIONS.has(ext)) {
      attachments.push(ref)
    }
  }
  return attachments
}

function findAttachmentInVault(filename) {
  const attachmentsDir = path.join(VAULT_ROOT, "Attachments")
  if (!fs.existsSync(attachmentsDir)) return null

  // Direct match
  const directPath = path.join(attachmentsDir, filename)
  if (fs.existsSync(directPath)) return directPath

  // Search recursively in Attachments/
  return searchFile(attachmentsDir, filename)
}

function searchFile(dir, filename) {
  let entries
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return null
  }
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      const found = searchFile(fullPath, filename)
      if (found) return found
    } else if (entry.name === filename) {
      return fullPath
    }
  }
  return null
}

// ── Build Publish Plan ─────────────────────────────────────────────────

function buildPublishPlan() {
  const notes = findPublishableNotes()
  const manifest = loadManifest()
  const plan = {
    notes: [],
    attachments: [],
    orphans: [],
    brokenLinks: [],
    webPathWritebacks: [],
  }

  // Build note title map for wikilink resolution
  // Map: title (lowercase) → {webPath, basename, filename}
  const noteTitleMap = new Map()
  for (const note of notes) {
    const { webPath } = computeRoute(note)
    const filename = path.basename(note.fullPath)
    const basename = path.basename(note.fullPath, ".md")

    // Add by filename (without extension)
    const normalizedTitle = basename.toLowerCase()
    noteTitleMap.set(normalizedTitle, { webPath, basename, filename })

    // Also add by frontmatter title if it exists and differs
    if (note.data.title && note.data.title.toLowerCase() !== normalizedTitle) {
      noteTitleMap.set(note.data.title.toLowerCase(), { webPath, basename, filename })
    }

    // Add by aliases
    if (note.data.aliases && Array.isArray(note.data.aliases)) {
      for (const alias of note.data.aliases) {
        if (typeof alias === "string") {
          noteTitleMap.set(alias.toLowerCase(), { webPath, basename, filename })
        }
      }
    }
  }

  // Collect all published note filenames for broken link detection
  const publishedFiles = new Set()
  for (const note of notes) {
    publishedFiles.add(path.basename(note.fullPath, ".md"))
  }

  for (const note of notes) {
    const { webPath, rule } = computeRoute(note)
    let filename = path.basename(note.fullPath)
    const basename = path.basename(note.fullPath, ".md")

    // If note basename matches the last segment of webPath, make it index.md
    const webPathSegments = webPath.split("/")
    const lastSegment = webPathSegments[webPathSegments.length - 1]
    const isIndexNote = basename.toLowerCase() === lastSegment.toLowerCase()
    if (isIndexNote) {
      filename = "index.md"
    }

    const targetPath = path.join(CONTENT_DIR, webPath, filename)
    const relativeTarget = path.relative(WEBSITE_ROOT, targetPath)

    // Transform frontmatter first (to get properly resolved wikilinks)
    // Pass isIndexNote and basename so we can set proper title for index notes
    const transformedFrontmatter = transformFrontmatter(
      note.data,
      noteTitleMap,
      isIndexNote ? basename : null,
    )

    // Then transform content, passing transformed frontmatter for backlink extraction
    const transformedContent = transformContent(note.content, noteTitleMap, transformedFrontmatter)
    const publishedOutput = matter.stringify(transformedContent, transformedFrontmatter)
    const hash = contentHash(publishedOutput)

    // Determine status
    let status = "NEW"
    if (manifest.files[relativeTarget]) {
      if (manifest.files[relativeTarget].hash === hash) {
        status = "UNCHANGED"
      } else {
        status = "UPDATED"
      }
    }

    // Count transformations
    const baseEmbeds = (note.content.match(/^\s*!\[\[.*\.base.*\]\]\s*$/gm) || []).length
    const comments = (note.content.match(/%%[\s\S]*?%%/g) || []).length

    // Check if web-path needs writeback
    const needsWriteback = !note.data["web-path"]

    if (needsWriteback) {
      plan.webPathWritebacks.push({
        fullPath: note.fullPath,
        relativePath: note.relativePath,
        webPath,
      })
    }

    // Find attachments
    const attachmentRefs = findReferencedAttachments(note.content)
    for (const ref of attachmentRefs) {
      const sourcePath = findAttachmentInVault(ref)
      const attachTarget = path.join(CONTENT_DIR, "attachments", ref)
      const relAttachTarget = path.relative(WEBSITE_ROOT, attachTarget)

      let attachStatus = "NEW"
      if (sourcePath) {
        if (manifest.attachments[relAttachTarget]) {
          const sourceHash = contentHash(fs.readFileSync(sourcePath))
          if (manifest.attachments[relAttachTarget].hash === sourceHash) {
            attachStatus = "UNCHANGED"
          } else {
            attachStatus = "UPDATED"
          }
        }
        plan.attachments.push({
          ref,
          sourcePath,
          targetPath: attachTarget,
          relativeTarget: relAttachTarget,
          status: attachStatus,
        })
      } else {
        plan.attachments.push({
          ref,
          sourcePath: null,
          targetPath: attachTarget,
          relativeTarget: relAttachTarget,
          status: "NOT FOUND",
        })
      }
    }

    // Detect broken wikilinks
    const wikilinks = note.content.match(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g) || []
    for (const link of wikilinks) {
      const target = link.match(/\[\[([^\]|]+)/)?.[1]
      if (target && !publishedFiles.has(target) && !target.includes(".base")) {
        plan.brokenLinks.push({
          source: filename,
          target,
        })
      }
    }

    plan.notes.push({
      source: note.relativePath,
      filename,
      targetPath,
      relativeTarget,
      webPath,
      rule,
      status,
      hash,
      publishedOutput,
      basesRemoved: baseEmbeds,
      commentsStripped: comments,
      needsWriteback,
    })
  }

  // Find orphans: files in manifest that are no longer being published
  const currentTargets = new Set(plan.notes.map((n) => n.relativeTarget))
  const currentAttachments = new Set(
    plan.attachments.filter((a) => a.sourcePath).map((a) => a.relativeTarget),
  )

  for (const target of Object.keys(manifest.files)) {
    if (!currentTargets.has(target)) {
      plan.orphans.push({ path: target, type: "note" })
    }
  }
  for (const target of Object.keys(manifest.attachments)) {
    if (!currentAttachments.has(target)) {
      plan.orphans.push({ path: target, type: "attachment" })
    }
  }

  return plan
}

// ── Reporting ──────────────────────────────────────────────────────────

function printReport(plan, isDryRun) {
  const header = isDryRun ? "PUBLISHING REPORT (DRY RUN)" : "PUBLISHING REPORT"
  console.log(`\n${header}`)
  console.log("=".repeat(48))

  // Notes
  const notesToShow = plan.notes.filter((n) => n.status !== "UNCHANGED" || !isDryRun)
  console.log(`\nNOTES TO PUBLISH (${plan.notes.length}):`)
  if (plan.notes.length === 0) {
    console.log("  (none)")
  }
  for (const note of plan.notes) {
    const tag = `[${note.status}]`
    console.log(`  ${tag} ${note.filename}`)
    if (note.status !== "UNCHANGED") {
      console.log(`      Source:  ${note.source}`)
      console.log(`      Target:  ${note.relativeTarget}`)
      const writebackNote = note.needsWriteback
        ? ` (will write web-path: ${note.webPath} to source)`
        : ""
      console.log(`      Route:   ${note.rule}${writebackNote}`)
      if (note.basesRemoved > 0) console.log(`      Bases removed: ${note.basesRemoved}`)
      if (note.commentsStripped > 0)
        console.log(`      Comments stripped: ${note.commentsStripped}`)
    }
  }

  // Attachments
  const attachmentsToShow = plan.attachments.filter((a) => a.status !== "UNCHANGED")
  if (plan.attachments.length > 0) {
    console.log(`\nATTACHMENTS (${plan.attachments.length}):`)
    for (const att of plan.attachments) {
      if (att.status === "NOT FOUND") {
        console.log(`  [WARNING] ${att.ref} — not found in vault`)
      } else {
        console.log(`  [${att.status}] ${att.ref} → ${att.relativeTarget}`)
      }
    }
  }

  // Orphans
  if (plan.orphans.length > 0) {
    console.log(`\nORPHANS TO REMOVE (${plan.orphans.length}):`)
    for (const orphan of plan.orphans) {
      console.log(`  [REMOVE] ${orphan.path} (${orphan.type})`)
    }
  } else {
    console.log(`\nORPHANS TO REMOVE (0)`)
  }

  // Broken links
  if (plan.brokenLinks.length > 0) {
    console.log(`\nBROKEN WIKILINKS (informational):`)
    const unique = new Map()
    for (const link of plan.brokenLinks) {
      const key = `${link.source}→${link.target}`
      if (!unique.has(key)) unique.set(key, link)
    }
    for (const link of unique.values()) {
      console.log(`  ${link.source} → [[${link.target}]] (not published)`)
    }
  }

  if (isDryRun) {
    console.log(`\nRun with --execute to publish.\n`)
  } else {
    console.log()
  }
}

// ── Execute Mode ───────────────────────────────────────────────────────

async function executePlan(plan) {
  const manifest = loadManifest()
  let changesCount = 0

  // 1. Copy transformed notes
  for (const note of plan.notes) {
    if (note.status === "UNCHANGED") continue

    const targetDir = path.dirname(note.targetPath)
    fs.mkdirSync(targetDir, { recursive: true })
    fs.writeFileSync(note.targetPath, note.publishedOutput)
    manifest.files[note.relativeTarget] = {
      hash: note.hash,
      source: note.source,
      publishedAt: new Date().toISOString(),
    }
    changesCount++
    console.log(`  Copied: ${note.source} → ${note.relativeTarget}`)
  }

  // 2. Copy attachments
  for (const att of plan.attachments) {
    if (att.status === "UNCHANGED" || att.status === "NOT FOUND") continue

    const targetDir = path.dirname(att.targetPath)
    fs.mkdirSync(targetDir, { recursive: true })
    fs.copyFileSync(att.sourcePath, att.targetPath)
    const hash = contentHash(fs.readFileSync(att.sourcePath))
    manifest.attachments[att.relativeTarget] = {
      hash,
      source: att.ref,
      publishedAt: new Date().toISOString(),
    }
    changesCount++
    console.log(`  Copied attachment: ${att.ref} → ${att.relativeTarget}`)
  }

  // 3. Remove orphans
  for (const orphan of plan.orphans) {
    const fullPath = path.join(WEBSITE_ROOT, orphan.path)
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath)
      changesCount++
      console.log(`  Removed orphan: ${orphan.path}`)
    }
    if (orphan.type === "note") {
      delete manifest.files[orphan.path]
    } else {
      delete manifest.attachments[orphan.path]
    }
  }

  // 4. Write back web-path to source notes in private vault
  for (const wb of plan.webPathWritebacks) {
    const raw = fs.readFileSync(wb.fullPath, "utf-8")
    const { data, content } = matter(raw)
    data["web-path"] = wb.webPath
    const updated = matter.stringify(content, data)
    fs.writeFileSync(wb.fullPath, updated)
    console.log(`  Wrote web-path: ${wb.webPath} → ${wb.relativePath}`)
  }

  // 5. Save manifest
  saveManifest(manifest)

  if (changesCount === 0 && plan.webPathWritebacks.length === 0) {
    console.log("\n  No changes to publish.")
    return
  }

  // 6. Git commit in website repo
  try {
    execSync("git add -A", { cwd: WEBSITE_ROOT, stdio: "pipe" })
    const noteCount = plan.notes.filter((n) => n.status !== "UNCHANGED").length
    const msg = `publish: update ${noteCount} note(s) from private vault`
    execSync(`git commit -m "${msg}"`, { cwd: WEBSITE_ROOT, stdio: "pipe" })
    console.log(`\n  Committed to website repo: "${msg}"`)
  } catch (e) {
    // Nothing to commit
    console.log("\n  No changes to commit in website repo.")
  }

  // 7. Git commit in private vault (web-path writebacks)
  if (plan.webPathWritebacks.length > 0) {
    try {
      execSync("git add -A", { cwd: VAULT_ROOT, stdio: "pipe" })
      const msg = `publish: add web-path to ${plan.webPathWritebacks.length} note(s)`
      execSync(`git commit --author="Claude <noreply@anthropic.com>" -m "${msg}"`, {
        cwd: VAULT_ROOT,
        stdio: "pipe",
      })
      console.log(`  Committed to vault repo: "${msg}"`)
    } catch {
      console.log("  No changes to commit in vault repo.")
    }
  }

  // 8. Start preview
  console.log("\n  Starting local preview...")
  const previewProcess = require("child_process").spawn("npx", ["quartz", "build", "--serve"], {
    cwd: WEBSITE_ROOT,
    stdio: "inherit",
    detached: true,
  })

  // Wait a moment for server to start
  await new Promise((r) => setTimeout(r, 3000))

  // Open browser
  try {
    execSync("open http://localhost:8080", { stdio: "pipe" })
  } catch {
    console.log("  Open http://localhost:8080 in your browser to preview.")
  }

  // 9. Prompt for push
  const answer = await prompt("\n  Preview running. Push to deploy? (y/n): ")

  if (answer === "y" || answer === "yes") {
    try {
      execSync("git push", { cwd: WEBSITE_ROOT, stdio: "inherit" })
      console.log("  Pushed website repo.")
    } catch (e) {
      console.error("  Failed to push website repo:", e.message)
    }

    if (plan.webPathWritebacks.length > 0) {
      try {
        execSync("git push", { cwd: VAULT_ROOT, stdio: "inherit" })
        console.log("  Pushed vault repo.")
      } catch (e) {
        console.error("  Failed to push vault repo:", e.message)
      }
    }

    console.log("\n  Published successfully!")
  } else {
    console.log("  Changes committed locally. Push when ready.")
  }

  // Kill preview server
  try {
    process.kill(-previewProcess.pid)
  } catch {
    // Already exited
  }
}

// ── Clean Mode ─────────────────────────────────────────────────────────

function cleanPublished() {
  const manifest = loadManifest()
  let removed = 0

  for (const target of Object.keys(manifest.files)) {
    const fullPath = path.join(WEBSITE_ROOT, target)
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath)
      removed++
      console.log(`  Removed: ${target}`)
    }
  }

  for (const target of Object.keys(manifest.attachments)) {
    const fullPath = path.join(WEBSITE_ROOT, target)
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath)
      removed++
      console.log(`  Removed: ${target}`)
    }
  }

  // Reset manifest
  saveManifest({ files: {}, attachments: {} })
  console.log(`\nCleaned ${removed} file(s). Manifest reset.`)
}

// ── Verify Mode ────────────────────────────────────────────────────────

function verifyPublished() {
  const manifest = loadManifest()
  let issues = 0

  for (const [target, info] of Object.entries(manifest.files)) {
    const fullPath = path.join(WEBSITE_ROOT, target)
    if (!fs.existsSync(fullPath)) {
      console.log(`  MISSING: ${target}`)
      issues++
      continue
    }
    const currentHash = contentHash(fs.readFileSync(fullPath, "utf-8"))
    if (currentHash !== info.hash) {
      console.log(`  MODIFIED: ${target} (published file was edited manually)`)
      issues++
    }
  }

  for (const [target, info] of Object.entries(manifest.attachments)) {
    const fullPath = path.join(WEBSITE_ROOT, target)
    if (!fs.existsSync(fullPath)) {
      console.log(`  MISSING: ${target}`)
      issues++
    }
  }

  if (issues === 0) {
    console.log("  All published files match source. No issues found.")
  } else {
    console.log(`\n  ${issues} issue(s) found.`)
  }
}

// ── Main ───────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)

  if (args.includes("--clean")) {
    console.log("\nCLEANING PUBLISHED FILES")
    console.log("=".repeat(48))
    cleanPublished()
    return
  }

  if (args.includes("--verify")) {
    console.log("\nVERIFYING PUBLISHED FILES")
    console.log("=".repeat(48))
    verifyPublished()
    return
  }

  const execute = args.includes("--execute")

  console.log(`\nScanning vault: ${VAULT_ROOT}`)
  console.log(`Website:        ${WEBSITE_ROOT}`)

  const plan = buildPublishPlan()
  printReport(plan, !execute)

  if (execute) {
    await executePlan(plan)
  }
}

main().catch((e) => {
  console.error("Error:", e.message)
  process.exit(1)
})

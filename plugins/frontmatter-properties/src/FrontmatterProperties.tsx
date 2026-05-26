import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import { JSX } from "preact"
import { resolveRelative } from "../util/path"

interface FrontmatterPropertiesOptions {
  /**
   * Properties to display (in order)
   */
  properties?: string[]
  /**
   * Whether properties should be collapsed by default
   */
  collapsed?: boolean
}

const defaultOptions: FrontmatterPropertiesOptions = {
  properties: [
    // Basic metadata
    "source",
    "author",
    "published",
    "description",

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
    "areas",
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

    // Media metadata (movies, videos)
    "cast",
    "director",
    "producer",
    "writer",
    "duration",
    "year",
    "language",

    // Other
    "r-value",
    "aliases",
    "journal-index",
  ],
  collapsed: false,
}

export default ((opts?: Partial<FrontmatterPropertiesOptions>) => {
  const options: FrontmatterPropertiesOptions = { ...defaultOptions, ...opts }

  const FrontmatterProperties: QuartzComponent = ({
    fileData,
    displayClass,
  }: QuartzComponentProps) => {
    const frontmatter = fileData.frontmatter
    if (!frontmatter) return null

    const properties: JSX.Element[] = []

    // Helper to parse and render wikilinks in text
    const parseWikilinks = (text: string): (string | JSX.Element)[] => {
      const parts: (string | JSX.Element)[] = []
      const wikilinkRegex = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g
      let lastIndex = 0
      let match

      while ((match = wikilinkRegex.exec(text)) !== null) {
        // Add text before the wikilink
        if (match.index > lastIndex) {
          parts.push(text.slice(lastIndex, match.index))
        }

        const path = match[1].trim()
        const display = match[2]?.trim() || path.split("/").pop() || path

        // Construct proper URL - path is already the full web path
        // e.g., "notes/The fruitful simplicity" -> "/notes/The-fruitful-simplicity"
        const href = "/" + path.replace(/ /g, "-")

        parts.push(
          <a href={href} class="internal">
            {display}
          </a>,
        )

        lastIndex = match.index + match[0].length
      }

      // Add remaining text after last wikilink
      if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex))
      }

      return parts.length > 0 ? parts : [text]
    }

    // Helper to render value(s) - handles arrays and wikilinks
    const renderValue = (value: any): JSX.Element => {
      if (Array.isArray(value)) {
        if (value.length === 0) return <></>
        return (
          <>
            {value.map((item, idx) => (
              <span key={idx}>
                <span class="property-value-item">{parseWikilinks(String(item).trim())}</span>
                {idx < value.length - 1 && <span class="property-separator">, </span>}
              </span>
            ))}
          </>
        )
      }
      return <span class="property-value-item">{parseWikilinks(String(value).trim())}</span>
    }

    // Helper to create property label
    const formatLabel = (key: string): string => {
      // Handle special cases
      const specialCases: Record<string, string> = {
        url: "URL",
        "r-value": "R-Value",
        "journal-index": "Journal Index",
        filming_date: "Filming Date",
        filmed: "Filmed",
        due: "Due Date",
      }

      if (specialCases[key]) {
        return specialCases[key]
      }

      // Convert underscores to spaces and capitalize each word
      return key
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    }

    // Iterate through configured properties
    for (const prop of options.properties || []) {
      const value = frontmatter[prop]

      if (value !== undefined && value !== null && value !== "") {
        // Skip empty arrays
        if (Array.isArray(value) && value.length === 0) continue

        // Special handling for rating (show as X/7)
        if (prop === "rating") {
          properties.push(
            <div class="property-row">
              <div class="property-key">{formatLabel(prop)}</div>
              <div class="property-value">
                <span class="property-value-item rating-value">{value}/7</span>
              </div>
            </div>,
          )
        } else {
          properties.push(
            <div class="property-row">
              <div class="property-key">{formatLabel(prop)}</div>
              <div class="property-value">{renderValue(value)}</div>
            </div>,
          )
        }
      }
    }

    if (properties.length === 0) return null

    const collapsedClass = options.collapsed ? "is-collapsed" : ""

    return (
      <div class={classNames(displayClass, "frontmatter-properties", collapsedClass)}>
        <details open={!options.collapsed}>
          <summary>
            <svg
              class="fold-icon"
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
            <span class="properties-title">Properties</span>
          </summary>
          <div class="properties-list">{properties}</div>
        </details>
      </div>
    )
  }

  FrontmatterProperties.css = `
.frontmatter-properties {
  margin: 1rem 0;
  padding: 0.75rem 1rem;
  background-color: var(--lightgray);
  border-radius: 8px;
  font-size: 0.85rem;
}

.frontmatter-properties details {
  cursor: default;
}

.frontmatter-properties summary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
  font-weight: 600;
  color: var(--darkgray);
  list-style: none;
  padding: 0.25rem 0;
}

.frontmatter-properties summary::-webkit-details-marker {
  display: none;
}

.frontmatter-properties .fold-icon {
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

.frontmatter-properties details[open] .fold-icon {
  transform: rotate(0deg);
}

.frontmatter-properties details:not([open]) .fold-icon {
  transform: rotate(-90deg);
}

.frontmatter-properties .properties-title {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.frontmatter-properties .properties-list {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.frontmatter-properties .property-row {
  display: grid;
  grid-template-columns: minmax(100px, auto) 1fr;
  gap: 1rem;
  align-items: start;
}

.frontmatter-properties .property-key {
  font-weight: 500;
  color: var(--darkgray);
  font-size: 0.85rem;
}

.frontmatter-properties .property-value {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  color: var(--dark);
  font-size: 0.85rem;
}

.frontmatter-properties .property-value-item {
  display: inline;
}

.frontmatter-properties .property-separator {
  display: inline;
}

.frontmatter-properties .property-value a.internal {
  vertical-align: baseline;
  display: inline;
  line-height: inherit;
}

.frontmatter-properties .rating-value {
  font-weight: 600;
  color: var(--secondary);
}

/* Mobile: adjust grid columns */
@media (max-width: 600px) {
  .frontmatter-properties .property-row {
    grid-template-columns: minmax(80px, auto) 1fr;
    gap: 0.75rem;
  }
}
`

  return FrontmatterProperties
}) satisfies QuartzComponentConstructor

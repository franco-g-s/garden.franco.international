---
created: '2026-02-09'
tags:
  - project
areas:
  - '[[projects/index|Projects]]'
  - Coding
  - Automation
status: completed
related:
  - >-
    [[projects/Coding/QuickAdd Place Note Automation|QuickAdd Place Note
    Automation]]
  - Obsidian Rules
topics:
  - Obsidian
  - QuickAdd
  - '[[log/books/index|Books]]'
---

## Overview

QuickAdd script that automatically fetches book metadata from Google Books API and creates or updates book notes in the vault.

**Script Location:** `Scripts/book.js`

**API:** Google Books API (API key embedded in script)

## Features

- ✅ Search by book title or ISBN
- ✅ Fetch metadata from Google Books API
- ✅ Create new book notes OR update existing ones
- ✅ Smart metadata merging (only fills in missing fields)
- ✅ Fuzzy title matching (prevents duplicate notes)
- ✅ Auto-wikilink authors: `Author Name`
- ✅ Clean genre formatting (extracts main categories)
- ✅ High-resolution cover images
- ✅ Language code expansion (en → en-US)
- ✅ Cover image URL in frontmatter
- ✅ ISBN support (ISBN-13 preferred, fallback to ISBN-10)

## Setup

### 1. Prerequisites

- QuickAdd plugin installed and activated
- Google Books API key (already embedded in script)

### 2. Configure QuickAdd

1. Open Settings → QuickAdd
2. Add new **Macro** choice
3. Name it "Book" (or any name you prefer)
4. Click "Configure"
5. Add **User Script** command
6. Select `Scripts/book.js` from dropdown
7. Save
8. Enable lightning bolt ⚡ to add to command palette

**Note:** The script has the Google Books API key embedded directly, so no additional plugin dependencies are needed.

## Usage

### Creating a New Book Note

1. Run `QuickAdd: Book` from command palette  
2. Enter book title or ISBN
3. Select from search results (if multiple matches)
4. Choose status: `not started`, `reading`, `completed`, or `backlog`  
5. Note is created and opened

### Updating an Existing Book Note

1. Run `QuickAdd: Book` from command palette  
2. Enter the book title (doesn't need to be exact - fuzzy matching handles variations)
3. Select from search results
4. Script detects existing note and updates only missing metadata
5. Note is opened with updated metadata

## Metadata Mapping

| Google Books API | Vault Property | Format |
|------------------|----------------|--------|
| `volumeInfo.title` | Filename | `Title.md` |
| `volumeInfo.publishedDate` | `year` | Extracted year (e.g., `2018`) |
| `volumeInfo.authors[]` | `author` | Wikilinked list: `["James Clear"]` |  
| `volumeInfo.categories[]` | `genre` | Wikilinked list: `["Self-Help"]` |  
| `volumeInfo.language` | `language` | Expanded code: `en-US` |  
| `volumeInfo.imageLinks.extraLarge` | `image` | URL string (high-res) |
| `volumeInfo.industryIdentifiers` | `isbn` | ISBN-13 or ISBN-10 |
| Manual input | `status` | User selected |
| Auto-generated | `created` | Today's date (YYYY-MM-DD) |

**Note:** `topics` property is left empty and should be filled manually, as Google Books categories are too broad for specific topics.

## How It Works

### Search Flow

1. **Input:** User enters book title or ISBN  
2. **API Call:** Script calls Google Books API with query  
3. **Results:** Returns up to 10 matching books  
4. **Selection:** User selects correct book from suggester (or auto-selects if only one match)  
5. **Fetch Details:** Script fetches full volume details for high-res cover images  
6. **Check Existing:** Script checks if note already exists using fuzzy title matching in `Personal/Books/`  
7. **Update or Create:**  
   - If exists: Updates only empty frontmatter fields
   - If new: Prompts for status, then creates full note
8. **Open:** Opens the note in a new tab  

### Smart Metadata Merging

When updating existing notes, the script:
- Checks each frontmatter property  
- Only updates if the property is **empty** or **missing**
- Never overwrites existing user-entered data
- Preserves all other content in the note

### Language Code Expansion

Supports 60+ languages with proper locale codes:

| Input Code | Expanded |  
|------------|----------|
| `en` | `en-US` |
| `de` | `de` |
| `fr` | `fr` |
| `es` | `es` |
| `ja` | `ja` |
| etc. | See script for full list |

## Example

### Input
```
Query: "Atomic Habits"  
```

### Output (New Note)
```yaml
---
created: 2026-02-09  
tags:
  - books  
areas:
  - "[[log/books/Books|Books]]"  
year: 2018  
author:
  - "James Clear"  
genre:
  - "Self-Help"  
  - "Psychology"
topics:
status: not started  
rating:
language: en-US  
image: https://books.google.com/books/content?id=...  
isbn: 9780735211292  
people:
---  

> [!info]  Post-Read Review - Atomic Habits

```

## Limitations

- **Google Books data quality:** Some books may have incomplete metadata
- **Cover images:** Occasionally Google Books returns first page instead of cover (rare)
- **Topics:** Must be added manually (categories are too broad)
- **Multiple editions:** May need to select correct edition from suggester

## Future Enhancements

Potential improvements:
- [ ] Custom suggester modal with cover image previews  
- [ ] Batch update multiple books at once
- [ ] Extract topics from book description using keywords
- [ ] Download cover images to Attachments/ folder (optional)
- [ ] Alternative cover sources for problematic books

## Technical Details

**Dependencies:**
- QuickAdd plugin (required)
- Google Books API (key embedded in script)

**Cover Image Strategy:**
1. Fetch full volume details from Google Books API
2. Try `extraLarge` → `large` → `medium` → `small` → `thumbnail`
3. Fallback to Open Library if Google Books has no image
4. Remove edge curl effect and force HTTPS

**Genre Formatting:**
- Google Books returns paths like `"Business & Economics/Organizational Behaviour"`
- Script extracts main category: `"Business & Economics"`
- Removes duplicates and formats properly

**Fuzzy Title Matching:**
- Normalizes titles for comparison (lowercase, remove punctuation, trim spaces)
- Prevents duplicate notes when API returns slightly different formatting
- Example: "How to Win Friends..." matches "How To Win Friends..."

**Error Handling:**
- Handles network errors gracefully
- Shows user-friendly error messages
- Logs detailed errors to console for debugging

**Performance:**
- API calls typically take 1-2 seconds
- No rate limiting issues for normal use
- Results limited to 10 books for faster response

## Related Automation

Similar pattern to:
- [[projects/Coding/QuickAdd Place Note Automation|QuickAdd Place Note Automation]] - Creates/updates city and country notes with coordinates from OpenStreetMap  

Both scripts follow the same design pattern:
1. User input  
2. External API fetch
3. Smart create or update logic
4. Open result

---

[[projects/index]] [[projects/Coding/QuickAdd Place Note Automation]] [[log/books/index]] 

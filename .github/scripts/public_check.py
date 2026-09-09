#!/usr/bin/env python3
"""Layer 3 of sanitization: structural invariants, safe to run in public CI.

This file is COPIED INTO PUBLIC REPOSITORIES. It must never contain an
identity-bearing pattern. A denylist naming Franco's address, committed to a
public repo, is itself the leak — indexed, cached, permanent, and worse than
what it was written to prevent. The identity rules live in scan.py, in the
private publisher repo, and stay there.

Three checks, and they do not all apply to every file:

* **Absolute paths and key shapes** — EVERY file type. These are the checks
  that must reach `index.html` and `index.astro`, which is the whole reason
  this script is not markdown-only. A gate filtered to `*.md` on a repo whose
  content is `index.html` passes green having read nothing.
* **Frontmatter allowlist** — markdown under a `content/` tree, i.e. an
  actual published note. Not every `---` fence is note frontmatter: an
  `.astro` file opens with one too and its script block read as every
  `const foo =` being an unknown key, while Quartz's own `docs/` and the
  repo's `.github/ISSUE_TEMPLATE/` carry schemas that are not vault metadata
  and are not published by the site.
* **Wikilinks** — only where they can actually be RESOLVED, i.e. the same
  `content/` tree, indexed. `[[...]]` is Quartz's native syntax and the
  garden's normal working form, so a check that flags every one of them
  flags nothing: it reports hundreds of problems and locates none. With no
  index, this reports nothing rather than everything.

Every run ends with a line saying how many files it read and how many of them
were treated as notes. "Checked 3 files, 0 as notes" is a fact worth seeing;
a green check that inspected nothing is the failure this file was rewritten to
stop.

Exit codes: 0 clean, 1 problems, 2 could not run.

Paths are positional and therefore whitespace-split by the shell. Most of the
garden's notes have spaces in their names, so a caller doing
`public_check.py -- $(git diff --name-only)` word-splits them and exits 2 on a
phantom path. Use NUL-delimited intake instead:

    git diff --name-only -z ... | public_check.py --allowlist ... -0
"""
import argparse
import json
import pathlib
import re
import sys
from typing import Dict, List, Optional, Set

KEY_SHAPES = [
    r"gh[pousr]_[A-Za-z0-9]{36,}",
    r"sk-[A-Za-z0-9]{20,}",
    r"AKIA[0-9A-Z]{16}",
    r"-----BEGIN [A-Z ]*PRIVATE KEY-----",
]

MARKDOWN_SUFFIXES = (".md", ".markdown")

# Non-greedy over a class that excludes both brackets, so `[[a]] and [[b]]`
# yields two links rather than one spanning both.
WIKILINK = re.compile(r"\[\[([^\[\]]+)\]\]")

CONTENT_DIR_NAME = "content"


def _frontmatter_block(text):
    # type: (str) -> Optional[str]
    if not text.startswith("---"):
        return None
    end = text.find("\n---", 3)
    if end == -1:
        return None
    return text[3:end]


def _frontmatter_keys(text):
    # type: (str) -> List[str]
    block = _frontmatter_block(text)
    if block is None:
        return []
    keys = []
    for line in block.splitlines():
        m = re.match(r"^([A-Za-z][\w -]*):", line)
        if m:
            keys.append(m.group(1))
    return keys


def _titles_and_aliases(text):
    # type: (str) -> List[str]
    """Names a note can be reached by other than its filename.

    Deliberately a cheap line reader, not a YAML parser: this script runs in
    public CI with nothing installed but the standard library, and a wrong
    guess here costs a false "unresolved", never a missed leak.
    """
    block = _frontmatter_block(text)
    if block is None:
        return []
    names = []
    in_aliases = False
    for line in block.splitlines():
        m = re.match(r"^title:\s*(.+?)\s*$", line)
        if m:
            names.append(m.group(1).strip("\"'"))
            in_aliases = False
            continue
        m = re.match(r"^aliases:\s*(.*)$", line)
        if m:
            rest = m.group(1).strip()
            in_aliases = not rest
            if rest.startswith("[") and rest.endswith("]"):
                names.extend(a.strip().strip("\"'") for a in rest[1:-1].split(","))
            continue
        if in_aliases:
            m = re.match(r"^\s*-\s*(.+?)\s*$", line)
            if m:
                names.append(m.group(1).strip("\"'"))
            elif line.strip():
                in_aliases = False
    return [n for n in names if n]


def content_root_for(path):
    # type: (pathlib.Path) -> Optional[pathlib.Path]
    """The nearest ancestor directory named `content`, or None.

    None is the honest answer for `index.html`, `index.astro` and anything in
    `docs/`: there is no note tree to resolve against, so wikilinks in those
    files are not checked at all.
    """
    for parent in path.resolve().parents:
        if parent.name == CONTENT_DIR_NAME and parent.is_dir():
            return parent
    return None


def _suffix_keys(rel_posix):
    # type: (str) -> List[str]
    """Every trailing run of path segments, because Quartz resolves wikilinks
    with `markdownLinkResolution: shortest` — `[[exercise/index]]`
    legitimately reaches `content/log/exercise/index.md`, and `[[Weak Ties]]`
    reaches `content/notes/Weak Ties.md`."""
    parts = rel_posix.split("/")
    return ["/".join(parts[i:]) for i in range(len(parts))]


def build_link_index(root):
    # type: (pathlib.Path) -> Set[str]
    index = set()
    for f in sorted(root.rglob("*")):
        if not f.is_file():
            continue
        rel = f.relative_to(root).as_posix()
        variants = [rel]
        if f.suffix:
            variants.append(rel[: -len(f.suffix)])
        for variant in variants:
            for key in _suffix_keys(variant):
                index.add(key.lower())
        if f.suffix.lower() in MARKDOWN_SUFFIXES:
            try:
                text = f.read_text()
            except (OSError, UnicodeDecodeError):
                continue
            for name in _titles_and_aliases(text):
                index.add(name.lower())
    return index


def resolve_wikilink_target(raw):
    # type: (str) -> str
    """Strip the display alias, the heading anchor and the block ref.

    `[[Note|Alias]]`, `[[Note#Heading]]`, `[[Note#Heading|Alias]]` and
    `[[Note^block]]` all point at `Note`. `[[#Heading]]` points at the current
    page and reduces to the empty string, which callers treat as resolved.
    """
    target = raw.split("|", 1)[0]
    target = target.split("#", 1)[0]
    target = target.split("^", 1)[0]
    target = target.strip()
    if target.startswith("./"):
        target = target[2:]
    return target.strip("/").strip()


def check_text(text, allow, check_frontmatter=True, link_index=None):
    # type: (str, List[str], bool, Optional[Set[str]]) -> List[str]
    problems = []
    if check_frontmatter:
        for key in _frontmatter_keys(text):
            if key not in allow:
                problems.append("frontmatter key %r is not on the allowlist" % key)
    for line_no, line in enumerate(text.splitlines(), start=1):
        if "/Users/" in line:
            problems.append("line %d contains an absolute /Users/ path" % line_no)
        for shape in KEY_SHAPES:
            if re.search(shape, line):
                problems.append("line %d contains a key-shaped string" % line_no)
        if link_index is None:
            continue
        for m in WIKILINK.finditer(line):
            target = resolve_wikilink_target(m.group(1))
            if not target:
                continue  # a same-page anchor, e.g. [[#Heading]]
            if target.lower() not in link_index:
                problems.append("line %d has an unresolved wikilink: %r"
                                % (line_no, m.group(1)))
    return problems


def main(argv=None):
    # type: (Optional[List[str]]) -> int
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--allowlist", required=True)
    parser.add_argument("-0", "--stdin0", action="store_true",
                        help="read NUL-separated paths from stdin (use with "
                             "`git diff --name-only -z` or `xargs -0`), so "
                             "filenames containing spaces are not word-split")
    parser.add_argument("paths", nargs="*")
    args = parser.parse_args(argv)

    try:
        allow = json.loads(pathlib.Path(args.allowlist).read_text())["allow"]
    except (OSError, ValueError, KeyError) as exc:
        print("public_check: cannot read allowlist: %s" % exc, file=sys.stderr)
        return 2

    paths = list(args.paths)
    if args.stdin0:
        raw = sys.stdin.buffer.read()
        paths.extend(chunk.decode() for chunk in raw.split(b"\0") if chunk)

    if not paths:
        print("public_check: no paths given; refusing to report clean", file=sys.stderr)
        return 2

    indexes = {}  # type: Dict[pathlib.Path, Set[str]]
    total = 0
    notes = 0
    for p in paths:
        path = pathlib.Path(p)
        try:
            text = path.read_text()
        except (OSError, UnicodeDecodeError) as exc:
            print("public_check: cannot read %s: %s" % (p, exc), file=sys.stderr)
            return 2
        root = content_root_for(path)
        link_index = None
        if root is not None:
            if root not in indexes:
                indexes[root] = build_link_index(root)
            link_index = indexes[root]
        is_note = root is not None and path.suffix.lower() in MARKDOWN_SUFFIXES
        if is_note:
            notes += 1
        problems = check_text(
            text, allow,
            check_frontmatter=is_note,
            link_index=link_index,
        )
        for problem in problems:
            print("%s: %s" % (p, problem))
        total += len(problems)

    # Always, on stdout, pass or fail: what a run inspected is as much a
    # result as what it found.
    print("public_check: read %d file(s), %d of them as published notes "
          "(frontmatter allowlist + wikilink resolution); "
          "absolute-path and key-shape checks ran on all %d."
          % (len(paths), notes, len(paths)))

    if total:
        print("\npublic_check: %d problem(s)." % total, file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())

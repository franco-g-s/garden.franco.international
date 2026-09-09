#!/usr/bin/env python3
"""Layer 3 of sanitization: structural invariants, safe to run in public CI.

This file is COPIED INTO PUBLIC REPOSITORIES. It must never contain an
identity-bearing pattern. A denylist naming Franco's address, committed to a
public repo, is itself the leak — indexed, cached, permanent, and worse than
what it was written to prevent. The identity rules live in scan.py, in the
private publisher repo, and stay there.

Exit codes: 0 clean, 1 problems, 2 could not run.
"""
import argparse
import json
import pathlib
import re
import sys
from typing import List, Optional

KEY_SHAPES = [
    r"gh[pousr]_[A-Za-z0-9]{36,}",
    r"sk-[A-Za-z0-9]{20,}",
    r"AKIA[0-9A-Z]{16}",
    r"-----BEGIN [A-Z ]*PRIVATE KEY-----",
]


def _frontmatter_keys(text):
    # type: (str) -> List[str]
    if not text.startswith("---"):
        return []
    end = text.find("\n---", 3)
    if end == -1:
        return []
    keys = []
    for line in text[3:end].splitlines():
        m = re.match(r"^([A-Za-z][\w -]*):", line)
        if m:
            keys.append(m.group(1))
    return keys


def check_text(text, allow):
    # type: (str, List[str]) -> List[str]
    problems = []
    for key in _frontmatter_keys(text):
        if key not in allow:
            problems.append("frontmatter key %r is not on the allowlist" % key)
    for line_no, line in enumerate(text.splitlines(), start=1):
        if "/Users/" in line:
            problems.append("line %d contains an absolute /Users/ path" % line_no)
        for shape in KEY_SHAPES:
            if re.search(shape, line):
                problems.append("line %d contains a key-shaped string" % line_no)
        for m in re.finditer(r"\[\[([^\]]+)\]\]", line):
            problems.append("line %d has an unresolved wikilink: %r"
                            % (line_no, m.group(1)))
    return problems


def main(argv=None):
    # type: (Optional[List[str]]) -> int
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--allowlist", required=True)
    parser.add_argument("paths", nargs="*")
    args = parser.parse_args(argv)

    try:
        allow = json.loads(pathlib.Path(args.allowlist).read_text())["allow"]
    except (OSError, ValueError, KeyError) as exc:
        print("public_check: cannot read allowlist: %s" % exc, file=sys.stderr)
        return 2
    if not args.paths:
        print("public_check: no paths given; refusing to report clean", file=sys.stderr)
        return 2

    total = 0
    for p in args.paths:
        try:
            problems = check_text(pathlib.Path(p).read_text(), allow)
        except OSError as exc:
            print("public_check: cannot read %s: %s" % (p, exc), file=sys.stderr)
            return 2
        for problem in problems:
            print("%s: %s" % (p, problem))
        total += len(problems)

    if total:
        print("\npublic_check: %d problem(s)." % total, file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())

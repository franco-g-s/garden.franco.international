#!/usr/bin/env python3
"""Layer 4 of sanitization: images, and the one thing they leak by default.

This file is COPIED INTO PUBLIC REPOSITORIES, on the same terms as
`public_check.py`: it must never contain an identity-bearing pattern. It does
not need one. It asserts an **absence** — that no image carries a GPS IFD —
and the absence of a structure is not a fact about Franco. That is why this
check, unlike the identity rules in `scan.py`, is safe to run in public CI.

It exists because the text scanners are blind here. `scan.py` and
`public_check.py` both `read_text()`, so every rule they hold is a rule about
lines of Markdown. A JPEG straight off a phone carries latitude and longitude
in its EXIF whether or not any note ever mentions where it was taken, and 17
of the 26 photos on the public hub did exactly that for four months before
anyone looked. `location` was already a blocking policy category; it simply
had no enforcement path into the one medium that carries locations by
default.

What it looks for, in order of how it fails:

* **A GPS IFD** — tag 0x8825 in IFD0, IFD1 or the Exif sub-IFD of any EXIF
  block in the file. Presence is the finding; the coordinates are never read,
  never printed and never logged. Presence is all anyone needs to know and
  reading further only moves the leak somewhere new.
* **An XMP geotag** — `GPSLatitude` / `GPSLongitude` as literal bytes. XMP is
  a second, independent place the same fix can live, and a file can carry it
  with no EXIF at all.
* **A container it cannot parse** — HEIC, a truncated segment, a malformed
  IFD. This is a FINDING, not a pass. "I could not look" and "there is
  nothing there" are different answers and only one of them is safe to ship.

Every run ends with a line saying how many files it read and how many EXIF
blocks it actually parsed. A green check that inspected nothing is the failure
mode this whole layer was built against.

Exit codes: 0 clean, 1 findings, 2 could not run.

Paths are positional and therefore whitespace-split by the shell, so prefer
NUL-delimited intake:

    git diff --name-only -z ... | image_check.py -0
"""
import argparse
import collections
import pathlib
import struct
import sys
from typing import List, Optional, Tuple

GPS_IFD_POINTER = 0x8825
EXIF_IFD_POINTER = 0x8769
INTEROP_IFD_POINTER = 0xA005

IMAGE_SUFFIXES = (".jpg", ".jpeg", ".png", ".tif", ".tiff", ".heic", ".webp")

# Literal bytes, not a regex: XMP is XML and writes these names out in full.
XMP_GPS_TOKENS = (b"GPSLatitude", b"GPSLongitude")

# TIFF type -> bytes per component. Unknown types are treated as unsized,
# which makes the value "out of line" and therefore conservatively preserved.
TYPE_SIZES = {1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 6: 1, 7: 1, 8: 2, 9: 4, 10: 8,
              11: 4, 12: 8, 13: 4, 16: 8, 17: 8, 18: 8}

# start/end bound the TIFF block inside the file; chunk_start is where the
# enclosing container's chunk begins, which a rewriter needs and a reader
# ignores.
Blob = collections.namedtuple("Blob", "start end container chunk_start")

# One IFD entry, located: value_field is the offset *of the 4-byte value
# field*, so a rewriter can find both the entry and its payload.
Entry = collections.namedtuple("Entry", "tag typ count value_field entry_start")


class ExifError(Exception):
    """The file could not be parsed far enough to answer the question."""


def _byte_order(tiff):
    # type: (bytes) -> str
    if len(tiff) < 8:
        raise ExifError("EXIF block is shorter than a TIFF header")
    if tiff[:2] == b"MM":
        order = ">"
    elif tiff[:2] == b"II":
        order = "<"
    else:
        raise ExifError("EXIF block has no TIFF byte-order mark")
    if struct.unpack(order + "H", tiff[2:4])[0] != 42:
        raise ExifError("EXIF block is missing the TIFF magic number")
    return order


def read_ifd(tiff, offset, order):
    # type: (bytes, int, str) -> Tuple[List[Entry], int]
    """Return the entries of one IFD and the offset of the next one."""
    if offset <= 0 or offset + 2 > len(tiff):
        raise ExifError("IFD offset points outside the EXIF block")
    count = struct.unpack(order + "H", tiff[offset:offset + 2])[0]
    end = offset + 2 + 12 * count + 4
    if end > len(tiff):
        raise ExifError("IFD runs past the end of the EXIF block")
    entries = []
    for i in range(count):
        at = offset + 2 + 12 * i
        tag, typ, n = struct.unpack(order + "HHI", tiff[at:at + 8])
        entries.append(Entry(tag, typ, n, at + 8, at))
    next_ifd = struct.unpack(order + "I", tiff[end - 4:end])[0]
    return entries, next_ifd


def entry_value_range(tiff, entry, order):
    # type: (bytes, Entry, str) -> Optional[Tuple[int, int]]
    """Where an entry's payload lives, when it does not fit in the 4-byte
    value field. `None` means the value is inline and occupies no other
    bytes."""
    size = TYPE_SIZES.get(entry.typ)
    if size is None:
        raise ExifError("IFD entry has an unknown TIFF type")
    total = size * entry.count
    if total <= 4:
        return None
    start = struct.unpack(order + "I", tiff[entry.value_field:entry.value_field + 4])[0]
    if start + total > len(tiff):
        raise ExifError("IFD entry payload points outside the EXIF block")
    return (start, total)


def _entry_long(tiff, entry, order):
    # type: (bytes, Entry, str) -> int
    return struct.unpack(order + "I", tiff[entry.value_field:entry.value_field + 4])[0]


def walk_ifds(tiff):
    # type: (bytes) -> List[Tuple[int, List[Entry]]]
    """Every IFD reachable from the TIFF header: the IFD0/IFD1 chain, plus the
    Exif and Interoperability sub-IFDs hanging off them.

    Bounded by a visited set, because a malformed file can point an IFD at
    itself and a sanitizer that hangs is a sanitizer nobody keeps in CI.
    """
    order = _byte_order(tiff)
    found = []
    seen = set()
    queue = [struct.unpack(order + "I", tiff[4:8])[0]]
    while queue:
        offset = queue.pop(0)
        if offset in seen or offset == 0:
            continue
        seen.add(offset)
        entries, next_ifd = read_ifd(tiff, offset, order)
        found.append((offset, entries))
        if next_ifd:
            queue.append(next_ifd)
        for entry in entries:
            if entry.tag in (EXIF_IFD_POINTER, INTEROP_IFD_POINTER):
                queue.append(_entry_long(tiff, entry, order))
    return found


def gps_pointers(tiff):
    # type: (bytes) -> List[Tuple[int, Entry, int]]
    """(containing IFD offset, the entry, the GPS IFD offset) for every
    0x8825 in the block. Normally one, in IFD0; the loop is what makes
    "normally" checkable rather than assumed."""
    order = _byte_order(tiff)
    out = []
    for ifd_offset, entries in walk_ifds(tiff):
        for entry in entries:
            if entry.tag == GPS_IFD_POINTER:
                out.append((ifd_offset, entry, _entry_long(tiff, entry, order)))
    return out


def _jpeg_blobs(data):
    # type: (bytes) -> List[Blob]
    blobs = []
    i = 2
    while i < len(data) - 1:
        if data[i] != 0xFF:
            raise ExifError("JPEG segment does not begin with 0xFF")
        marker = data[i + 1]
        if marker == 0xFF:          # fill byte
            i += 1
            continue
        if marker == 0xD9:          # EOI
            break
        if marker in (0x01, 0xD8) or 0xD0 <= marker <= 0xD7:
            i += 2
            continue
        if i + 4 > len(data):
            raise ExifError("JPEG segment header is truncated")
        length = struct.unpack(">H", data[i + 2:i + 4])[0]
        if length < 2 or i + 2 + length > len(data):
            raise ExifError("JPEG segment length points past the end of the file")
        if marker == 0xE1 and data[i + 4:i + 10] == b"Exif\x00\x00":
            blobs.append(Blob(i + 10, i + 2 + length, "jpeg", i))
        if marker == 0xDA:          # SOS: entropy-coded data follows
            break
        i += 2 + length
    return blobs


def _png_blobs(data):
    # type: (bytes) -> List[Blob]
    blobs = []
    i = 8
    while i + 8 <= len(data):
        length = struct.unpack(">I", data[i:i + 4])[0]
        kind = data[i + 4:i + 8]
        if i + 12 + length > len(data):
            raise ExifError("PNG chunk length points past the end of the file")
        if kind == b"eXIf":
            blobs.append(Blob(i + 8, i + 8 + length, "png", i))
        if kind == b"IEND":
            break
        i += 12 + length
    return blobs


def _webp_blobs(data):
    # type: (bytes) -> List[Blob]
    blobs = []
    i = 12
    while i + 8 <= len(data):
        kind = data[i:i + 4]
        length = struct.unpack("<I", data[i + 4:i + 8])[0]
        start = i + 8
        if start + length > len(data):
            raise ExifError("WebP chunk length points past the end of the file")
        if kind == b"EXIF":
            # Some writers prefix the TIFF block with the JPEG-style header.
            offset = start + 6 if data[start:start + 6] == b"Exif\x00\x00" else start
            blobs.append(Blob(offset, start + length, "webp", i))
        i = start + length + (length & 1)   # RIFF chunks are even-padded
    return blobs


def exif_blobs(data):
    # type: (bytes) -> Tuple[str, List[Blob]]
    """(container kind, every EXIF block in the file).

    Raises ExifError for anything it cannot take apart — which callers treat
    as a finding, never as a pass.
    """
    if data[:2] == b"\xff\xd8":
        return "jpeg", _jpeg_blobs(data)
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return "png", _png_blobs(data)
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "webp", _webp_blobs(data)
    if data[:4] in (b"II*\x00", b"MM\x00*"):
        return "tiff", [Blob(0, len(data), "tiff", 0)]
    if len(data) >= 12 and data[4:8] == b"ftyp":
        raise ExifError("HEIF/HEIC container: the standard library cannot "
                        "parse it, so its GPS status is unknown — convert or "
                        "strip it before publishing")
    raise ExifError("unrecognised image container")


def check_bytes(data):
    # type: (bytes) -> Tuple[List[str], int]
    """(findings, number of EXIF blocks parsed) for one file's bytes."""
    findings = []
    parsed = 0
    try:
        _, blobs = exif_blobs(data)
    except ExifError as exc:
        findings.append("cannot verify GPS status: %s" % exc)
        blobs = []
    for blob in blobs:
        tiff = data[blob.start:blob.end]
        try:
            pointers = gps_pointers(tiff)
        except ExifError as exc:
            findings.append("cannot verify GPS status: %s" % exc)
            continue
        parsed += 1
        if pointers:
            findings.append("carries a GPS IFD (EXIF tag 0x8825) — strip it "
                            "with sanitize/strip_gps.py before publishing")
    for token in XMP_GPS_TOKENS:
        if token in data:
            findings.append("carries an XMP geotag (%s)" % token.decode())
            break
    return findings, parsed


def main(argv=None):
    # type: (Optional[List[str]]) -> int
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("-0", "--stdin0", action="store_true",
                        help="read NUL-separated paths from stdin (use with "
                             "`git diff --name-only -z` or `xargs -0`), so "
                             "filenames containing spaces are not word-split")
    parser.add_argument("paths", nargs="*")
    args = parser.parse_args(argv)

    paths = list(args.paths)
    if args.stdin0:
        raw = sys.stdin.buffer.read()
        paths.extend(chunk.decode() for chunk in raw.split(b"\0") if chunk)

    if not paths:
        print("image_check: no paths given; refusing to report clean",
              file=sys.stderr)
        return 2

    total = 0
    blocks = 0
    for p in paths:
        try:
            data = pathlib.Path(p).read_bytes()
        except OSError as exc:
            print("image_check: cannot read %s: %s" % (p, exc), file=sys.stderr)
            return 2
        findings, parsed = check_bytes(data)
        blocks += parsed
        for finding in findings:
            print("%s: %s" % (p, finding))
        total += len(findings)

    # Always, pass or fail: what a run inspected is as much a result as what
    # it found. "read 4 files, parsed 0 EXIF blocks" is a fact worth seeing.
    print("image_check: read %d file(s), parsed %d EXIF block(s); "
          "checked every one for a GPS IFD." % (len(paths), blocks))

    if total:
        print("\nimage_check: %d problem(s)." % total, file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""Scripted edit that FAILS when it does not match exactly the expected number of times.

    python3 replace_once.py FILE OLD NEW [--count N]
    python3 replace_once.py FILE --pairs edits.json      # [[old, new], ...] all-or-nothing

Why: a find-and-replace that matches nothing still "succeeds". In Cradle a feature
silently did not exist for a full cycle because earlier edits had drifted the target
text. Farmyard's bundler asserts its manifest and icon links were rewritten for the
same reason. Use this (or the Edit tool) for every programmatic edit; never a bare
sed or str.replace in a build script.

Also: in JavaScript, String.prototype.replace with a STRING replacement interprets
$' $` $& — Farmyard's bundler silently ate the rest of a file because the game
source contained `${'$' + ...}`. Pass a function as the replacement.
"""
import json
import sys


def apply(text, old, new, expected=1):
    n = text.count(old)
    if n != expected:
        raise SystemExit(f"expected {expected} match(es), found {n} for: {old[:80]!r}")
    return text.replace(old, new)


def main(argv):
    if len(argv) < 3:
        raise SystemExit(__doc__)
    path = argv[1]
    with open(path, encoding="utf-8") as f:
        text = f.read()
    if argv[2] == "--pairs":
        with open(argv[3], encoding="utf-8") as f:
            pairs = json.load(f)
        for old, new in pairs:
            text = apply(text, old, new)
    else:
        old, new = argv[2], argv[3]
        count = int(argv[argv.index("--count") + 1]) if "--count" in argv else 1
        text = apply(text, old, new, count)
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)
    print(f"edited {path}")


if __name__ == "__main__":
    main(sys.argv)

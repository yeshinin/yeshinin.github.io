#!/usr/bin/env python3
"""Turn a Goodreads library export into books.js for the Bookshelf section.

Usage: python3 tools/build_books.py path/to/goodreads_library_export.csv

Only the "read" shelf is kept, and written reviews and notes are left out.
"Last updated" comes from the export file's date. Keep the CSV out of this repo.
"""
import csv
import datetime
import json
import os
import re
import sys

path = sys.argv[1]
books = []
with open(path, encoding="utf-8-sig") as f:
    for row in csv.DictReader(f):
        if row["Exclusive Shelf"] != "read":
            continue
        read = row["Date Read"][:7].replace("/", "-")
        books.append({
            "i": row["Book Id"],
            "t": row["Title"].strip(),
            "a": re.sub(r"\s+", " ", row["Author"]).strip(),
            "r": float(row["My Rating"] or 0),
            "d": read,
            "p": int(row["Number of Pages"] or 0),
            "y": row["Original Publication Year"] or row["Year Published"],
            "s": [s.strip() for s in row["Bookshelves"].split(",") if s.strip()],
        })

# newest reads first, undated books last
books.sort(key=lambda b: b["d"] or "0", reverse=True)
updated = datetime.date.fromtimestamp(os.path.getmtime(path)).isoformat()
out = os.path.join(os.path.dirname(__file__), "..", "books.js")
with open(out, "w", encoding="utf-8") as f:
    payload = json.dumps({"updated": updated, "books": books}, ensure_ascii=False, separators=(",", ":"))
    f.write(f"window.LIBRARY = {payload};\n")
print(len(books), "books, updated", updated)

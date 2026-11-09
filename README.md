# Yeshi Dolma: personal site

Plain HTML, CSS and JavaScript with no build step.

To preview locally:

```bash
python3 -m http.server 4311
```

Then open http://localhost:4311.

## Updating the bookshelf

Export your library from Goodreads, then run the command below. "Last updated" comes from the export file's date. Don't commit the CSV.

```bash
python3 tools/build_books.py ~/Downloads/goodreads_library_export.csv
```

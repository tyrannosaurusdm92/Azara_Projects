Fantasy Map Scanner - File + Map Folder Matcher Update Main file: index.html New workflow added:
- Upload images, HTML, JSON, CSS, and JavaScript files.
- Optionally choose an entire directory to extract folder paths and scan supported files.
- Match each file against folder names/paths using an 80% default threshold.
- Images are scanned two ways: by file/path name and by visual terrain/color appearance.
- HTML, JSON, CSS, and JS are scanned by file/path name and text content references such as src, href, url(), maps, templates, and image names.
- Export a JSON manifest containing best folder, score, auto-sort status, signals, and alternate matches. Browser security note:
This offline HTML tool cannot directly move files on your hard drive. It produces an auto-sort manifest telling your DM site where each file should go. Your directory manager can use that manifest to sort files inside browser storage or during export/import.
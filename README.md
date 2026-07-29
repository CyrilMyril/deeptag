# DeepTag

Drop in a file, see everything it's carrying — name, date, author, and location, but also the
deeper stuff most tools never show you (GPS coordinates buried in a JPEG, revision history in a
Word doc, ID3 frames in an MP3). Edit what the format allows, and save back to the original file
or export a copy.

## Build & package the desktop app

```bash
npm run build:desktop      # builds the renderer + main + preload
npm run package:desktop    # runs electron-builder, produces installers in desktop-app/release/
```

- **Windows**: produces a single portable `DeepTag-portable.exe`.
- **macOS**: produces a `.dmg`.
- **Linux**: produces an `.AppImage`.

electron-builder can normally only produce installers for the OS you're building on (e.g. you
need macOS to build the `.dmg`), unless you set up cross-building with Docker/Wine or use CI
(GitHub Actions with a build matrix is the common approach — happy to set that up if useful).

## What's editable, and what isn't

Not every format can safely round-trip a write in a lightweight, dependency-light build. Each
parser in `shared/src/parsers/` reports its own `write.supported` + a human-readable reason, which
the UI shows automatically next to a disabled "Edit metadata" button. Current state:

| Format | Read | Write |
|---|---|---|
| JPEG | Full (EXIF/IPTC/XMP) | Yes — any standard EXIF/TIFF/GPS tag piexif can encode: Artist, Copyright, Description, Software, dates, GPS lat/lon/altitude, camera make/model/lens, ISO, aperture, exposure time, focal length, orientation, color space, and most of the "hidden & raw" tags too. Structural facts (pixel dimensions, file type) stay read-only since they're derived from the image data, not a tag. |
| PNG / WebP / TIFF / HEIC / GIF / BMP | Full | Not yet (read-only) |
| PDF | Full (Info dictionary) | Yes — Title, Author, Subject, Keywords, Producer, Creator, Created date, Modified date. Page count stays read-only (a structural fact, not a tag). |
| docx / xlsx / pptx | Full (core + app properties) | Yes — Title, Author, Subject, Description, Keywords, Last modified by, Created date, Modified date, Revision number, Application, Company, App version. |
| MP3 | Full (ID3 + broad tag support) | Yes — Title, Artist, Album artist, Composer, Album, Genre, Year, Track, Comment. Container/codec/bitrate/duration stay read-only (derived from the audio stream, not a tag). |
| FLAC / WAV / OGG / M4A / AAC / WMA | Full | Not yet (read-only) |
| MP4 / MOV | Container + track info | Not yet (read-only — safely rebuilding a video container is a bigger job, left as a roadmap item) |
| Anything else | Basic OS-level file info | Read-only (name/size/type/date are OS-level facts, not embedded in the file) |
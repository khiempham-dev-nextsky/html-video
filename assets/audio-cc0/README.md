# CC0 music library

Background-music beds used by the `cc0` music provider (`@html-video/core` →
`audio/cc0-music.ts`). A track is chosen by mood-word overlap with the user's
prompt, then ffmpeg loops/trims it to the video length.

## Provenance

Every track MUST be license-clean and recorded in `manifest.json` with its
`license` (SPDX) and `source_url` — same discipline as template provenance.

The shipped tracks are **minimal beds synthesized with ffmpeg** (sine + tremolo).
They are genuinely CC0 (self-generated) and make the provider work out of the
box, but they are placeholders. To improve quality, drop real CC0 tracks here and
add their entries to `manifest.json`:

- Pixabay Music (filter: CC0) — https://pixabay.com/music/
- Free Music Archive (filter: CC0) — https://freemusicarchive.org/

## Manifest shape

```json
{
  "tracks": [
    { "file": "name.mp3", "moods": ["calm","ambient"], "bpm": 70, "license": "CC0-1.0", "source_url": "https://…" }
  ]
}
```

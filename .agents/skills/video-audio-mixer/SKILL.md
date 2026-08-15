---
name: video-audio-mixer
description: Add, replace, loop, trim, synchronize, fade, and mix music, voice-over, or sound effects into video while controlling original audio and exporting a browser-compatible MP4. Use when the user asks to add audio or music to MP4, MOV, WebM, or another video, replace a soundtrack, lower background music under speech, fix audio duration, or deliver a web/social video with balanced sound.
---

# Video Audio Mixer

Create a non-destructive audio mix synchronized to the video and verify the rendered file.

## Workflow

1. Inspect video duration, frame rate, codec, and whether an original audio stream exists. Inspect the new audio duration and loudness when tools permit.
2. Confirm the intended role from context:
   - `mix`: retain original sound and place music/audio underneath it.
   - `replace`: remove original sound and use only the new audio.
   - Treat a silent video as `replace` even when `mix` was requested.
3. Use [scripts/add-audio.ps1](scripts/add-audio.ps1) for the standard one-video/one-audio case. It loops or trims the new audio to the video duration, adds fades, mixes safely, and exports web-ready MP4.
4. For voice-over plus music or multiple cues, build an explicit timeline, duck music under speech, and use a limiter on the final bus.
5. Preserve the source files. Never write output to either input path.

## Audio defaults

- For original speech plus background music, start with original audio at `1.0` and music at `0.18–0.25`.
- For ambient original sound plus music, start with original audio at `0.35–0.60` and music at `0.25–0.40`.
- Use short 0.3–1.0 second fades unless the edit calls for a longer musical intro or outro.
- Avoid clipping. Prefer a conservative final limiter and natural dynamics over maximizing loudness.
- If exact platform loudness is required, measure integrated loudness and true peak rather than guessing.

## Run the bundled script

```powershell
& ".agents/skills/video-audio-mixer/scripts/add-audio.ps1" `
  -VideoPath "input.mp4" `
  -AudioPath "music.mp3" `
  -OutputPath "output-with-music.mp4" `
  -Mode mix `
  -VideoVolume 1.0 `
  -AudioVolume 0.22
```

The script requires `ffmpeg` and `ffprobe` in PATH. If they are missing, report that dependency and ask before installing system software.

## Verification

- Confirm the output opens, has both video and audio streams, matches the intended duration, and does not end abruptly.
- Check speech intelligibility, music balance, sync, clipping, and silence at the beginning/end.
- Report the absolute output path and the chosen mix settings.

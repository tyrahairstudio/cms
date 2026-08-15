---
name: media-edit-effects
description: Edit photos and videos non-destructively, including trimming, cropping, resizing, reframing, retouching, background/object changes, color correction, tasteful visual effects, speed changes, fades, and web/social export. Use for image or video assets such as PNG, JPG, WebP, GIF, MP4, MOV, and WebM when the user asks to cut, beautify, enhance, stylize, clean up, or prepare media for the Tyra Hair Studio website or social channels.
---

# Media Edit Effects

Produce polished image and video variants while preserving the source and the subject's identity.

## Workflow

1. Locate the exact inputs and intended output. Inspect images visually. Inspect video metadata and sample frames before choosing effects.
2. Choose the least destructive method:
   - Use deterministic tools for crop, resize, trim, codec conversion, exact text, fades, speed, and color adjustments.
   - Use the built-in image editing tool for object/background changes, relighting, retouching, or other semantic raster edits. View a local image before editing it.
   - Do not use generative editing for exact typography, logos, or simple geometric changes.
3. Keep the original unchanged. Save to a descriptive sibling such as `name-edited-v2.jpg` or to a user-specified output path.
4. Apply a coherent look. Prefer one primary treatment plus at most two supporting effects. Preserve realistic skin texture, hair detail, hair color, and facial identity unless the user explicitly requests a transformation.
5. Export for the destination and verify the output visually and technically.

## Editing defaults

- Interpret “make it beautiful” as clean, premium salon/editorial polish: natural skin, controlled highlights, rich but believable hair color, gentle contrast, and uncluttered effects.
- Avoid heavy smoothing, halos, crushed blacks, oversaturation, artificial bokeh around hair edges, flashy transitions, and watermarks.
- Preserve aspect ratio unless a target format requires reframing. For vertical social video, prefer 1080x1920. For website media, prioritize fast loading and stable browser playback.
- For exact brand text, render text deterministically and verify every character.

## Output and quality checks

- Images: prefer WebP or optimized JPG for photographs; use PNG when transparency or lossless detail is required.
- Video: prefer MP4 with H.264 video, AAC audio, `yuv420p`, even dimensions, and fast-start metadata for web use.
- Verify dimensions, duration, orientation, file size, codec, audio presence, and that the first/last frames are intentional.
- Show or render the final asset when possible and report the absolute saved path.

## Style recipes

Read [references/effect-recipes.md](references/effect-recipes.md) only when the user gives a vague aesthetic request or asks for effect/style options.

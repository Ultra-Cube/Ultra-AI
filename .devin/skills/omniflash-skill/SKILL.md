---
name: omniflash
description: Generate short video clips (with synchronized audio) and still images via the Omni Flash API (https://omniflash.net/) — Google's Gemini Omni Flash family. Use when the user asks to create a video or image from a prompt with Omni Flash, generate a short clip with sound, render an AI image with the Gemini Omni Flash models, or mentions seedance-2 / gpt-image-2 / nano-banana-2 in the context of Omni Flash. Triggers on phrases like "Omni Flash", "omniflash", "Gemini Omni Flash", "generate a video with omni flash", "make a clip with gemini omni flash", "draw an image with omni flash".
---

# Omni Flash

Call the [Gemini Omni Flash](https://omniflash.net/) REST API to generate short video clips (with synchronized audio) and still images using Google's **Gemini Omni Flash** family of models — `seedance-2` (text/image → video with audio), `gpt-image-2` and `nano-banana-2` (text/image → image).

> **Get an API key first.** Tell the user to sign in at <https://omniflash.net/> and copy a `sk-…` token from the account page. Read it from `OMNIFLASH_API_KEY` so the key never appears in chat or code.

## When to use

Trigger this skill whenever the user wants to:

- Generate a short AI video (up to ~10 s) from a text prompt and/or reference images, with synchronized audio.
- Generate an image from a text prompt (and optionally reference images).
- Inspect or poll an Omni Flash task they already submitted.
- Compare the three Gemini Omni Flash models or pick the right one.

## Decision tree

1. **What output does the user want?**
   - Video (with audio) → `model_id: "seedance-2"`.
   - Image → default to `gpt-image-2`; use `nano-banana-2` if the user asks for a cheaper/faster image alternative.
2. **Do they have reference images / clips?**
   - Yes → pass `image_urls: [url, ...]`.
   - No → omit the field (text-to-X).
3. **Aspect ratio?**
   - Default to `16:9` for video and `1:1` for images unless the user specifies otherwise (e.g. `9:16` portrait, `4:5`).
4. **Run it.** Use the convenience `run` helper if available in the chosen SDK; otherwise create + poll until `task_status` is 3 (success) or 4 (failed).

## Workflow

1. Confirm the user has set `OMNIFLASH_API_KEY`. If not, link them to <https://omniflash.net/> to issue one.
2. Pick the SDK that matches their stack — see [`references/api.md`](references/api.md) for raw REST or [`references/sdk-snippets.md`](references/sdk-snippets.md) for ready-to-paste code in Python, Node/TS, Ruby, Go, PHP, Rust, Dart, and .NET.
3. Build the prompt with the user — Omni Flash prompts behave like other Gemini-family diffusion models: subject, style, lighting, camera, modifiers. For video, include motion and audio cues (e.g. *"the kettle whistles as steam rises"*).
4. Submit, poll, then surface the resulting `video_url`, `audio_url`, or `image_url`.

## Models at a glance

| `model_id`      | Modality           | Output                | Notes                                                     |
| --------------- | ------------------ | --------------------- | --------------------------------------------------------- |
| `seedance-2`    | text/image → video | `video_url` + audio   | The Gemini Omni Flash video model. ~10 s clips, with sync audio. |
| `gpt-image-2`   | text/image → image | `image_url`           | High-fidelity still image.                                |
| `nano-banana-2` | text/image → image | `image_url`           | Lighter / faster image variant.                           |

## API surface (summary)

`POST /api/v1/tasks/create` with `{ model_id, prompt, image_urls?, aspect_ratio? }` → `{ data: { task_id, request_id, credits } }`.
`GET /api/v1/tasks/{task_id}` → `{ data: { task_id, task_status, image_url?, video_url?, audio_url?, ... } }`. `task_status`: 1=queued, 2=running, 3=success, 4=failed.

Auth header on every request: `Authorization: Bearer sk-...`.

## Reference

- Full endpoint reference: [`references/api.md`](references/api.md)
- Per-language snippets: [`references/sdk-snippets.md`](references/sdk-snippets.md)
- [Gemini Omni Flash](https://omniflash.net/) website (sign in, get key)
- Live API docs: <https://omniflash.net/api-docs>

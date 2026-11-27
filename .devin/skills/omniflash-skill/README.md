# Omni Flash — Claude Code Skill

A Claude Code skill that lets Claude generate short video clips (with synchronized audio) and still images via the [Gemini Omni Flash](https://omniflash.net/) REST API — Google's Gemini Omni Flash family of models: `seedance-2` (text/image → video with audio), `gpt-image-2` and `nano-banana-2` (text/image → image).

> Sign in at [Gemini Omni Flash](https://omniflash.net/) and create an `sk-…` API key on the account page. Export it as `OMNIFLASH_API_KEY` and Claude will pick it up automatically.

## What this skill does

When triggered, Claude will:

1. Pick the right Gemini Omni Flash model (`seedance-2` for video + audio, `gpt-image-2` for high-fidelity images, `nano-banana-2` for cheaper/faster image generation).
2. Help you sharpen the prompt — for video, add motion + audio cues (e.g. *"the kettle whistles as steam rises"*).
3. Submit the job through any of the official Omni Flash SDKs (Python / Node / Ruby / Go / PHP / Rust / Dart / .NET) and poll until done.
4. Return the final `video_url`, `audio_url`, or `image_url`.

The full workflow and model matrix lives in [SKILL.md](./SKILL.md) and [references/](./references/).

## Install into Claude Code

Clone the repo into your Claude Code skills directory:

```bash
# User-level (applies to every project)
git clone https://github.com/beamtrace/omniflash-skill.git ~/.claude/skills/omniflash

# Or project-level (only the current project)
git clone https://github.com/beamtrace/omniflash-skill.git .claude/skills/omniflash
```

Restart Claude Code and ask something like *"generate a 5-second clip of a kettle whistling with Omni Flash"* — the skill should fire automatically.

## How to trigger it

The skill's `description` field already matches the most common phrasings. Any of these will trigger it:

- "generate a video with omniflash"
- "make a clip with gemini omni flash"
- "draw an image using omni flash"
- "how do I call Gemini Omni Flash"
- mentioning any of `seedance-2`, `gpt-image-2`, `nano-banana-2` in the Omni Flash context

## Companion multi-language SDKs

| Language  | Package                       | Registry                                                                              |
| --------- | ----------------------------- | ------------------------------------------------------------------------------------- |
| Python    | `omniflash-sdk`               | PyPI                                                                                  |
| Node / TS | `omniflash-sdk`               | npm                                                                                   |
| Ruby      | `omniflash-sdk`               | RubyGems                                                                              |
| Go        | `omniflash-sdk-go`            | [github.com/beamtrace/omniflash-sdk-go](https://github.com/beamtrace/omniflash-sdk-go) |
| PHP       | `omniflash/omniflash-sdk`     | Packagist                                                                             |
| Rust      | `omniflash-sdk`               | crates.io                                                                             |
| Dart      | `omniflash_sdk`               | pub.dev                                                                               |
| .NET      | `OmniFlash.Sdk`               | NuGet                                                                                 |

Each SDK is a ~150-line thin wrapper that exposes the same three methods: `create_task` / `get_task` / `run`.

## Links

- Website (sign up + get key): [Gemini Omni Flash](https://omniflash.net/)
- Live API reference: <https://omniflash.net/api-docs>

## License

MIT

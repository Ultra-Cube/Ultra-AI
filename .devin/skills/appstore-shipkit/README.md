# App Store Ship Kit (Skill)

Take a finished iOS app to a complete App Store submission in one focused session —
app icon, marketing screenshots, and store metadata — with no designer.

A paid, licensed skill by **Eightinity Technologies**. This repository is private.

---

## What it does
An installable agent skill that interviews you and walks you through, step by step:
1. **App icon** — a tailored prompt, or AI-generated with your own image key.
2. **Marketing screenshots** — four methods you choose from: Full AI (image-edit),
   AI-composited hybrid, fully-programmatic (Pillow), or prompts-only. Varied headline
   angles and a privacy/trust screen built from a bundled template.
3. **Metadata** — title, subtitle, keywords, description filled into a copy-paste page
   with live character counts.
4. **Pre-submission checklist** — privacy-label honesty, keyword rules, screenshot specs.

## Install (manual — this is a private, paid skill)
This skill is distributed to licensed buyers, not via a public registry. Install it into
your agent's skills directory:

**Claude Code**
```bash
# from the folder containing this repo's files:
mkdir -p ~/.claude/skills
cp -R . ~/.claude/skills/appstore-shipkit
```
(or copy into a project's `.claude/skills/appstore-shipkit/`)

**Cursor / Cline / Windsurf / others** — place the `appstore-shipkit/` folder wherever
your agent discovers skills (see its docs), keeping the folder structure intact.

**Any chat agent (universal fallback)** — paste the contents of `SKILL.md` into the chat
and say "follow these instructions," keeping the scripts and SVG accessible.

Then start a session in a working folder and say: **"help me publish my app."**

## Requirements
- Apple Developer account + Xcode (to build/upload your app).
- Python 3 with Pillow (`pip install pillow`) for resizing/compositing.
- Optional: your OWN image API key in a local `.env` (`OPENAI_API_KEY=...`) for AI image
  generation. Used only on your machine, never stored or sent anywhere but the provider.
  Tuned and tested on OpenAI's image model; other providers may differ.

## Files
- `SKILL.md` — the skill (interview engine + all art-direction rules).
- `scripts/resize.py` — resize screenshots to 1284×2778 (App Store spec).
- `scripts/gen_image.py` — text-to-image (icons / empty backgrounds).
- `scripts/gen_image_edit.py` — image-edit (frames your real screenshot, never redraws it).
- `privacy-screen-template.svg` — the trust/privacy screen, no app screenshot needed.

## License
Paid, per-buyer license. Do not redistribute, resell, or share. See LICENSE if included
in your purchased package.

— Eightinity Technologies · eightinity.in

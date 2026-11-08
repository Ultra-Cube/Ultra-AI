# atsurae

> AIが、あつらえる — AI-crafted video editing

MCP Server for AI-powered video editing. Let Claude, GPT, or any AI agent edit videos through natural language.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![MCP Compatible](https://img.shields.io/badge/MCP-compatible-green.svg)](https://modelcontextprotocol.io)

---

## Quick Start

```bash
# Install with pip
pip install atsurae

# Or with uv
uv pip install atsurae
```

### Claude Desktop Configuration

Add to your Claude Desktop config (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "atsurae": {
      "command": "python",
      "args": ["-m", "atsurae"],
      "env": {
        "ATSURAE_API_URL": "https://api.atsurae.ai",
        "ATSURAE_API_KEY": "your-api-key"
      }
    }
  }
}
```

Then restart Claude Desktop. You can now edit videos through conversation.

---

## Features — 10 MCP Tools

| Tool | Description |
|------|-------------|
| `atsurae_inspect` | View project state at 3 detail levels: **L1** summary, **L2** structure, **L3** full timeline |
| `atsurae_edit` | Add, move, trim, transform, and delete clips on the timeline |
| `atsurae_audio` | Manage audio tracks — volume, ducking, BGM, narration |
| `atsurae_semantic` | High-level operations: `close_all_gaps`, `snap_to_previous`, `reorder_clips` |
| `atsurae_batch` | Execute up to 20 operations atomically in a single call |
| `atsurae_preview` | Get visual preview frames, event points, and before/after diffs |
| `atsurae_analyze` | Quality analysis — detect gaps, pacing issues, composition problems |
| `atsurae_render` | Start, monitor, and download video renders |
| `atsurae_history` | View operation history and rollback changes |
| `atsurae_pipeline` | End-to-end AI video creation pipeline |

---

## Example

```
You: Create a 30-second intro video with the uploaded avatar and background music

Claude: I'll create the intro video. Let me inspect the available assets first...

  [atsurae_inspect] → Found: avatar.mp4, bgm.mp3, logo.png
  [atsurae_edit]    → Placed avatar on Layer 3, logo on Layer 5
  [atsurae_audio]   → Added BGM with -6dB ducking under narration
  [atsurae_semantic] → Closed all gaps, snapped clips
  [atsurae_analyze] → Quality check passed (no gaps, good pacing)
  [atsurae_render]  → Rendering at 1080p...

Claude: Your intro video is ready!
        Duration: 30s | Resolution: 1920x1080 | Size: 12.4 MB
        Download: https://api.atsurae.ai/renders/abc123/output.mp4
```

---

## Architecture

```
                    MCP Protocol                 REST API
[You / AI Agent] ──────────────→ [atsurae MCP] ──────────→ [atsurae.ai API]
                                   Server                        │
                                                                 ▼
                                                          [Video Engine]
                                                                 │
                                                                 ▼
                                                          [FFmpeg Render]
                                                                 │
                                                                 ▼
                                                           [Output MP4]
```

**Layer Compositing Model:**

```
L5: Telop / Text overlays
L4: Effects (particles, transitions)
L3: Avatar (chroma-keyed)
L2: Screen capture / Slides
L1: Background (3D space, gradients)
```

Output: 1920x1080, 30fps, H.264 + AAC, MP4

---

## API

atsurae.ai also exposes a REST API that any AI agent can call directly, without MCP.

Documentation: [https://docs.atsurae.ai](https://docs.atsurae.ai) *(coming soon)*

---

## Development

```bash
# Clone
git clone https://github.com/1000ri-jp/atsurae.git
cd atsurae

# Install with dev dependencies
uv pip install -e ".[dev]"

# Run the MCP server locally
python -m atsurae
```

---

## Contributing

Contributions are welcome. Please open an issue first to discuss what you'd like to change.

---

## License

[MIT](LICENSE)

---

**atsurae** is built by [1000ri-jp](https://github.com/1000ri-jp).

*AIが、あつらえる* — AI crafts it for you.

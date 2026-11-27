# Continue

The leading open-source AI code assistant for VS Code and JetBrains.

## Features

- **Chat** — Ask questions about your codebase
- **Autocomplete** — Tab-complete with any model
- **Edit** — Highlight code and give instructions
- **Actions** — Custom slash commands for repetitive tasks

## Supported Models

- Claude (Anthropic)
- GPT-4 (OpenAI)
- Gemini (Google)
- Ollama (local models)
- Any OpenAI-compatible API

## Install

### VS Code
Search "Continue" in the VS Code marketplace, or:
```
ext install continue.continue
```

### JetBrains
Search "Continue" in the JetBrains plugin marketplace.

## Configuration

Edit `~/.continue/config.json` to add your models:

```json
{
  "models": [
    {
      "title": "Claude Sonnet",
      "provider": "anthropic",
      "model": "claude-sonnet-4-20250514",
      "apiKey": "your-key"
    }
  ]
}
```

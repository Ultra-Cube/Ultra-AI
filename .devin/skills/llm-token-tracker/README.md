# LLM Token Tracker 🧮

Token usage tracker for OpenAI, Claude, and Gemini APIs with **MCP (Model Context Protocol) support**. Pass accurate API costs to your users.

[![npm version](https://badge.fury.io/js/llm-token-tracker.svg)](https://www.npmjs.com/package/llm-token-tracker)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

<a href="https://glama.ai/mcp/servers/@wn01011/llm-token-tracker">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@wn01011/llm-token-tracker/badge" alt="llm-token-tracker MCP server" />
</a>

## ✨ Features

- 🎯 **Simple Integration** - One line to wrap your API client
- 📊 **Automatic Tracking** - No manual token counting
- 💰 **Accurate Pricing** - Up-to-date pricing for all models (2025)
- 🔄 **Multiple Providers** - OpenAI, Claude, and Gemini support
- 📈 **User Management** - Track usage per user/session
- 🌐 **Currency Support** - USD and KRW
- 🤖 **MCP Server** - Use directly in Claude Desktop!
- 🆕 **Intuitive Session Tracking** - Real-time usage with progress bars

## 📦 Installation

```bash
npm install llm-token-tracker
```

## 🚀 Quick Start

### Option 1: Use as Library

```javascript
const { TokenTracker } = require('llm-token-tracker');
// or import { TokenTracker } from 'llm-token-tracker';

// Initialize tracker
const tracker = new TokenTracker({
  currency: 'USD' // or 'KRW'
});

// Example: Manual tracking
const trackingId = tracker.startTracking('user-123');

// ... your API call here ...

tracker.endTracking(trackingId, {
  provider: 'openai', // or 'anthropic' or 'gemini'
  model: 'gpt-3.5-turbo',
  inputTokens: 100,
  outputTokens: 50,
  totalTokens: 150
});

// Get user's usage
const usage = tracker.getUserUsage('user-123');
console.log(`Total cost: $${usage.totalCost}`);
```

## 🔧 With Real APIs

To use with actual OpenAI/Anthropic APIs:

```javascript
const OpenAI = require('openai');
const { TokenTracker } = require('llm-token-tracker');

const tracker = new TokenTracker();
const openai = tracker.wrap(new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
}));

// Use normally - tracking happens automatically
const response = await openai.chat.completions.create({
  model: "gpt-3.5-turbo",
  messages: [{ role: "user", content: "Hello!" }]
});

console.log(response._tokenUsage);
// { tokens: 125, cost: 0.0002, model: "gpt-3.5-turbo" }
```

### Option 2: Use as MCP Server

Add to Claude Desktop settings (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "token-tracker": {
      "command": "npx",
      "args": ["llm-token-tracker"]
    }
  }
}
```

Then in Claude:
- **"Calculate current session usage"** - See current session usage with intuitive format
- **"Calculate current conversation cost"** - Get cost breakdown with input/output tokens
- "Track my API usage"
- "Compare costs between GPT-4 and Claude"
- "Show my total spending today"

#### Available MCP Tools

1. **`get_current_session`** - 🆕 Get current session usage (RECOMMENDED)
   - Returns: Used/Remaining tokens, Input/Output breakdown, Cost, Progress bar
   - Default user_id: `current-session`
   - Default budget: 190,000 tokens
   - **Perfect for real-time conversation tracking!**

2. **`track_usage`** - Track token usage for an AI API call
   - Parameters: provider, model, input_tokens, output_tokens, user_id
   
3. **`get_usage`** - Get usage summary for specific user or all users
   
4. **`compare_costs`** - Compare costs between different models
   
5. **`clear_usage`** - Clear usage data for a user

#### Example MCP Output

```
💰 Current Session
━━━━━━━━━━━━━━━━━━━━━━
📊 Used: 62,830 tokens (33.1%)
✨ Remaining: 127,170 tokens
[██████░░░░░░░░░░░░░░]

📥 Input: 55,000 tokens
📤 Output: 7,830 tokens
💵 Cost: $0.2825
━━━━━━━━━━━━━━━━━━━━━━

📋 Model Breakdown:
  • anthropic/claude-sonnet-4.5: 62,830 tokens ($0.2825)
```

## 📊 Supported Models & Pricing (Updated 2025)

### OpenAI (2025)
| Model | Input (per 1K tokens) | Output (per 1K tokens) | Notes |
|-------|----------------------|------------------------|-------|
| **GPT-5 Series** | | | |
| GPT-5 | $0.00125 | $0.010 | Latest flagship model |
| GPT-5 Mini | $0.00025 | $0.0010 | Compact version |
| **GPT-4.1 Series** | | | |
| GPT-4.1 | $0.0020 | $0.008 | Advanced reasoning |
| GPT-4.1 Mini | $0.00015 | $0.0006 | Cost-effective |
| **GPT-4o Series** | | | |
| GPT-4o | $0.0025 | $0.010 | Multimodal |
| GPT-4o Mini | $0.00015 | $0.0006 | Fast & cheap |
| **o1 Reasoning Series** | | | |
| o1 | $0.015 | $0.060 | Advanced reasoning |
| o1 Mini | $0.0011 | $0.0044 | Efficient reasoning |
| o1 Pro | $0.015 | $0.060 | Pro reasoning |
| **Legacy Models** | | | |
| GPT-4 Turbo | $0.01 | $0.03 | |
| GPT-4 | $0.03 | $0.06 | |
| GPT-3.5 Turbo | $0.0005 | $0.0015 | Most affordable |
| **Media Models** | | | |
| DALL-E 3 | $0.040 per image | - | Image generation |
| Whisper | $0.006 per minute | - | Speech-to-text |

### Anthropic (2025)
| Model | Input (per 1K tokens) | Output (per 1K tokens) | Notes |
|-------|----------------------|------------------------|-------|
| **Claude 4 Series** | | | |
| Claude Opus 4.1 | $0.015 | $0.075 | Most powerful |
| Claude Opus 4 | $0.015 | $0.075 | Flagship model |
| Claude Sonnet 4.5 | $0.003 | $0.015 | Best for coding |
| Claude Sonnet 4 | $0.003 | $0.015 | Balanced |
| **Claude 3 Series** | | | |
| Claude 3.5 Sonnet | $0.003 | $0.015 | |
| Claude 3.5 Haiku | $0.00025 | $0.00125 | Fastest |
| Claude 3 Opus | $0.015 | $0.075 | |
| Claude 3 Sonnet | $0.003 | $0.015 | |
| Claude 3 Haiku | $0.00025 | $0.00125 | Most affordable |

### Google Gemini (2025)
| Model | Input (per 1K tokens) | Output (per 1K tokens) | Notes |
|-------|----------------------|------------------------|-------|
| **Gemini 2.0 Series** | | | |
| Gemini 2.0 Flash (Exp) | Free | Free | Experimental preview |
| Gemini 2.0 Flash Thinking | Free | Free | Reasoning preview |
| **Gemini 1.5 Series** | | | |
| Gemini 1.5 Pro | $0.00125 | $0.005 | Most capable |
| Gemini 1.5 Flash | $0.000075 | $0.0003 | Fast & efficient |
| Gemini 1.5 Flash-8B | $0.0000375 | $0.00015 | Ultra-fast |
| **Gemini 1.0 Series** | | | |
| Gemini 1.0 Pro | $0.0005 | $0.0015 | Legacy model |
| Gemini 1.0 Pro Vision | $0.00025 | $0.0005 | Multimodal |
| Gemini Ultra | $0.002 | $0.006 | Premium tier |

**Note:** Prices shown are per 1,000 tokens. Batch API offers 50% discount. Prompt caching can reduce costs by up to 90%.

## 🎯 Examples

Run the example:
```bash
npm run example
```

Check `examples/basic-usage.js` for detailed usage patterns.

## 📝 API Reference

### `new TokenTracker(config)`
- `config.currency`: 'USD' or 'KRW' (default: 'USD')
- `config.webhookUrl`: Optional webhook for usage notifications

### `tracker.wrap(client)`
Wrap an OpenAI or Anthropic client for automatic tracking.

### `tracker.forUser(userId)`
Create a user-specific tracker instance.

### `tracker.startTracking(userId?, sessionId?)`
Start manual tracking session. Returns tracking ID.

### `tracker.endTracking(trackingId, usage)`
End tracking and record usage.

### `tracker.getUserUsage(userId)`
Get total usage for a user.

### `tracker.getAllUsersUsage()`
Get usage summary for all users.

## 🛠 Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Watch mode
npm run dev

# Run examples
npm run example
```

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🐛 Issues

For bugs and feature requests, please [create an issue](https://github.com/wn01011/llm-token-tracker/issues).

## 📦 What's New in v2.4.0

- 🎉 **Gemini API Support** - Full integration with Google's Gemini models
- 💎 **Gemini 2.0 Support** - Free preview models included
- 📊 **Enhanced Pricing** - Up-to-date Gemini 1.5 and 2.0 pricing
- 🔧 **Auto-detection** - Automatic Gemini client wrapping
- 💰 **Cost Comparison** - Compare Gemini with OpenAI and Claude

## 📦 What's New in v2.3.0

- 💱 **Real-time exchange rates** - Automatic USD to KRW conversion
- 🌐 Uses exchangerate-api.com for accurate rates
- 💾 24-hour caching to minimize API calls
- 📊 New `get_exchange_rate` tool to check current rates
- 🔄 Background auto-updates with fallback support

## What's New in v2.2.0

- 🗄️ **File-based persistence** - Session data survives server restarts
- 💾 Automatic saving to `~/.llm-token-tracker/sessions.json`
- 🔄 Works for both npm and local installations
- 📊 Historical data tracking across sessions
- 🎯 Zero configuration required - just works!

## What's New in v2.1.0

- 🆕 Added `get_current_session` tool for intuitive session tracking
- 📊 Real-time progress bars and visual indicators
- 💰 Enhanced cost breakdown with input/output token separation
- 🎨 Improved formatting with thousands separators
- 🔧 Better default user_id handling (`current-session`)

---

Built with ❤️ for developers who need transparent AI API billing.
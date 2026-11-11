# Ultra AI Platform - Quick Start Guide

**Get up and running in 5 minutes!**

---

## 🚀 Installation

### Prerequisites Check

Ensure you have:
- ✅ Node.js 18+
- ✅ Python 3.9+
- ✅ Git
- ✅ 8GB+ RAM (16GB+ recommended)

### Step 1: Clone & Install

```bash
# Clone the repository
git clone https://github.com/your-org/Ultra-AI.git
cd Ultra-AI

# Install dependencies
npm install
```

### Step 2: Configure

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your API keys
# At minimum, add one provider API key
```

**Minimum .env configuration:**
```env
OPENAI_API_KEY=your_openai_key_here
NODE_ENV=development
```

### Step 3: Start

```bash
# Start the platform
npm run dev
```

### Step 4: Access

Open your browser:
```
http://localhost:3000
```

---

## 🎯 First Steps

### 1. Access the Dashboard

Navigate to `/dashboard` to see:
- System statistics
- AI systems overview
- Provider status
- Quick actions

### 2. Configure a Provider

1. Go to **Providers** tab
2. Click **Manage** on a provider
3. Enter your API key
4. Test connection
5. Save

### 3. Start an AI System

1. Go to **Systems** tab
2. Click **Start** on a system
3. Wait for initialization
4. System is now running!

### 4. Make Your First Request

```bash
curl http://localhost:20128/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'
```

---

## 📦 Common Use Cases

### Use Case 1: Chat with AI

```bash
# Simple chat request
curl http://localhost:20128/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4",
    "messages": [
      {"role": "user", "content": "What is Ultra AI Platform?"}
    ]
  }'
```

### Use Case 2: Code Generation

```bash
curl http://localhost:20128/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4",
    "messages": [
      {"role": "user", "content": "Write a Python function to calculate fibonacci"}
    ]
  }'
```

### Use Case 3: Streaming Response

```bash
curl http://localhost:20128/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4",
    "messages": [
      {"role": "user", "content": "Tell me a story"}
    ],
    "stream": true
  }'
```

---

## 🛠️ Starting Individual Systems

### Start API Gateway

```bash
cd platform/api/gateway
npm start
# Runs on port 20128
```

### Start OpenClaw

```bash
cd external-integrations/AI-assistant_openclaw
npm install
npm start
```

### Start JARVIS

```bash
cd external-integrations/AI-agentic-_JARVIS
pip install -r requirements.txt
python main.py
```

### Start WebUI Desktop

```bash
cd external-integrations/APP_WebUI-desktop
npm install
npm start
```

---

## 🔧 Configuration

### Add Multiple Providers

Edit `.env`:

```env
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
GOOGLE_API_KEY=your_google_key
COHERE_API_KEY=your_cohere_key
MISTRAL_API_KEY=your_mistral_key
```

### Change Gateway Port

Edit `.env`:

```env
API_GATEWAY_PORT=20129
```

### Enable Memory Optimization

```env
MEMORY_OPTIMIZER_ENABLED=true
MEMORY_GC_THRESHOLD=80
```

---

## 📊 Monitoring

### Check System Health

```bash
curl http://localhost:3000/api/control-center/health
```

### View System Stats

```bash
curl http://localhost:3000/api/control-center/system-stats
```

### View Integration Status

```bash
curl http://localhost:3000/api/integration/systems
```

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Find process using port
lsof -i :20128

# Kill process
kill -9 <PID>

# Or change port in .env
API_GATEWAY_PORT=20129
```

### Provider Connection Failed

1. Verify API key is correct
2. Check internet connection
3. Try alternative provider
4. Check provider status page

### Memory Issues

1. Enable memory optimizer
2. Reduce concurrent requests
3. Clear cache
4. Restart systems

---

## 📚 Next Steps

1. **Read the full [User Guide](./USER-GUIDE.md)**
2. **Explore the [Project Catalog](./PROJECT-CATALOG.md)**
3. **Check the [Documentation](./docs/)**
4. **Join our [Discord Community](https://discord.gg/ultra-ai)**

---

## 💡 Tips

- **Start Simple**: Begin with one provider, add more later
- **Monitor Usage**: Check analytics tab regularly
- **Use RTK**: Enable token optimization for 40% savings
- **Enable Fallback**: Ensure reliability with auto-fallback
- **Test Locally**: Test thoroughly before production

---

## 🆘 Need Help?

- 📖 [Documentation](./docs/)
- 💬 [Discord](https://discord.gg/ultra-ai)
- 🐛 [GitHub Issues](https://github.com/your-org/Ultra-AI/issues)
- 📧 support@ultra-ai.com

---

**You're ready to go! 🎉**
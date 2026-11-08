# n8n Self-Hosted AI Starter Kit

A Docker Compose template for setting up a complete self-hosted AI environment.

## What's Included

- **n8n** — Visual workflow automation
- **Ollama** — Local LLM inference
- **Qdrant** — Vector database for embeddings
- **PostgreSQL** — Persistent data storage

## Quick Start

```bash
git clone https://github.com/n8n-io/self-hosted-ai-starter-kit
cd self-hosted-ai-starter-kit
docker compose --profile cpu up
```

For GPU support:
```bash
docker compose --profile gpu-nvidia up
```

## Access Points

- n8n: http://localhost:5678
- Ollama API: http://localhost:11434
- Qdrant: http://localhost:6333

## Use Cases

- RAG chatbots over your documents
- AI-powered data pipelines
- Automated content generation
- Internal knowledge base assistants

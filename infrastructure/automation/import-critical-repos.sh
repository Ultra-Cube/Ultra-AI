#!/bin/bash
# Import critical repositories from Fadhel-SH in batches

cd external-integrations

# AI/ML/LLM Critical Repositories (Top 20)
echo "Importing AI/ML/LLM critical repositories..."
CRITICAL_AI=(
  "colibri"
  "higgsfield"
  "Open-Generative-AI"
  "AionUi"
  "OfficeCLI"
  "Understand-Anything"
  "ComfyUI"
  "build-ai-agents-free"
  "NemoClaw"
  "TensorRT-LLM"
  "OmniRoute"
  "open-code-review"
  "crawl4ai"
  "supabase"
  "langflow"
  "browser-use"
  "maxun"
  "OpenHands"
  "odysseus"
)

for repo in "${CRITICAL_AI[@]}"; do
  echo "Cloning $repo..."
  git clone https://github.com/Fadhel-SH/$repo.git 2>/dev/null || echo "Failed to clone $repo"
  rm -rf $repo/.git 2>/dev/null
done

echo "AI/ML/LLM repositories imported!"

# Desktop/Applications Critical Repositories
echo "Importing Desktop/Applications repositories..."
DESKTOP=(
  "hyperframes"
  "Kimi-K2"
  "GLM-5"
  "electron"
  "OpenWA"
  "skales"
)

for repo in "${DESKTOP[@]}"; do
  echo "Cloning $repo..."
  git clone https://github.com/Fadhel-SH/$repo.git 2>/dev/null || echo "Failed to clone $repo"
  rm -rf $repo/.git 2>/dev/null
done

echo "Desktop repositories imported!"

# Development Tools
echo "Importing Development Tools..."
DEV_TOOLS=(
  "open-seo"
  "OmniCloud"
  "atom"
  "vscode"
  "VSCodroid"
)

for repo in "${DEV_TOOLS[@]}"; do
  echo "Cloning $repo..."
  git clone https://github.com/Fadhel-SH/$repo.git 2>/dev/null || echo "Failed to clone $repo"
  rm -rf $repo/.git 2>/dev/null
done

echo "Development tools imported!"

echo "All critical repositories imported successfully!"
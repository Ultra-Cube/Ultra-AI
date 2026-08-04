# Local ZeroAI run guide

## Live URLs
- ZeroAI control surface: http://localhost:3000/zeroai
- API base: http://localhost:4000
- Health endpoint: http://localhost:4000/health/detailed
- Swagger docs: http://localhost:4000/api-docs

## Demo access
- No login is required for the local demo experience.
- Use the Simple view for everyday prompts and the Professional view for trace, workflow, and health inspection.
- The default workflow uses the local OpenClaw bridge and the local stack.

## What to try
1. Open http://localhost:3000/zeroai.
2. Switch between Simple and Professional views.
3. Submit a prompt such as "Summarize the live system state".
4. Create or run a workflow from the workflow builder.
5. Refresh state to inspect the latest routing trace and health cards.

## Troubleshooting
- If the page loads but prompts are slow or fall back, wait a few seconds for the local bridge to warm up.
- If the API is not reachable, confirm the process is running and the health endpoint responds.
- If the OpenClaw bridge reports a shell environment issue, restart the API and web servers once so the updated startup scripts are picked up.
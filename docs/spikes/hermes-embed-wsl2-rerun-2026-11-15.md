# Hermes embed-mode spike — wsl2

Date: 2026-11-15T05:11:30Z

## Binary

- path: `/home/pc/.local/bin/hermes`
- version: `Hermes Agent v0.23.1 (2026.9.24) · stable · local 3b4215785882`

## Mode matrix

| Mode | Command probed | Result |
|------|----------------|--------|
| CLI | hermes --help | POSITIVE |
| CLI | hermes run --help | negative/timeout |
| gateway | hermes serve --help | POSITIVE |
| gateway | hermes gateway --help | POSITIVE |
| gateway | hermes api --help | negative/timeout |
| http | port 8642 listen probe (informational) | POSITIVE |
| http | port 8080 listen probe (informational) | POSITIVE |
| http | port 3000 listen probe (informational) | POSITIVE |
| http | port 5000 listen probe (informational) | POSITIVE |

## How to complete the spike

1. For each POSITIVE mode, capture: request/response shape, auth model, session model.
2. For HTTP: try `/home/pc/.local/bin/hermes serve` (or equivalent) and hit `/v1/models`, `/v1/chat/completions`.
3. Record whether Open WebUI can point at it directly (OpenAI-compatible endpoint).
4. If no HTTP mode: note fallback = thin `hermes-bridge` (OpenAI-compatible -> CLI/session).

Raw probe log:
```
== /home/pc/.local/bin/hermes --help ==
usage: hermes [-h] [--version] [-z PROMPT] [--usage-file PATH]
              [--cpu-profile PATH] [-m MODEL] [--provider PROVIDER]
              [--reasoning LEVEL] [-t TOOLSETS] [--resume SESSION]
              [--no-restore-cwd] [--in DIR] [--continue [SESSION_NAME]]
              [--worktree] [--accept-hooks] [--skills SKILLS] [--yolo]
              [--pass-session-id] [--checkpoints] [--ignore-user-config]
              [--ignore-rules] [--safe-mode] [--tui] [--native] [--cli]
              [--dev]
              <command> ...

Hermes Agent - AI assistant with tool-calling capabilities

positional arguments:
  <command>             Command to run
    chat                Interactive chat with the agent
    model               Select default model and provider
    moa                 Configure Mixture of Agents provider/model slots
    fallback            Manage fallback providers (tried when the primary
                        model fails)
    worktree            Audit and reclaim accumulated git worktrees and merged
                        branches
    browser             Real-profile browsing helpers (close a browser locking
                        its profile)
    secrets             Manage external secret sources (Bitwarden, 1Password)
    egress              Manage the iron-proxy egress credential-injection
                        firewall
    migrate             Move over from another agent, or migrate retired
                        models and deprecated settings
    codex-runtime       Manage the optional codex app-server runtime (migrate
                        MCP config)
    gateway             Messaging gateway management
    proxy               Local OpenAI-compatible proxy to OAuth providers
    lsp                 Language Server Protocol management
    setup               Interactive setup wizard
    whatsapp            Set up WhatsApp integration
    whatsapp-cloud      Set up WhatsApp Business Cloud API integration
    slack               Slack integration helpers (manifest generation, etc.)
    send                Send a message to a configured platform (scripts, cron
                        jobs, CI).
    logout              Clear authentication for an inference provider

== /home/pc/.local/bin/hermes --version ==
Hermes Agent v0.23.1 (2026.9.24) · stable · local 3b4215785882
Install directory: /home/pc/.hermes/hermes-agent
Install method: git
Python: 3.14.9
OpenAI SDK: 2.54.0
```

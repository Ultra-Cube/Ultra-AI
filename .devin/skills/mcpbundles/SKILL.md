# MCP Bundles Hub MCP Server

<p align="center">
  <img src="https://mcpbundles.com/brand/logos/square/logo-square.png" alt="MCP Bundles Logo" width="120" />
</p>

<p align="center">
  <a href="https://mcpbundles.com"><img src="https://img.shields.io/badge/MCP-Compatible-orange?style=flat&logo=ai" alt="MCP Compatible"/></a>
  <a href="https://mcpbundles.com"><img src="https://img.shields.io/badge/Providers-500+-blue?style=flat" alt="500+ Providers"/></a>
  <a href="https://github.com/thinkchainai/mcpbundles/releases/latest"><img src="https://img.shields.io/badge/Download-.mcpb-success?style=flat" alt="Download .mcpb"/></a>
  <a href="https://docs.mcpbundles.com"><img src="https://img.shields.io/badge/Docs-Available-green?style=flat" alt="Documentation"/></a>
</p>

> Execute tools from your enabled bundles directly from Claude, Cursor, and other MCP-compatible AI assistants using the Model Context Protocol.

## Download

Download the MCPBundles Hub .mcpb file directly:

**[Download hub.mcpb](https://github.com/thinkchainai/mcpbundles/releases/download/hub-v1.0.0%2Bbuild.8da55d55/hub.mcpb)**

This `.mcpb` package contains a pre-configured MCP server proxy that connects to the MCPBundles Hub endpoint. Once installed, your AI assistant can discover and execute tools from all your enabled bundles.

> **Note**: This repository hosts `.mcpb` files for hundreds of bundles. The link above is specifically for the Hub server. See [all releases](https://github.com/thinkchainai/mcpbundles/releases) to download individual bundle packages.

## What is MCP Bundles?

**MCP Bundles** is the simplest way to connect AI assistants to real-world tools. Instead of configuring hundreds of individual MCP servers, you:

1. **Create bundles** of tools you need (e.g., "Marketing Tools", "Developer Workflow")
2. **Connect providers** with secure OAuth or API keys once
3. **Use one MCP URL** per bundle - all your tools instantly available

With 500+ provider integrations including GitHub, Slack, Notion, Google Drive, Salesforce, Stripe, and more, MCP Bundles eliminates the complexity of MCP server management while giving your AI assistant powerful, authenticated access to the services you use every day.

## What is the Hub MCP Server?

The **MCP Bundles Hub MCP Server** provides direct access to tools from all your enabled bundles through a single MCP endpoint. Instead of configuring each bundle separately, you can:

- **Execute Tools**: Run any tool from your enabled bundles through one interface
- **List Available Tools**: Discover what tools are available across all your bundles
- **Search Tools**: Find tools by name, provider, or capability
- **Check Readiness**: Verify bundle configuration and credential status
- **Get Tool Details**: View parameters, descriptions, and usage for specific tools

This server is **authenticated** and tied to your MCPBundles account. It aggregates all your bundle tools into one convenient MCP server endpoint.

## Features

- **OAuth & API Key Authentication**: Secure access via OAuth login or Bearer token  
- **Unified Access**: Execute tools from multiple bundles through one endpoint  
- **Tool Discovery**: Search and list all tools you have access to  
- **Bundle-Aware Execution**: Tools automatically use the correct credentials for each bundle  
- **Readiness Checks**: Verify configuration status before executing tools

## Documentation

For comprehensive setup guides and usage instructions:

- [Model Context Protocol Overview](https://docs.mcpbundles.com/overview/mcp)
- [Setting Up MCP in Cursor](https://docs.mcpbundles.com/how-to/connecting-your-ai#cursor)
- [Setting Up MCP in Claude Desktop](https://docs.mcpbundles.com/how-to/connecting-your-ai#claude-desktop)
- [App-Level Tools Guide](https://docs.mcpbundles.com/how-to/app-level-tools)

## Quick Start

### Prerequisites

- An MCPBundles account (free at [mcpbundles.com](https://mcpbundles.com))
- MCP-compatible client (Claude Desktop, Cursor, etc.)
- Authentication method:
  - **OAuth** (recommended): One-click authentication in Cursor
  - **API Key**: Get from your [dashboard](https://mcpbundles.com/dashboard) for Claude Desktop

### Setup Methods

#### Method 1: One-Click Install in Cursor (Recommended)

Cursor supports direct MCP server installation via URL:

1. Open Cursor Settings → Features → MCP
2. Click **"Add Server"**
3. Paste this URL: `https://github.com/thinkchainai/mcpbundles/releases/download/hub-v1.0.0%2Bbuild.8da55d55/hub.mcpb`
4. Authenticate with OAuth when prompted

#### Method 2: Download & Install .mcpb File

1. **[Download hub.mcpb](https://github.com/thinkchainai/mcpbundles/releases/download/hub-v1.0.0%2Bbuild.8da55d55/hub.mcpb)**
2. Double-click the `.mcpb` file (Claude Desktop will auto-install)
3. Restart Claude Desktop
4. Configure authentication (see Manual Configuration below for API key setup)

#### Method 3: Manual Configuration

#### Cursor Setup

Add to your Cursor MCP settings:

```json
{
  "mcpServers": {
    "mcpbundles-hub": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote@latest",
        "https://mcp.mcpbundles.com/hub/",
        "--header",
        "Authorization:Bearer ${ACCESS_TOKEN}"
      ],
      "env": {
        "ACCESS_TOKEN": "your_access_token_here"
      }
    }
  }
}
```

#### Claude Desktop Setup

Edit your Claude Desktop config file (Claude menu → Settings → Developer → Edit Config):

```json
{
  "mcpServers": {
    "mcpbundles-hub": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote@latest",
        "https://mcp.mcpbundles.com/hub/",
        "--header",
        "Authorization:Bearer ${ACCESS_TOKEN}"
      ],
      "env": {
        "ACCESS_TOKEN": "your_access_token_here"
      }
    }
  }
}
```

**Note:** Replace `your_access_token_here` with your actual MCPBundles access token from your dashboard.

## Example Usage

Once configured, you can ask your AI assistant:

### Execute Tools
- "Use the GitHub create_issue tool from my dev-tools bundle"
- "Execute the slack_send_message tool to post an update"
- "Run the notion_create_page tool with title 'Meeting Notes'"

### Discover Tools
- "What tools are available in my marketing bundle?"
- "List all GitHub tools I have access to"
- "Search for tools related to 'email'"

### Check Status
- "Check if my dev-tools bundle is ready to use"
- "Show me the parameters for the github_create_issue tool"
- "What bundles do I have enabled?"

## Available Tools

The Hub MCP server provides tools with the `mcpbundles_hub_` prefix:

### Bundle Operations
- `mcpbundles_hub_list_bundles` - List all your bundles
- `mcpbundles_hub_get_bundle` - Get details about a specific bundle
- `mcpbundles_hub_create_bundle` - Create a new bundle
- `mcpbundles_hub_update_bundle` - Update bundle configuration
- `mcpbundles_hub_delete_bundle` - Delete a bundle

### Credential Management
- `mcpbundles_hub_list_credentials` - List your provider credentials
- `mcpbundles_hub_add_credential` - Add a new provider credential
- `mcpbundles_hub_update_credential` - Update an existing credential
- `mcpbundles_hub_remove_credential` - Remove a credential

### Provider Discovery
- `mcpbundles_hub_search_providers` - Search available providers
- `mcpbundles_hub_get_provider_info` - Get detailed provider information
- `mcpbundles_hub_list_provider_tools` - List tools for a specific provider

### Account Management
- `mcpbundles_hub_get_account_info` - View your account details
- `mcpbundles_hub_get_usage_stats` - Check API usage statistics

## Security

The Hub MCP server supports two authentication methods:

1. **OAuth (Recommended)**: Secure browser-based authentication
   - Automatic token refresh
   - Revocable from your dashboard
   - Works seamlessly in Cursor

2. **API Keys**: Manual Bearer token authentication
   - Generate from your dashboard
   - Ideal for Claude Desktop
   - No expiration (until revoked)

Your credentials are:
- Encrypted in transit (HTTPS/TLS)
- Never exposed to the AI model
- Stored securely in your MCPBundles account
- Revocable at any time from your dashboard

**Never share your API keys or include them in public repositories.**

## How It Works with Your Bundles

The Hub MCP server is for **managing your account**. Once you create bundles, each bundle gets its own MCP server URL:

```
https://mcp.mcpbundles.com/bundle/your-bundle-name
```

**Typical Workflow:**

1. Use **Hub MCP** to create a bundle: "Create a bundle called 'dev-tools'"
2. Use **Hub MCP** to add providers: "Add GitHub and Slack credentials"
3. Use **Hub MCP** to configure tools: "Enable all GitHub repo tools"
4. Use the **Bundle MCP** (`/bundle/dev-tools`) to actually use the tools: "Create a new GitHub issue"

## Troubleshooting

### "401 Unauthorized" Error
- Check that your access token is valid
- Verify the token in your dashboard at [mcpbundles.com/dashboard](https://mcpbundles.com/dashboard)
- Make sure you're using the correct environment variable name

### Tools Not Appearing
- Restart your AI client after adding the MCP server
- Check that "App-Level Tools" is enabled in your dashboard
- Verify the MCP server URL is correct: `https://mcp.mcpbundles.com/hub/`

### Connection Timeout
- Ensure you have internet connectivity
- Check if mcpbundles.com is accessible
- Try refreshing your access token

## Support

Need help? We're here for you:

- **Email**: [support@mcpbundles.com](mailto:support@mcpbundles.com)
- **Documentation**: [docs.mcpbundles.com](https://docs.mcpbundles.com)
- **Discord**: [Join our community](https://discord.gg/mcpbundles)
- **Issues**: [Open an issue](https://github.com/thinkchainai/mcpbundles/issues)

## Related Resources

### Official Repositories
- [MCPBundles Package Releases](https://github.com/thinkchainai/mcpbundles) - .mcpb bundle files
- [MCPBundles Documentation](https://github.com/thinkchainai/mcp_docs) - Full documentation
- [Agent Interviews MCP](https://github.com/thinkchainai/agentinterviews_mcp) - Our interview platform

### MCP Resources
- [Model Context Protocol](https://modelcontextprotocol.io/) - Official MCP site
- [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Servers Repository](https://github.com/modelcontextprotocol/servers)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

<p align="center">
  <strong>Built by <a href="https://thinkchain.ai">ThinkChain Inc</a></strong><br/>
  <a href="https://mcpbundles.com">Website</a> • 
  <a href="https://docs.mcpbundles.com">Docs</a> • 
  <a href="https://twitter.com/mcpbundles">Twitter</a> • 
  <a href="https://reddit.com/r/mcpbundles">Reddit</a>
</p>

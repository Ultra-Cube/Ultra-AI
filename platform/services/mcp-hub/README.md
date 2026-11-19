<!--[UCUBETECH-COPYRIGHT]
 Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
 Developed by Ultra Zone Team — ultra-zone.ucubetech.com
 GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved-->

# @ultra-ai/mcp-hub

P1A-05 — MCP hub: registers MCP servers over pluggable transports
(stdio / SSE / HTTP), aggregates tool listings across servers, routes
`tools/call` with per-server allow/deny/requireConfirm policies and a
global deny list.

```ts
import { McpHub, InMemoryTransportFactory } from "@ultra-ai/mcp-hub";

const hub = new McpHub({
  transportFactory: new StdioTransportFactory(), // plug real transport
  policies: { github: { deny: ["delete_*"] } },
});
await hub.loadConfigFile(require("./brain-stack/mcp/mcp.json"));
await hub.callTool("filesystem", "read_file", { path: "/a" });
```

Real transports implement `McpTransportConn` (`listTools`/`callTool`/`close`)
— JSON-RPC framing stays in the transport layer so the hub stays testable
and zero-dep.

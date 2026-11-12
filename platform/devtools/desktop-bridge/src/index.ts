export { DesktopBridgeServer, type BridgeOptions } from './server';
export {
  eventNotification,
  METHOD_NOT_FOUND,
  INVALID_PARAMS,
  INTERNAL_ERROR,
  type JsonRpcRequest,
  type JsonRpcResponse,
  type JsonRpcNotification,
} from './protocol';

import { DesktopBridgeServer, type BridgeOptions } from './server';

const DEFAULT_PORT = Number(process.env.DESKTOP_BRIDGE_PORT ?? 9477);
const DEFAULT_HOST = process.env.DESKTOP_BRIDGE_HOST ?? '127.0.0.1';

export async function startBridge(
  options: Partial<BridgeOptions> = {}
): Promise<DesktopBridgeServer> {
  const server = new DesktopBridgeServer({
    port: options.port ?? DEFAULT_PORT,
    host: options.host ?? DEFAULT_HOST,
    config: options.config,
  });
  await server.start();
  return server;
}

// CLI entry: `node dist/index.js` starts the bridge on env-configured port.
if (require.main === module) {
  void startBridge().then((server) => {
    // eslint-disable-next-line no-console
    console.log(
      `desktop-bridge listening on ws://${DEFAULT_HOST}:${DEFAULT_PORT}`
    );
    const shutdown = () => void server.stop().then(() => process.exit(0));
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  });
}

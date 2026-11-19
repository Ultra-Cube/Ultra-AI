// [UCUBETECH-COPYRIGHT]
// Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
// Developed by Ultra Zone Team — ultra-zone.ucubetech.com
// GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved

/**
 * API Gateway standalone server entrypoint.
 */
import { APIGateway } from './index';

const PORT = parseInt(process.env.GATEWAY_PORT || '20129', 10);

async function main() {
  const gateway = new APIGateway(PORT);
  await gateway.initialize();
  await gateway.start();

  const shutdown = async () => {
    await gateway.stop();
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => {
  console.error('Gateway startup error:', err);
  process.exit(1);
});

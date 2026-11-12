export { createGateOsBridge, CONTRACT_VERSION } from './server';
export type { BridgeOptions, BridgeState } from './server';
export {
  ENVIRONMENT_PRESETS,
  ENVIRONMENT_IDS,
  buildUiSpec,
} from './environments';
export { classifyIntent } from './intents';
export type {
  EnvironmentId,
  EnvironmentPreset,
  EnvironmentProfile,
  UiSpec,
  UiPanelKind,
  IntentRequest,
  IntentResponse,
  PlatformEvent,
  PlatformEventType,
  Health,
  Capabilities,
  ApiError,
} from './types';

import { createGateOsBridge } from './server';

/* istanbul ignore next */
if (require.main === module) {
  const port = Number(process.env.GATE_OS_BRIDGE_PORT ?? 9300);
  const host = process.env.GATE_OS_BRIDGE_HOST ?? '127.0.0.1';
  const { server } = createGateOsBridge({
    token: process.env.GATE_OS_BRIDGE_TOKEN || undefined,
  });
  server.listen(port, host, () => {
    // eslint-disable-next-line no-console
    console.log(
      `gate-os-bridge listening on http://${host}:${port} (contract ${'1.0.0-draft'})`
    );
  });
}

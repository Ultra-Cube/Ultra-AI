// ╔══════════════════════════════════════════════════════════════════════════╗
// ║                                                                          ║
// ║ ██╗   ██╗██╗      █████╗ ██████╗                                         ║
// ║ ██║   ██║██║     ██╔══██╗██╔══██╗                                        ║
// ║ ██║   ██║██║     ███████║██████╔╝                                        ║
// ║ ╚██╗ ██╔╝██║     ██╔══██║██╔══██╗                                        ║
// ║  ╚████╔╝ ███████╗██║  ██║██████╔╝                                        ║
// ║   ╚═══╝  ╚══════╝╚═╝  ╚═╝╚═════╝                                         ║
// ║                                                                          ║
// ║ Project   : Ultra AI — Proprietary AI Platform                           ║
// ║ Developer : Ultra Cube Tech — ucubetech.com                              ║
// ║ Team      : Ultra Zone Team — ultra-zone.ucubetech.com                   ║
// ║ GitHub Org: github.com/Ultra-Cube                                        ║
// ║ Repository: github.com/Ultra-Cube/Ultra-AI                               ║
// ║ Copyright : (c) Ultra Cube Tech — All rights reserved                    ║
// ║ [UCUBETECH-COPYRIGHT]                                                    ║
// ║                                                                          ║
// ╚══════════════════════════════════════════════════════════════════════════╝

export { createHermesOpenAIHandler, startHermesOpenAIServer } from './server';
export type { HermesOpenAIOptions, HermesOpenAIServerOptions } from './server';

// Standalone entry: `npx tsx src/index.ts` (or node dist/index.js).
// Wires a HermesRuntime backed by MockProvider by default, or by an
// OpenAI-compatible upstream when HERMES_UPSTREAM_URL is set
// (e.g. http://localhost:11434/v1 for Ollama, :20128/v1 for 9router).
import {
  HermesRuntime,
  MockProvider,
  OpenAICompatibleProvider,
} from '@ultra-ai/hermes-runtime';

import { startHermesOpenAIServer } from './server';

export function createDefaultRuntime(): HermesRuntime {
  const runtime = new HermesRuntime({ provider: 'upstream' });
  const upstream = process.env.HERMES_UPSTREAM_URL;
  if (upstream) {
    runtime.registerProvider(
      new OpenAICompatibleProvider({
        id: 'upstream',
        baseURL: upstream,
        apiKey: process.env.HERMES_UPSTREAM_API_KEY,
        defaultModel: process.env.HERMES_UPSTREAM_MODEL,
      })
    );
  } else {
    runtime.registerProvider(new MockProvider({ id: 'upstream' }));
  }
  return runtime;
}

/* eslint-disable @typescript-eslint/no-var-requires */
if (require.main === module) {
  void startHermesOpenAIServer({ runtime: createDefaultRuntime() }).then(
    ({ url }) => {
      // eslint-disable-next-line no-console
      console.log(`hermes-openai-bridge listening at ${url}`);
    }
  );
}

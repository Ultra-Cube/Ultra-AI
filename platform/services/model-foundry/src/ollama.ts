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

import { foundryError, ModelCard } from './types';

export interface OllamaModelfile {
  name: string;
  from: string;
  parameters: Record<string, string>;
  template?: string;
  system?: string;
  licence: string;
}

/** Render an Ollama Modelfile for a GGUF artifact + model card (P1F-06). */
export function renderModelfile(
  card: ModelCard,
  ggufPath: string,
  opts?: {
    ctxSize?: number;
    gpuLayers?: number;
    systemPrompt?: string;
  }
): string {
  if (!card.ggufPath && !ggufPath) {
    throw foundryError(
      'OLLAMA_NO_GGUF',
      `model card ${card.id} has no GGUF artifact`
    );
  }
  const params: Record<string, string> = {
    temperature: '0.7',
    top_p: '0.9',
    num_ctx: String(opts?.ctxSize ?? 32768),
    num_gpu: String(opts?.gpuLayers ?? -1),
  };
  const lines = [
    `# Ultra Foundry model: ${card.name} v${card.version}`,
    `# licence: ${card.licence} (inherited: ${card.licenceInherited})`,
    `FROM ${ggufPath || card.ggufPath}`,
    '',
  ];
  for (const [k, v] of Object.entries(params))
    lines.push(`PARAMETER ${k} ${v}`);
  if (opts?.systemPrompt) {
    lines.push('', `SYSTEM """${opts.systemPrompt}"""`);
  }
  lines.push(
    '',
    `# card: ${card.id} | base: ${card.baseModel} | quant: ${card.quantization ?? 'n/a'}`
  );
  return lines.join('\n') + '\n';
}

/** Convert a model card into an Ollama `ollama create` invocation plan. */
export function ollamaCreatePlan(
  card: ModelCard,
  ggufPath: string
): {
  command: string;
  modelfile: string;
} {
  const modelfile = renderModelfile(card, ggufPath);
  const safe = card.name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-');
  return {
    command: `ollama create ${safe} -f Modelfile`,
    modelfile,
  };
}

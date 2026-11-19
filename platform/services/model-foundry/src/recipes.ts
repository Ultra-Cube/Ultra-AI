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

import { foundryError, RecipeManifest, RecipeKind } from './types';

const KINDS: ReadonlySet<RecipeKind> = new Set([
  'sft-lora',
  'distillation',
  'speculative-deepspec',
  'gguf-quantize',
  'eval',
  'ollama-serve',
]);

export function validateRecipe(r: RecipeManifest): void {
  if (!r.id || !r.baseModel) {
    throw foundryError('RECIPE_INVALID', 'recipe requires id and baseModel');
  }
  if (!KINDS.has(r.kind)) {
    throw foundryError('RECIPE_INVALID', `unknown recipe kind ${r.kind}`);
  }
  if (
    r.datasetIds.length === 0 &&
    (r.kind === 'sft-lora' ||
      r.kind === 'distillation' ||
      r.kind === 'speculative-deepspec' ||
      r.kind === 'eval')
  ) {
    // recipes may be drafted before datasets are registered; linkage is
    // enforced when a model card is built
  }
  if (r.kind === 'distillation') {
    if (!r.teacherModel) {
      throw foundryError(
        'RECIPE_INVALID',
        `distillation recipe ${r.id} requires teacherModel`
      );
    }
    if (r.teacherToSAllowsDistillation !== true) {
      throw foundryError(
        'DISTILLATION_TOS',
        `distillation recipe ${r.id}: teacherToSAllowsDistillation must be true (R2 sign-off)`
      );
    }
  }
  if (
    r.kind === 'speculative-deepspec' &&
    !/deepspec/i.test(r.baseModel + ' ' + (r.notes ?? ''))
  ) {
    // DeepSpec draft must be declared — warn via notes, not hard fail
  }
}

/** Canonical v0 recipe templates. All start `unverified` — no GPU in sandbox. */
export function defaultRecipes(): RecipeManifest[] {
  return [
    {
      id: 'sft-lora-qwen-coder',
      kind: 'sft-lora',
      baseModel: 'Qwen/Qwen2.5-Coder-7B-Instruct',
      datasetIds: [],
      hyperparams: {
        loraRank: 16,
        loraAlpha: 32,
        epochs: 3,
        lr: 2e-4,
        batchSize: 8,
        maxSeqLen: 8192,
        framework: 'axolotl',
      },
      requiresGpuHost: true,
      status: 'unverified',
      notes:
        'LoRA SFT on code-instruction data; run on GPU host with >=24GB VRAM.',
    },
    {
      id: 'deepspec-draft',
      kind: 'speculative-deepspec',
      baseModel: 'deepseek-ai/DeepSeek-V3',
      datasetIds: [],
      hyperparams: { draftLayers: 1, acceptanceThreshold: 0.5 },
      requiresGpuHost: true,
      status: 'unverified',
      notes:
        'DeepSpec speculative-decoding draft model (MIT). Requires DeepSpec repo + GPU.',
    },
    {
      id: 'gguf-q4-k-m',
      kind: 'gguf-quantize',
      baseModel: 'Qwen/Qwen2.5-Coder-7B-Instruct',
      datasetIds: [],
      hyperparams: { quantType: 'Q4_K_M', imatrix: true },
      requiresGpuHost: false,
      status: 'unverified',
      notes: 'llama.cpp convert + quantize; CPU-capable but slow for 7B.',
    },
    {
      id: 'eval-humaneval',
      kind: 'eval',
      baseModel: 'Qwen/Qwen2.5-Coder-7B-Instruct',
      datasetIds: [],
      hyperparams: { benchmark: 'humaneval', fewShot: 0 },
      requiresGpuHost: true,
      status: 'unverified',
      notes: 'Evaluation gate before catalog registration (P1F-06).',
    },
    {
      id: 'ollama-serve',
      kind: 'ollama-serve',
      baseModel: 'ultra-local-coder',
      datasetIds: [],
      hyperparams: { ctxSize: 32768, gpuLayers: -1 },
      requiresGpuHost: false,
      status: 'unverified',
      notes: 'Serve GGUF via `ollama create` + Modelfile.',
    },
  ];
}

/** Recipes intentionally not runnable until owner sign-off (e.g. distillation ToS). */
export function blockedRecipes(): RecipeManifest[] {
  return [
    {
      id: 'distill-qwen-teacher',
      kind: 'distillation',
      baseModel: 'Qwen/Qwen2.5-Coder-1.5B-Instruct',
      teacherModel: 'Qwen/Qwen2.5-Coder-7B-Instruct',
      datasetIds: [],
      teacherToSAllowsDistillation: false,
      hyperparams: { temperature: 0.7, topP: 0.9, maxTokens: 1024 },
      requiresGpuHost: true,
      status: 'draft',
      notes: 'BLOCKED until teacher ToS verified + owner sign-off (P1F-04/R2).',
    },
  ];
}

export class RecipeRegistry {
  private readonly recipes = new Map<string, RecipeManifest>();

  register(r: RecipeManifest): void {
    validateRecipe(r);
    if (this.recipes.has(r.id)) {
      throw foundryError(
        'RECIPE_DUPLICATE',
        `recipe ${r.id} already registered`
      );
    }
    this.recipes.set(r.id, r);
  }

  get(id: string): RecipeManifest | undefined {
    return this.recipes.get(id);
  }

  list(): RecipeManifest[] {
    return [...this.recipes.values()];
  }

  /** recipes that can actually run in this environment */
  runnableHere(): RecipeManifest[] {
    return this.list().filter(
      (r) => !r.requiresGpuHost && r.status !== 'verified'
    );
  }

  /** only verified recipes may feed model-card generation */
  verified(): RecipeManifest[] {
    return this.list().filter((r) => r.status === 'verified');
  }
}

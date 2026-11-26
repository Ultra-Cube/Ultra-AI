// ╔══════════════════════════════════════════════════════════════════════════╗
// ║                                                                          ║
// ║ ██╗   ██╗ ██╗      ███████╗ ██████╗   █████╗                             ║
// ║ ██║   ██║ ██║      ╚══██╔══╝ ██╔══██╗ ██╔══██╗                           ║
// ║ ██║   ██║ ██║         ██║    ██████╔╝ ███████║                           ║
// ║ ╚██╗ ██╔╝ ██║         ██║    ██╔══██║ ██╔══██║                           ║
// ║  ╚████╔╝ ███████╗    ██║    ██║  ██║ ██║  ██║                            ║
// ║   ╚═══╝  ╚══════╝    ╚═╝    ╚═╝  ╚═╝ ╚═╝  ╚═╝                            ║
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

/**
 * Agent OS model-family registry (R10/R11).
 * Canonical descriptions + routing hints per architecture family.
 * The n8n `model-router` workflow and the dashboard read this registry
 * to select, group, and govern models by family.
 */

import { MODEL_CATALOG } from './catalog';
import type { ModelEntry, ModelFamily } from './types';

export interface FamilyDefinition {
  family: ModelFamily;
  label: string;
  description: string;
  /** typical use cases for task routing */
  useCases: string[];
  /** preferred task classes for this family */
  preferredTaskClasses: Array<
    'chat' | 'code' | 'reasoning' | 'agent' | 'summarize'
  >;
  /** whether models of this family can run fully offline/local */
  supportsOffline: boolean;
}

export const MODEL_FAMILY_REGISTRY: Record<ModelFamily, FamilyDefinition> = {
  LLM: {
    family: 'LLM',
    label: 'Large Language Model',
    description:
      'General-purpose transformer LLMs for chat, reasoning, and code.',
    useCases: ['chat', 'reasoning', 'code generation', 'summarization'],
    preferredTaskClasses: ['chat', 'reasoning', 'code', 'summarize'],
    supportsOffline: true,
  },
  LCM: {
    family: 'LCM',
    label: 'Long-Context Model',
    description:
      'Models optimized for very large context windows (>=128k tokens) — document analysis, long-codebase work.',
    useCases: [
      'long-document QA',
      'codebase-wide analysis',
      'multi-file editing',
    ],
    preferredTaskClasses: ['reasoning', 'summarize', 'agent'],
    supportsOffline: true,
  },
  LAM: {
    family: 'LAM',
    label: 'Large Action Model',
    description:
      'Action-oriented models trained for tool use, function calling, and multi-step agent execution.',
    useCases: ['agent tasks', 'tool orchestration', 'workflow automation'],
    preferredTaskClasses: ['agent', 'code'],
    supportsOffline: false,
  },
  MoE: {
    family: 'MoE',
    label: 'Mixture-of-Experts',
    description:
      'Sparse mixture-of-experts architectures — high capability at lower active-parameter cost.',
    useCases: ['high-quality reasoning', 'cost-efficient inference', 'coding'],
    preferredTaskClasses: ['reasoning', 'code', 'chat'],
    supportsOffline: true,
  },
  VLM: {
    family: 'VLM',
    label: 'Vision-Language Model',
    description:
      'Multimodal models that understand images/video alongside text.',
    useCases: ['image understanding', 'OCR', 'UI/screenshot analysis'],
    preferredTaskClasses: ['chat', 'agent'],
    supportsOffline: true,
  },
  SLM: {
    family: 'SLM',
    label: 'Small Language Model',
    description:
      'Compact models for edge/on-device inference — fast, private, cheap.',
    useCases: [
      'quick classification',
      'edge deployment',
      'privacy-sensitive tasks',
    ],
    preferredTaskClasses: ['chat', 'summarize'],
    supportsOffline: true,
  },
  MLM: {
    family: 'MLM',
    label: 'Masked Language Model',
    description:
      'Encoder-style models for embeddings, classification, and retrieval — not generative chat.',
    useCases: ['embeddings', 'classification', 'semantic search', 'reranking'],
    preferredTaskClasses: ['summarize'],
    supportsOffline: true,
  },
  SAM: {
    family: 'SAM',
    label: 'Segment Anything Model',
    description:
      'Promptable image-segmentation models for pixel-precise masks.',
    useCases: [
      'image segmentation',
      'object isolation',
      'annotation pipelines',
    ],
    preferredTaskClasses: ['agent'],
    supportsOffline: true,
  },
};

/** All catalog entries belonging to a family (enabled only by default). */
export function catalogByFamily(
  family: ModelFamily,
  opts: { includeDisabled?: boolean } = {}
): ModelEntry[] {
  return MODEL_CATALOG.filter(
    (m) => m.family === family && (opts.includeDisabled || m.enabled)
  );
}

/** Family of a specific catalog entry, or undefined if not registered. */
export function familyOf(
  provider: string,
  model: string
): ModelFamily | undefined {
  return MODEL_CATALOG.find((m) => m.provider === provider && m.model === model)
    ?.family;
}

/** Families currently represented in the catalog (seed coverage view). */
export function familiesInCatalog(): ModelFamily[] {
  const set = new Set(MODEL_CATALOG.map((m) => m.family));
  return [...set];
}

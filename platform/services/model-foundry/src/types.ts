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
// ║ GitHub    : github.com/Ultra-Cube                                        ║
// ║ Copyright : (c) Ultra Cube Tech — All rights reserved                    ║
// ║ [UCUBETECH-COPYRIGHT]                                                    ║
// ║                                                                          ║
// ╚══════════════════════════════════════════════════════════════════════════╝

export type Licence =
  | 'apache-2.0'
  | 'mit'
  | 'bsd-2-clause'
  | 'bsd-3-clause'
  | 'cc-by-4.0'
  | 'cc-by-nc-4.0'
  | 'gpl-3.0'
  | 'agpl-3.0'
  | 'llama-community'
  | 'proprietary'
  | 'custom';

export type DatasetFormat =
  | 'jsonl'
  | 'sharegpt'
  | 'alpaca'
  | 'openai'
  | 'hf-parquet'
  | 'other';

export interface DatasetManifest {
  id: string;
  name: string;
  source: string;
  licence: Licence;
  commercialUse: boolean;
  containsPII: boolean;
  format: DatasetFormat;
  recordCount: number;
  sha256?: string;
  /** dataset ids this one derives from */
  lineage?: string[];
  notes?: string;
}

export type RecipeKind =
  | 'sft-lora'
  | 'distillation'
  | 'speculative-deepspec'
  | 'gguf-quantize'
  | 'eval'
  | 'ollama-serve';

export type RecipeStatus = 'draft' | 'unverified' | 'verified';

export interface RecipeManifest {
  id: string;
  kind: RecipeKind;
  baseModel: string;
  datasetIds: string[];
  /** teacher model for distillation */
  teacherModel?: string;
  /** must be true for distillation recipes — owner/R2 sign-off flag */
  teacherToSAllowsDistillation?: boolean;
  hyperparams: Record<string, unknown>;
  /** hardware tier required to execute */
  requiresGpuHost: boolean;
  status: RecipeStatus;
  artifactRef?: string;
  notes?: string;
}

export interface ModelCard {
  id: string;
  name: string;
  version: string;
  baseModel: string;
  baseModelLicence: Licence;
  licence: Licence;
  datasetIds: string[];
  recipeId?: string;
  quantization?: string;
  ggufPath?: string;
  intendedUse: string;
  limitations: string[];
  evalResults?: Record<string, number>;
  /** true when every input licence permits the declared licence */
  licenceInherited: boolean;
  licenceWarnings: string[];
}

export interface FoundryError extends Error {
  code: string;
}

export function foundryError(code: string, message: string): FoundryError {
  const err = new Error(message) as FoundryError;
  err.code = code;
  return err;
}

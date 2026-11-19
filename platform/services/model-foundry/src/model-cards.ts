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

import { DatasetRegistry } from './datasets';
import { foundryError, Licence, ModelCard } from './types';

/** Licences that cannot be combined into a derived model. */
const BLOCKED_COMBINATIONS: ReadonlyArray<readonly [Licence, Licence]> = [
  ['cc-by-nc-4.0', 'apache-2.0'],
  ['cc-by-nc-4.0', 'mit'],
  ['cc-by-nc-4.0', 'bsd-3-clause'],
  ['cc-by-nc-4.0', 'cc-by-4.0'],
];

export function isCompatible(source: Licence, target: Licence): boolean {
  if (source === target) return true;
  if (
    source === 'custom' ||
    target === 'custom' ||
    source === 'proprietary' ||
    target === 'proprietary'
  ) {
    return false;
  }
  if (
    BLOCKED_COMBINATIONS.some(
      ([a, b]) =>
        (a === source && b === target) || (a === target && b === source)
    )
  ) {
    return false;
  }
  return true;
}

/** Derive the strictest licence across inputs; flags violations. */
export function deriveLicence(
  baseModelLicence: Licence,
  datasetLicences: Licence[],
  declared: Licence
): { licence: Licence; warnings: string[] } {
  const warnings: string[] = [];
  const all = [baseModelLicence, ...datasetLicences];
  for (const l of all) {
    if (!isCompatible(l, declared)) {
      warnings.push(`licence ${l} is incompatible with declared ${declared}`);
    }
  }
  // non-commercial anywhere forces non-commercial or custom downstream
  if (
    all.includes('cc-by-nc-4.0') &&
    (declared === 'apache-2.0' || declared === 'mit')
  ) {
    warnings.push(
      'non-commercial dataset present: cannot declare permissive licence'
    );
  }
  return { licence: warnings.length ? 'custom' : declared, warnings };
}

export function validateModelCard(card: ModelCard): void {
  if (!card.id || !card.name || !card.baseModel) {
    throw foundryError(
      'CARD_INVALID',
      'model card requires id, name, baseModel'
    );
  }
  if (card.datasetIds.length === 0) {
    throw foundryError(
      'CARD_INVALID',
      `model card ${card.id} requires datasetIds`
    );
  }
  if (!card.licenceInherited) {
    throw foundryError(
      'CARD_LICENCE',
      `model card ${card.id}: licence not inherited cleanly — ${card.licenceWarnings.join('; ')}`
    );
  }
}

/** Build a model card from a verified recipe + registered datasets. */
export function buildModelCard(
  input: Omit<ModelCard, 'licence' | 'licenceInherited' | 'licenceWarnings'> & {
    declaredLicence: Licence;
  },
  registry: DatasetRegistry
): ModelCard {
  const datasetLicences: Licence[] = [];
  for (const id of input.datasetIds) {
    const d = registry.get(id);
    if (!d)
      throw foundryError(
        'CARD_DATASET_MISSING',
        `dataset ${id} not registered`
      );
    for (const l of registry.effectiveLicences(id)) datasetLicences.push(l);
    if (!d.commercialUse && input.declaredLicence !== 'custom') {
      throw foundryError(
        'CARD_LICENCE',
        `dataset ${id} is non-commercial; declared licence must be custom`
      );
    }
  }
  const { licence, warnings } = deriveLicence(
    input.baseModelLicence,
    datasetLicences,
    input.declaredLicence
  );
  const card: ModelCard = {
    id: input.id,
    name: input.name,
    version: input.version,
    baseModel: input.baseModel,
    baseModelLicence: input.baseModelLicence,
    licence,
    datasetIds: input.datasetIds,
    recipeId: input.recipeId,
    quantization: input.quantization,
    ggufPath: input.ggufPath,
    intendedUse: input.intendedUse,
    limitations: input.limitations,
    evalResults: input.evalResults,
    licenceInherited: warnings.length === 0,
    licenceWarnings: warnings,
  };
  validateModelCard(card);
  return card;
}

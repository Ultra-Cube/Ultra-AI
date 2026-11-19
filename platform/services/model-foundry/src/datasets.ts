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

import { DatasetManifest, foundryError, Licence } from './types';

/** Licences that never allow commercial use or model training outputs. */
const NON_COMMERCIAL: ReadonlySet<Licence> = new Set(['cc-by-nc-4.0']);

export function validateDatasetManifest(d: DatasetManifest): void {
  if (!d.id || !d.name || !d.source) {
    throw foundryError('DATASET_INVALID', 'dataset requires id, name, source');
  }
  if (d.recordCount < 0) {
    throw foundryError(
      'DATASET_INVALID',
      `dataset ${d.id}: recordCount must be >= 0`
    );
  }
  if (!d.commercialUse && d.licence !== 'custom') {
    // non-commercial flag must agree with licence
    if (!NON_COMMERCIAL.has(d.licence)) {
      throw foundryError(
        'DATASET_LICENCE_MISMATCH',
        `dataset ${d.id}: commercialUse=false but licence ${d.licence} permits commercial use`
      );
    }
  }
}

/** In-memory dataset registry with licence-aware lookup. */
export class DatasetRegistry {
  private readonly datasets = new Map<string, DatasetManifest>();

  register(d: DatasetManifest): void {
    validateDatasetManifest(d);
    if (this.datasets.has(d.id)) {
      throw foundryError(
        'DATASET_DUPLICATE',
        `dataset ${d.id} already registered`
      );
    }
    for (const parent of d.lineage ?? []) {
      if (!this.datasets.has(parent)) {
        throw foundryError(
          'DATASET_LINEAGE_MISSING',
          `dataset ${d.id} lineage parent ${parent} not registered`
        );
      }
    }
    this.datasets.set(d.id, d);
  }

  get(id: string): DatasetManifest | undefined {
    return this.datasets.get(id);
  }

  list(): DatasetManifest[] {
    return [...this.datasets.values()];
  }

  /** datasets usable for a commercial product */
  commercial(): DatasetManifest[] {
    return this.list().filter((d) => d.commercialUse);
  }

  /** datasets flagged as containing PII — require extra handling */
  withPII(): DatasetManifest[] {
    return this.list().filter((d) => d.containsPII);
  }

  /** effective licence set across lineage (parents included) */
  effectiveLicences(id: string): Set<Licence> {
    const out = new Set<Licence>();
    const walk = (did: string) => {
      const d = this.datasets.get(did);
      if (!d) return;
      out.add(d.licence);
      (d.lineage ?? []).forEach(walk);
    };
    walk(id);
    return out;
  }
}

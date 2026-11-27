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
import { isCompatible, deriveLicence, buildModelCard } from './model-cards';
import { ollamaCreatePlan, renderModelfile } from './ollama';
import { RecipeRegistry, defaultRecipes, validateRecipe } from './recipes';
import type { ModelCard } from './types';

const okDataset = {
  id: 'ds-code-001',
  name: 'code-instruct-v1',
  source: 'hf://example/code-instruct',
  licence: 'apache-2.0' as const,
  commercialUse: true,
  containsPII: false,
  format: 'jsonl' as const,
  recordCount: 1000,
};

describe('DatasetRegistry', () => {
  it('registers and lists datasets', () => {
    const r = new DatasetRegistry();
    r.register(okDataset);
    expect(r.get('ds-code-001')?.licence).toBe('apache-2.0');
    expect(r.commercial()).toHaveLength(1);
  });

  it('rejects duplicate ids', () => {
    const r = new DatasetRegistry();
    r.register(okDataset);
    expect(() => r.register(okDataset)).toThrow(/already registered/);
  });

  it('rejects missing lineage parent', () => {
    const r = new DatasetRegistry();
    expect(() =>
      r.register({ ...okDataset, id: 'child', lineage: ['missing-parent'] })
    ).toThrow(/lineage parent/);
  });

  it('flags non-commercial datasets', () => {
    const r = new DatasetRegistry();
    r.register({
      ...okDataset,
      id: 'nc',
      licence: 'cc-by-nc-4.0',
      commercialUse: false,
    });
    expect(r.commercial()).toHaveLength(0);
    expect(r.list()).toHaveLength(1);
  });
});

describe('RecipeRegistry', () => {
  it('ships unverified v0 recipes', () => {
    const reg = new RecipeRegistry();
    defaultRecipes().forEach((r) => reg.register(r));
    expect(reg.list().length).toBeGreaterThanOrEqual(5);
    expect(reg.verified()).toHaveLength(0);
    expect(reg.runnableHere().every((r) => !r.requiresGpuHost)).toBe(true);
  });

  it('blocks distillation without teacher ToS flag', () => {
    expect(() =>
      validateRecipe({
        id: 'bad-distill',
        kind: 'distillation',
        baseModel: 'small',
        teacherModel: 'big',
        datasetIds: ['d'],
        teacherToSAllowsDistillation: false,
        hyperparams: {},
        requiresGpuHost: true,
        status: 'draft',
      })
    ).toThrow(/teacherToSAllowsDistillation/);
  });

  it('accepts distillation once ToS flag set', () => {
    expect(() =>
      validateRecipe({
        id: 'ok-distill',
        kind: 'distillation',
        baseModel: 'small',
        teacherModel: 'big',
        datasetIds: ['d'],
        teacherToSAllowsDistillation: true,
        hyperparams: {},
        requiresGpuHost: true,
        status: 'unverified',
      })
    ).not.toThrow();
  });
});

describe('licence inheritance', () => {
  it('isCompatible rejects proprietary mixing', () => {
    expect(isCompatible('proprietary', 'mit')).toBe(false);
    expect(isCompatible('apache-2.0', 'mit')).toBe(true);
  });

  it('deriveLicence downgrades on non-commercial input', () => {
    const { licence, warnings } = deriveLicence(
      'apache-2.0',
      ['cc-by-nc-4.0'],
      'mit'
    );
    expect(licence).toBe('custom');
    expect(warnings.length).toBeGreaterThan(0);
  });

  it('buildModelCard produces inherited card', () => {
    const reg = new DatasetRegistry();
    reg.register(okDataset);
    const card = buildModelCard(
      {
        id: 'ultra-coder-v0',
        name: 'ultra-coder',
        version: '0.1.0',
        baseModel: 'Qwen/Qwen2.5-Coder-7B-Instruct',
        baseModelLicence: 'apache-2.0',
        datasetIds: ['ds-code-001'],
        declaredLicence: 'apache-2.0',
        intendedUse: 'code assistance',
        limitations: ['unverified until eval gate'],
      },
      reg
    );
    expect(card.licenceInherited).toBe(true);
    expect(card.licence).toBe('apache-2.0');
  });

  it('buildModelCard rejects non-commercial dataset with permissive licence', () => {
    const reg = new DatasetRegistry();
    reg.register({
      ...okDataset,
      id: 'nc',
      licence: 'cc-by-nc-4.0',
      commercialUse: false,
    });
    expect(() =>
      buildModelCard(
        {
          id: 'bad',
          name: 'bad',
          version: '0',
          baseModel: 'b',
          baseModelLicence: 'apache-2.0',
          datasetIds: ['nc'],
          declaredLicence: 'mit',
          intendedUse: 'x',
          limitations: [],
        },
        reg
      )
    ).toThrow(/non-commercial/);
  });
});

describe('ollama bridge', () => {
  const card: ModelCard = {
    id: 'm1',
    name: 'ultra-coder',
    version: '0.1.0',
    baseModel: 'Qwen/Qwen2.5-Coder-7B-Instruct',
    baseModelLicence: 'apache-2.0',
    licence: 'apache-2.0',
    datasetIds: ['d'],
    quantization: 'Q4_K_M',
    ggufPath: '/models/ultra-coder-q4.gguf',
    intendedUse: 'code',
    limitations: [],
    licenceInherited: true,
    licenceWarnings: [],
  };

  it('renders a Modelfile', () => {
    const mf = renderModelfile(card, '/models/x.gguf', { ctxSize: 16384 });
    expect(mf).toContain('FROM /models/x.gguf');
    expect(mf).toContain('num_ctx 16384');
    expect(mf).toContain('licence: apache-2.0');
  });

  it('produces create plan', () => {
    const plan = ollamaCreatePlan(card, '/models/x.gguf');
    expect(plan.command).toContain('ollama create ultra-coder');
    expect(plan.modelfile).toContain('FROM');
  });

  it('rejects card without gguf', () => {
    const noGguf = { ...card, ggufPath: undefined };
    expect(() => renderModelfile(noGguf, '')).toThrow(/GGUF/);
  });
});

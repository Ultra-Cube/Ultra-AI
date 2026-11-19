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

/**
 * First-run wizard state machine (P2-05).
 * Steps: welcome → hardware probe → model suggestions → engine opt-ins →
 * privacy/licence → done. State persists to a JSON file so a completed
 * wizard is not re-shown on subsequent launches.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { cpus, homedir } from 'os';
import { dirname, join } from 'path';

export type WizardStepId =
  | 'welcome'
  | 'hardware'
  | 'models'
  | 'engines'
  | 'privacy'
  | 'done';

export interface HardwareProbe {
  platform: string;
  arch: string;
  totalMemGB: number;
  cpuCount: number;
  gpuDetected: boolean;
  probedAt: string;
}

export interface ModelSuggestion {
  id: string;
  label: string;
  /** Why this model was suggested given the probed hardware. */
  reason: string;
  requiresGpu: boolean;
}

export interface EngineOptIn {
  id: string;
  label: string;
  /** Engines carrying licence obligations must be acknowledged. */
  licenceNote?: string;
}

export interface FirstRunState {
  completed: boolean;
  step: WizardStepId;
  selectedModels: string[];
  optedInEngines: string[];
  licenceAcknowledged: boolean;
  hardware?: HardwareProbe;
  completedAt?: string;
}

const STEP_ORDER: WizardStepId[] = [
  'welcome',
  'hardware',
  'models',
  'engines',
  'privacy',
  'done',
];

export function defaultStatePath(): string {
  return join(homedir(), '.ultra-ai', 'first-run.json');
}

export class FirstRunWizard {
  private state: FirstRunState;
  private readonly statePath: string;

  constructor(statePath: string = defaultStatePath()) {
    this.statePath = statePath;
    this.state = this.load();
  }

  private load(): FirstRunState {
    try {
      if (existsSync(this.statePath)) {
        return {
          ...this.fresh(),
          ...JSON.parse(readFileSync(this.statePath, 'utf8')),
        };
      }
    } catch {
      // Corrupt state file → start fresh rather than crash the shell.
    }
    return this.fresh();
  }

  private fresh(): FirstRunState {
    return {
      completed: false,
      step: 'welcome',
      selectedModels: [],
      optedInEngines: [],
      licenceAcknowledged: false,
    };
  }

  private persist(): void {
    mkdirSync(dirname(this.statePath), { recursive: true });
    writeFileSync(this.statePath, JSON.stringify(this.state, null, 2), 'utf8');
  }

  getState(): FirstRunState {
    return { ...this.state };
  }

  /** True when the wizard must be shown on launch. */
  needsFirstRun(): boolean {
    return !this.state.completed;
  }

  getStep(): WizardStepId {
    return this.state.step;
  }

  goTo(step: WizardStepId): void {
    this.state.step = step;
    this.persist();
  }

  next(): WizardStepId {
    const idx = STEP_ORDER.indexOf(this.state.step);
    this.state.step = STEP_ORDER[Math.min(idx + 1, STEP_ORDER.length - 1)];
    this.persist();
    return this.state.step;
  }

  back(): WizardStepId {
    const idx = STEP_ORDER.indexOf(this.state.step);
    this.state.step = STEP_ORDER[Math.max(idx - 1, 0)];
    this.persist();
    return this.state.step;
  }

  /** Probe the host so model/engine suggestions can be tailored. */
  probeHardware(): HardwareProbe {
    const totalMemBytes =
      Number(process.constrainedMemory?.() ?? 0) || undefined;
    const probe: HardwareProbe = {
      platform: process.platform,
      arch: process.arch,
      totalMemGB: totalMemBytes ? Math.round(totalMemBytes / 2 ** 30) : 0,
      cpuCount: cpus().length,
      gpuDetected: false, // refined by the GPU-host probe when available
      probedAt: new Date().toISOString(),
    };
    this.state.hardware = probe;
    this.persist();
    return probe;
  }

  /** Suggest local models based on probed hardware. */
  suggestModels(
    probe: HardwareProbe = this.state.hardware ?? this.probeHardware()
  ): ModelSuggestion[] {
    const suggestions: ModelSuggestion[] = [];
    if (probe.totalMemGB >= 16 || probe.gpuDetected) {
      suggestions.push(
        {
          id: 'qwen2.5-coder:7b',
          label: 'Qwen2.5 Coder 7B',
          reason: 'Fits comfortably with headroom for tools.',
          requiresGpu: false,
        },
        {
          id: 'deepseek-coder-v2:16b',
          label: 'DeepSeek Coder V2 16B',
          reason: 'Strong coding model; needs ~10 GB RAM.',
          requiresGpu: false,
        }
      );
    }
    suggestions.push(
      {
        id: 'llama3.2:3b',
        label: 'Llama 3.2 3B',
        reason: 'Lightweight default for low-memory hosts.',
        requiresGpu: false,
      },
      {
        id: 'nomic-embed-text',
        label: 'Nomic Embed',
        reason: 'Local embeddings for the memory bank.',
        requiresGpu: false,
      }
    );
    return suggestions;
  }

  /** Engines offered during opt-in; licence-bearing ones must be acknowledged. */
  engineCatalog(): EngineOptIn[] {
    return [
      { id: 'ollama', label: 'Ollama' },
      { id: 'open-webui', label: 'Open WebUI' },
      {
        id: 'n8n',
        label: 'n8n',
        licenceNote:
          'Sustainable Use License — review terms before enabling in production.',
      },
      { id: 'langflow', label: 'Langflow' },
      {
        id: 'dify',
        label: 'Dify',
        licenceNote:
          'Apache-2.0 with additional terms — review before commercial use.',
      },
      { id: 'openhands', label: 'OpenHands' },
      { id: 'ultra-studio', label: 'Ultra Studio (Code-OSS)' },
    ];
  }

  toggleModel(id: string): void {
    const i = this.state.selectedModels.indexOf(id);
    if (i >= 0) this.state.selectedModels.splice(i, 1);
    else this.state.selectedModels.push(id);
    this.persist();
  }

  toggleEngine(id: string): void {
    const i = this.state.optedInEngines.indexOf(id);
    if (i >= 0) this.state.optedInEngines.splice(i, 1);
    else this.state.optedInEngines.push(id);
    this.persist();
  }

  acknowledgeLicence(): void {
    this.state.licenceAcknowledged = true;
    this.persist();
  }

  /** Finish the wizard. Engines with licence notes require acknowledgement first. */
  complete(): { ok: boolean; error?: string } {
    const needsAck = this.state.optedInEngines.some((id) =>
      this.engineCatalog().some((e) => e.id === id && e.licenceNote)
    );
    if (needsAck && !this.state.licenceAcknowledged) {
      return {
        ok: false,
        error: 'licence acknowledgement required for selected engines',
      };
    }
    this.state.step = 'done';
    this.state.completed = true;
    this.state.completedAt = new Date().toISOString();
    this.persist();
    return { ok: true };
  }

  /** Reset for tests or "run setup again". */
  reset(): void {
    this.state = this.fresh();
    this.persist();
  }
}

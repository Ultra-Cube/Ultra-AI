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

import {
  Confirmation,
  DispatchExecutor,
  DispatchRequest,
  DispatchResult,
  DispatchTarget,
  Locality,
  Sensitivity,
  TrailEntry,
  WorkDispatch,
} from './types';

export interface WorkDispatchOptions {
  /** Executors keyed by route.target (or by agentId when set). */
  executors?: Partial<Record<DispatchTarget, DispatchExecutor>> &
    Record<string, DispatchExecutor>;
  /** Which targets execute locally vs escalate. Default: only 'local' is local. */
  locality?: Partial<Record<DispatchTarget, Locality>>;
  /** Injected id generator (tests). */
  idgen?: () => string;
  /** Injected clock (tests). */
  now?: () => Date;
  /** Optional signer port for readiness signatures (Ed25519). */
  signer?: {
    keyId: string;
    sign(payload: string): Promise<string> | string;
  };
}

const TARGETS: DispatchTarget[] = [
  'local',
  'hermes',
  'openhands',
  'ultra-studio',
  'customer',
  'specialist-agent',
];

const KINDS = ['code', 'research', 'ops', 'media', 'custom'];
const SENSITIVITIES: Sensitivity[] = ['public', 'internal', 'sensitive'];

function defaultIdgen(): string {
  // ULID-ish: timestamp base32 + random — no deps, monotonic enough for v1.
  const t = Date.now().toString(36).toUpperCase().padStart(10, '0');
  const r = Math.random().toString(36).slice(2, 12).toUpperCase();
  return `${t}${r}`.slice(0, 26);
}

export class WorkDispatcher {
  private readonly executors: NonNullable<WorkDispatchOptions['executors']>;
  private readonly locality: NonNullable<WorkDispatchOptions['locality']>;
  private readonly idgen: () => string;
  private readonly now: () => Date;
  private readonly signer?: WorkDispatchOptions['signer'];
  private readonly trail: TrailEntry[] = [];
  private readonly pending = new Map<string, WorkDispatch>();

  constructor(options: WorkDispatchOptions = {}) {
    this.executors = options.executors ?? {};
    this.locality = options.locality ?? {};
    this.idgen = options.idgen ?? defaultIdgen;
    this.now = options.now ?? (() => new Date());
    this.signer = options.signer;
  }

  /** Validate + gate + execute (or queue) a dispatch request. */
  async dispatch(req: DispatchRequest): Promise<DispatchResult> {
    const err = this.validate(req);
    if (err) return this.fail(req, err);

    const dispatch = this.buildEnvelope(req);
    this.trail.push({
      dispatchId: dispatch.dispatchId,
      at: this.now().toISOString(),
      event: 'received',
    });

    if (this.needsConfirmation(dispatch)) {
      this.trail.push({
        dispatchId: dispatch.dispatchId,
        at: this.now().toISOString(),
        event: 'confirmation-required',
        detail: `sensitivity=${dispatch.task.sensitivity ?? 'public'} requiresConfirmation=${dispatch.task.requiresConfirmation === true}`,
      });
      if (!req.confirmation?.approved) {
        this.pending.set(dispatch.dispatchId, dispatch);
        return {
          dispatch,
          status: 'awaiting-confirmation',
          reason: 'explicit confirmation required before execution',
        };
      }
      dispatch.execution = {
        ...dispatch.execution,
        locality: this.localityFor(dispatch.route.target),
        confirmedAt: this.now().toISOString(),
      };
      this.trail.push({
        dispatchId: dispatch.dispatchId,
        at: this.now().toISOString(),
        event: 'confirmed',
        detail: req.confirmation.confirmedBy,
      });
    } else {
      dispatch.execution = {
        locality: this.localityFor(dispatch.route.target),
      };
    }

    return this.execute(dispatch);
  }

  /** Approve a pending dispatch and run it. */
  async confirm(
    dispatchId: string,
    confirmation: Confirmation
  ): Promise<DispatchResult | null> {
    const dispatch = this.pending.get(dispatchId);
    if (!dispatch) return null;
    this.pending.delete(dispatchId);
    if (!confirmation.approved) {
      this.trail.push({
        dispatchId,
        at: this.now().toISOString(),
        event: 'denied',
        detail: confirmation.confirmedBy,
      });
      return {
        dispatch: { ...dispatch, execution: { locality: 'local' } },
        status: 'denied',
        reason: 'confirmation denied',
      };
    }
    dispatch.execution = {
      ...dispatch.execution,
      locality: this.localityFor(dispatch.route.target),
      confirmedAt: this.now().toISOString(),
    };
    this.trail.push({
      dispatchId,
      at: this.now().toISOString(),
      event: 'confirmed',
      detail: confirmation.confirmedBy,
    });
    return this.execute(dispatch);
  }

  /** Read-only trail for a dispatch (UI/audit). */
  trailFor(dispatchId: string): TrailEntry[] {
    return this.trail.filter((t) => t.dispatchId === dispatchId);
  }

  /** All pending dispatch ids awaiting confirmation. */
  pendingIds(): string[] {
    return [...this.pending.keys()];
  }

  /** Full trail across all dispatches (newest last). Read-only. */
  trailAll(): TrailEntry[] {
    return [...this.trail];
  }

  private needsConfirmation(d: WorkDispatch): boolean {
    return (
      d.task.sensitivity === 'sensitive' || d.task.requiresConfirmation === true
    );
  }

  private localityFor(target: DispatchTarget): Locality {
    return (
      this.locality[target] ?? (target === 'local' ? 'local' : 'escalated')
    );
  }

  private executorFor(d: WorkDispatch): DispatchExecutor | undefined {
    return (
      (d.route.agentId && this.executors[d.route.agentId]) ||
      this.executors[d.route.target]
    );
  }

  private async execute(d: WorkDispatch): Promise<DispatchResult> {
    const executor = this.executorFor(d);
    if (!executor) {
      this.trail.push({
        dispatchId: d.dispatchId,
        at: this.now().toISOString(),
        event: 'failed',
        detail: `no executor for target=${d.route.target}`,
      });
      return {
        dispatch: d,
        status: 'failed',
        reason: `no executor registered for target '${d.route.target}'`,
      };
    }

    this.trail.push({
      dispatchId: d.dispatchId,
      at: this.now().toISOString(),
      event: 'dispatched',
      detail: `target=${d.route.target} locality=${d.execution?.locality}`,
    });

    try {
      const out = await executor.execute(d, {});
      if (out.trailRef)
        d.execution = {
          ...d.execution,
          locality: d.execution?.locality ?? this.localityFor(d.route.target),
          trailRef: out.trailRef,
        };
      await this.maybeSign(d);
      this.trail.push({
        dispatchId: d.dispatchId,
        at: this.now().toISOString(),
        event: 'completed',
      });
      return { dispatch: d, status: 'completed', reason: 'executed' };
    } catch (e) {
      this.trail.push({
        dispatchId: d.dispatchId,
        at: this.now().toISOString(),
        event: 'failed',
        detail: e instanceof Error ? e.message : String(e),
      });
      return {
        dispatch: d,
        status: 'failed',
        reason: e instanceof Error ? e.message : 'executor failed',
      };
    }
  }

  private async maybeSign(d: WorkDispatch): Promise<void> {
    if (!this.signer) return;
    const payload = JSON.stringify({
      dispatchId: d.dispatchId,
      task: d.task,
      route: d.route,
      execution: d.execution,
    });
    d.signature = {
      alg: 'Ed25519',
      keyId: this.signer.keyId,
      value: await this.signer.sign(payload),
    };
  }

  private buildEnvelope(req: DispatchRequest): WorkDispatch {
    return {
      dispatchId: req.dispatchId ?? this.idgen(),
      task: {
        id: req.task.id ?? this.idgen(),
        kind: req.task.kind,
        payload: req.task.payload,
        sensitivity: req.task.sensitivity ?? 'public',
        requiresConfirmation: req.task.requiresConfirmation ?? false,
      },
      route: req.route,
    };
  }

  private validate(req: DispatchRequest): string | null {
    if (!req || typeof req !== 'object') return 'request must be an object';
    const { task, route } = req;
    if (!task || typeof task !== 'object') return 'task is required';
    if (!KINDS.includes(task.kind)) return `invalid task.kind '${task.kind}'`;
    if (!task.payload || typeof task.payload !== 'object')
      return 'task.payload must be an object';
    if (task.sensitivity && !SENSITIVITIES.includes(task.sensitivity))
      return `invalid task.sensitivity '${task.sensitivity}'`;
    if (!route || typeof route !== 'object') return 'route is required';
    if (!TARGETS.includes(route.target))
      return `invalid route.target '${route.target}'`;
    if (
      route.priority !== undefined &&
      (!Number.isInteger(route.priority) ||
        route.priority < 0 ||
        route.priority > 9)
    )
      return 'route.priority must be an integer 0-9';
    if (route.target === 'customer' && !route.customerId)
      return "route.customerId is required when target='customer'";
    if (route.target === 'specialist-agent' && !route.agentId)
      return "route.agentId is required when target='specialist-agent'";
    return null;
  }

  private fail(req: DispatchRequest, reason: string): DispatchResult {
    const dispatch: WorkDispatch = {
      dispatchId: req?.dispatchId ?? this.idgen(),
      task: {
        id: req?.task?.id ?? this.idgen(),
        kind: (req?.task?.kind as WorkDispatch['task']['kind']) ?? 'custom',
        payload: req?.task?.payload ?? {},
      },
      route: req?.route ?? { target: 'local' },
      execution: { locality: 'local' },
    };
    this.trail.push({
      dispatchId: dispatch.dispatchId,
      at: this.now().toISOString(),
      event: 'failed',
      detail: reason,
    });
    return { dispatch, status: 'failed', reason };
  }
}

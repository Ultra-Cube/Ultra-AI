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
 * Conformance suite for WorkflowEngine adapters (P1C).
 *
 * Any adapter must satisfy these invariants; `assertWorkflowConformance`
 * is run by each adapter's test file against a mocked engine backend.
 */
import {
  WorkflowEngineError,
  type WorkflowEngine,
  type WorkflowRequest,
  type WorkflowResult,
} from './types';

const STEP_KINDS = new Set(['thought', 'action', 'observation', 'answer']);

export interface ConformanceViolation {
  check: string;
  message: string;
}

export interface ConformanceResult {
  engine: string;
  passed: boolean;
  violations: ConformanceViolation[];
  result?: WorkflowResult;
  error?: string;
}

const SAMPLE_REQUEST: WorkflowRequest = { goal: 'conformance probe' };

export async function assertWorkflowConformance(
  engine: WorkflowEngine,
  request: WorkflowRequest = SAMPLE_REQUEST
): Promise<ConformanceResult> {
  const violations: ConformanceViolation[] = [];
  const fail = (check: string, message: string) =>
    violations.push({ check, message });

  let result: WorkflowResult | undefined;
  let error: string | undefined;

  try {
    result = await engine.run(request);
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  if (error !== undefined) {
    fail('run', `engine.run threw: ${error}`);
    return { engine: engine.kind, passed: false, violations, error };
  }

  // result is defined when no error was caught
  const r = result as WorkflowResult;

  if (r.engine !== engine.kind) {
    fail(
      'engine',
      `result.engine '${r.engine}' !== engine.kind '${engine.kind}'`
    );
  }
  if (typeof r.answer !== 'string') {
    fail('answer', 'answer is not a string');
  }
  if (!Array.isArray(r.steps)) {
    fail('steps', 'steps is not an array');
  } else {
    for (const [i, s] of r.steps.entries()) {
      if (!STEP_KINDS.has(s.kind)) {
        fail('steps', `step[${i}] has invalid kind '${s.kind}'`);
      }
      if (typeof s.content !== 'string') {
        fail('steps', `step[${i}] content is not a string`);
      }
    }
    if (!r.steps.some((s) => s.kind === 'answer')) {
      fail('steps', 'no terminal answer step emitted');
    }
  }
  if (r.locality !== 'local' && r.locality !== 'remote') {
    fail('locality', `invalid locality '${r.locality}'`);
  }
  if (typeof r.durationMs !== 'number' || r.durationMs < 0) {
    fail('durationMs', `invalid durationMs '${r.durationMs}'`);
  }

  return {
    engine: engine.kind,
    passed: violations.length === 0,
    violations,
    ...(result ? { result } : {}),
  };
}

/** Conformance for error behavior: engine must surface errors as WorkflowEngineError. */
export async function assertWorkflowErrorConformance(
  engine: WorkflowEngine,
  request: WorkflowRequest
): Promise<boolean> {
  try {
    await engine.run(request);
    return false;
  } catch (err) {
    return err instanceof WorkflowEngineError;
  }
}

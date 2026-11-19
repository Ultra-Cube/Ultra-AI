// [UCUBETECH-COPYRIGHT]
// Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
// Developed by Ultra Zone Team — ultra-zone.ucubetech.com
// GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved

/**
 * P4B-08 — STUB handlers for ultra-core.callback.v1 types.
 * Each handler records structured observations only; none executes
 * payload contents. Wire to real subsystems once contracts stabilize.
 */

import type { CallbackHandler, UltraCoreCallback } from './inbound-receiver';

export interface HandlerObservations {
  anchorConfirmations: UltraCoreCallback[];
  balanceChanges: UltraCoreCallback[];
  policyChanges: UltraCoreCallback[];
  registryRevocations: UltraCoreCallback[];
  approvalDecisions: UltraCoreCallback[];
  unknown: UltraCoreCallback[];
}

export function createObservations(): HandlerObservations {
  return {
    anchorConfirmations: [],
    balanceChanges: [],
    policyChanges: [],
    registryRevocations: [],
    approvalDecisions: [],
    unknown: [],
  };
}

/** anchor.confirmed -> trace proof (T0). */
export function anchorConfirmedHandler(
  obs: HandlerObservations
): CallbackHandler {
  return (cb) => {
    obs.anchorConfirmations.push(cb);
  };
}

/** credits.balance_changed -> budgets/console (T1, approval-gated upstream). */
export function balanceChangedHandler(
  obs: HandlerObservations
): CallbackHandler {
  return (cb) => {
    obs.balanceChanges.push(cb);
  };
}

/** governance.policy_changed -> gateway policy after timelock+approval. */
export function policyChangedHandler(
  obs: HandlerObservations
): CallbackHandler {
  return (cb) => {
    obs.policyChanges.push(cb);
  };
}

/** registry.item_revoked -> disable skill/key. */
export function registryRevokedHandler(
  obs: HandlerObservations
): CallbackHandler {
  return (cb) => {
    obs.registryRevocations.push(cb);
  };
}

/** approval.decided -> resume/cancel task. */
export function approvalDecidedHandler(
  obs: HandlerObservations
): CallbackHandler {
  return (cb) => {
    obs.approvalDecisions.push(cb);
  };
}

/** Catch-all recorder for unregistered types (registered on '*'). */
export function unknownHandler(obs: HandlerObservations): CallbackHandler {
  return (cb) => {
    obs.unknown.push(cb);
  };
}

/** Register all stub handlers on a receiver. */
export function registerStubHandlers(
  rx: { on(type: string, h: CallbackHandler): void },
  obs: HandlerObservations
): void {
  rx.on('anchor.confirmed', anchorConfirmedHandler(obs));
  rx.on('credits.balance_changed', balanceChangedHandler(obs));
  rx.on('governance.policy_changed', policyChangedHandler(obs));
  rx.on('registry.item_revoked', registryRevokedHandler(obs));
  rx.on('approval.decided', approvalDecidedHandler(obs));
  rx.on('*', unknownHandler(obs));
}

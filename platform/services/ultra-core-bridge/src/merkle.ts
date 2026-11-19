import { createHash } from 'node:crypto';

/**
 * Merkle inclusion proofs over `sha256:<64hex>` leaf hashes.
 *
 * Convention (matches contracts/ultra-core Proof.proof[] {hash, side}):
 * - Leaf = `sha256:<hex>` of the canonical event (see signer.eventHash).
 * - Internal node = `sha256:<hex>` of sha256(leftHashText + rightHashText)
 *   where the inputs are the full `sha256:<hex>` strings of the children.
 * - Odd leaf at a level is duplicated (Bitcoin-style) before pairing.
 * - `side` in a proof item is the sibling position relative to the running
 *   node: "left" = sibling comes first, "right" = sibling comes second.
 */

const hex = (s: string): string => s.replace(/^sha256:/, '');

function nodeHash(left: string, right: string): string {
  return (
    'sha256:' +
    createHash('sha256')
      .update(hex(left) + hex(right), 'utf8')
      .digest('hex')
  );
}

/** Build all levels bottom-up; returns [leaves, level1, ..., [root]]. */
function levels(leaves: string[]): string[][] {
  const out: string[][] = [leaves.slice()];
  let level = leaves.slice();
  while (level.length > 1) {
    const next: string[] = [];
    for (let i = 0; i < level.length; i += 2) {
      const l = level[i];
      const r = level[i + 1] ?? l; // duplicate odd tail
      next.push(nodeHash(l, r));
    }
    out.push(next);
    level = next;
  }
  return out;
}

export function merkleRoot(leaves: string[]): string {
  if (leaves.length === 0) return 'sha256:' + '0'.repeat(64);
  const lv = levels(leaves);
  return lv[lv.length - 1][0];
}

export interface MerkleProofItem {
  hash: string;
  side: 'left' | 'right';
}

export function merkleProof(
  leaves: string[],
  index: number
): MerkleProofItem[] {
  if (index < 0 || index >= leaves.length) {
    throw new Error(`merkleProof index ${index} out of range`);
  }
  const lv = levels(leaves);
  const proof: MerkleProofItem[] = [];
  let idx = index;
  for (let d = 0; d < lv.length - 1; d++) {
    const level = lv[d];
    const sibling = idx % 2 === 0 ? idx + 1 : idx - 1;
    if (sibling < level.length) {
      proof.push({
        hash: level[sibling],
        side: idx % 2 === 0 ? 'right' : 'left',
      });
    }
    // duplicated odd tail: no sibling at this level -> hash with itself
    else {
      proof.push({ hash: level[idx], side: 'right' });
    }
    idx = Math.floor(idx / 2);
  }
  return proof;
}

/** Verify a leaf against proof items and a root. */
export function verifyMerkleProof(
  leaf: string,
  proof: MerkleProofItem[],
  root: string
): boolean {
  let cur = leaf;
  for (const item of proof) {
    cur =
      item.side === 'left'
        ? nodeHash(item.hash, cur)
        : nodeHash(cur, item.hash);
  }
  return cur === root;
}

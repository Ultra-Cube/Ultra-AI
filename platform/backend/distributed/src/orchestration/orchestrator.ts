// [UCUBETECH-COPYRIGHT]
// Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
// Developed by Ultra Zone Team — ultra-zone.ucubetech.com
// GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved

import { Chunk } from '../chunking/chunker';

export interface NodeAssignment {
  nodeId: string;
  chunk: Chunk;
}

export class Orchestrator {
  assign(chunks: Chunk[], nodeIds: string[]): NodeAssignment[] {
    if (nodeIds.length === 0) {
      throw new Error('At least one node is required for assignment');
    }

    return chunks.map((chunk, index) => ({
      chunk,
      nodeId: nodeIds[index % nodeIds.length],
    }));
  }
}

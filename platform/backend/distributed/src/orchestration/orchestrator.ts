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

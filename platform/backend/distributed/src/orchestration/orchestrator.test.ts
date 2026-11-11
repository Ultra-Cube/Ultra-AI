import { Chunker } from '../chunking/chunker';

import { Orchestrator } from './orchestrator';

describe('Orchestrator', () => {
  it('assigns chunks across available nodes', () => {
    const chunker = new Chunker();
    const orchestrator = new Orchestrator();
    const chunks = chunker.split('abcdefghi', 3);

    const assignments = orchestrator.assign(chunks, ['node-a', 'node-b']);

    expect(assignments).toHaveLength(chunks.length);
    expect(assignments[0].nodeId).toBe('node-a');
    expect(assignments[1].nodeId).toBe('node-b');
    expect(assignments[2].nodeId).toBe('node-a');
  });
});

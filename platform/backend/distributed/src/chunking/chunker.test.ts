// [UCUBETECH-COPYRIGHT]
// Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
// Developed by Ultra Zone Team — ultra-zone.ucubetech.com
// GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved

import { Chunker } from './chunker';

describe('Chunker', () => {
  it('splits and merges deterministically', () => {
    const chunker = new Chunker();
    const input = 'Ultra AI distributed processing baseline.';
    const chunks = chunker.split(input, 10);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].total).toBe(chunks.length);
    expect(chunker.merge(chunks)).toBe(input);
  });
});

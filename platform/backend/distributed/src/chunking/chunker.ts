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

export interface Chunk {
  id: string;
  index: number;
  total: number;
  payload: string;
}

export class Chunker {
  split(input: string, chunkSize = 64): Chunk[] {
    if (chunkSize <= 0) {
      throw new Error('chunkSize must be greater than 0');
    }

    const parts = input.match(new RegExp(`.{1,${chunkSize}}`, 'g')) ?? [];
    return parts.map((payload, index) => ({
      id: `chunk-${index + 1}`,
      index,
      total: parts.length,
      payload,
    }));
  }

  merge(chunks: Chunk[]): string {
    return [...chunks]
      .sort((a, b) => a.index - b.index)
      .map((chunk) => chunk.payload)
      .join('');
  }
}

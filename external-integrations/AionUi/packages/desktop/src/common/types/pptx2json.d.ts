// [UCUBETECH-COPYRIGHT]
// Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
// Developed by Ultra Zone Team — ultra-zone.ucubetech.com
// GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved

/**
 * Type declarations for pptx2json
 */
declare module 'pptx2json' {
  export default class PPTX2Json {
    constructor();
    toJson(file_path: string): Promise<any>;
    toPPTX(json: any, options?: { file?: string }): Promise<Buffer>;
    getMaxSlideIds(json: any): { id: number; rid: number };
    getSlideLayoutTypeHash(json: any): Record<string, string>;
  }
}

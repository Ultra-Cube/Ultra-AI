// [UCUBETECH-COPYRIGHT]
// Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
// Developed by Ultra Zone Team — ultra-zone.ucubetech.com
// GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved

import { Global, Module } from '@nestjs/common';
import { EngineFactory } from './engine.factory';

@Global()
@Module({
  providers: [EngineFactory],
  exports: [EngineFactory],
})
export class EngineModule {}

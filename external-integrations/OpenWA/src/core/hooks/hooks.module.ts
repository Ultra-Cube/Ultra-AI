// [UCUBETECH-COPYRIGHT]
// Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
// Developed by Ultra Zone Team — ultra-zone.ucubetech.com
// GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved

import { Global, Module } from '@nestjs/common';
import { HookManager } from './hook-manager.service';

@Global() // Make HookManager available everywhere without importing
@Module({
  providers: [HookManager],
  exports: [HookManager],
})
export class HooksModule {}

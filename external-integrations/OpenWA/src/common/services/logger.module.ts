// [UCUBETECH-COPYRIGHT]
// Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
// Developed by Ultra Zone Team — ultra-zone.ucubetech.com
// GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved

import { Global, Module } from '@nestjs/common';
import { LoggerService } from './logger.service';
import { ShutdownService } from './shutdown.service';

@Global()
@Module({
  providers: [LoggerService, ShutdownService],
  exports: [LoggerService, ShutdownService],
})
export class LoggerModule {}

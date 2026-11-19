// [UCUBETECH-COPYRIGHT]
// Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
// Developed by Ultra Zone Team — ultra-zone.ucubetech.com
// GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved

import { Module } from '@nestjs/common';
import { LabelController } from './label.controller';
import { SessionModule } from '../session/session.module';

@Module({
  imports: [SessionModule],
  controllers: [LabelController],
})
export class LabelModule {}

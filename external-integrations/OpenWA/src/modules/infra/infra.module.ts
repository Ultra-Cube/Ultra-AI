// [UCUBETECH-COPYRIGHT]
// Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
// Developed by Ultra Zone Team — ultra-zone.ucubetech.com
// GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved

import { Module } from '@nestjs/common';
import { InfraController } from './infra.controller';
import { EngineModule } from '../../engine/engine.module';
import { DockerModule } from '../docker';

@Module({
  imports: [EngineModule, DockerModule],
  controllers: [InfraController],
})
export class InfraModule {}

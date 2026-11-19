// [UCUBETECH-COPYRIGHT]
// Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
// Developed by Ultra Zone Team — ultra-zone.ucubetech.com
// GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved

import { Module } from '@nestjs/common';
import { DockerService } from './docker.service';

@Module({
  providers: [DockerService],
  exports: [DockerService],
})
export class DockerModule {}

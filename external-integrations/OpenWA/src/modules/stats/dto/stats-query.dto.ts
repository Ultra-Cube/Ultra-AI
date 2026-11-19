// [UCUBETECH-COPYRIGHT]
// Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
// Developed by Ultra Zone Team — ultra-zone.ucubetech.com
// GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved

import { IsOptional, IsIn } from 'class-validator';

export class StatsQueryDto {
  @IsOptional()
  @IsIn(['24h', '7d', '30d'])
  period?: '24h' | '7d' | '30d' = '24h';
}

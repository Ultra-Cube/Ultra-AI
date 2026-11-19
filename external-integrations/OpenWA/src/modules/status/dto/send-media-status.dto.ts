// [UCUBETECH-COPYRIGHT]
// Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
// Developed by Ultra Zone Team — ultra-zone.ucubetech.com
// GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved

import { IsString, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class MediaInput {
  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  base64?: string;
}

export class SendImageStatusDto {
  @ValidateNested()
  @Type(() => MediaInput)
  image: MediaInput;

  @IsOptional()
  @IsString()
  caption?: string;
}

export class SendVideoStatusDto {
  @ValidateNested()
  @Type(() => MediaInput)
  video: MediaInput;

  @IsOptional()
  @IsString()
  caption?: string;
}

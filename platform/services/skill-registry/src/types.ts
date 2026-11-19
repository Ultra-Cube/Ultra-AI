// [UCUBETECH-COPYRIGHT]
// Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
// Developed by Ultra Zone Team — ultra-zone.ucubetech.com
// GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved

export interface SkillFrontmatter {
  name: string;
  description: string;
  platforms?: string[];
  version?: string;
}

export interface RegisteredSkill extends SkillFrontmatter {
  id: string;
  path: string;
  scopes: string[];
  signature?: string;
  signatureKeyId?: string;
  registeredAt: string;
  packDir?: string;
}

export interface SkillPackManifest {
  pack: string;
  version: string;
  skills: string[];
  signature?: string;
  signatureKeyId?: string;
}

export type SkillSource = 'scan' | 'import' | 'register';

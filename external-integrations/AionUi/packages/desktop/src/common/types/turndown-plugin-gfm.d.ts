// [UCUBETECH-COPYRIGHT]
// Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
// Developed by Ultra Zone Team — ultra-zone.ucubetech.com
// GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved

declare module 'turndown-plugin-gfm' {
  import type TurndownService from 'turndown';

  export function gfm(service: TurndownService): void;
  export function strikethrough(service: TurndownService): void;
  export function tables(service: TurndownService): void;
  export function taskListItems(service: TurndownService): void;
}

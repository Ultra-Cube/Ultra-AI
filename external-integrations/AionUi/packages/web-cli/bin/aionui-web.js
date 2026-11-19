#!/usr/bin/env node
// [UCUBETECH-COPYRIGHT]
// Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
// Developed by Ultra Zone Team — ultra-zone.ucubetech.com
// GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved

import('../src/index.js').catch((err) => {
  console.error('Failed to start aionui-web:', err);
  process.exit(1);
});

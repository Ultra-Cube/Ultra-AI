// [UCUBETECH-COPYRIGHT]
// Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
// Developed by Ultra Zone Team — ultra-zone.ucubetech.com
// GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved

// Side-effect module. Import this as the FIRST import in src/process/index.ts.
import { registerPlatformServices } from './index';
import { ElectronPlatformServices } from './ElectronPlatformServices';

registerPlatformServices(new ElectronPlatformServices());

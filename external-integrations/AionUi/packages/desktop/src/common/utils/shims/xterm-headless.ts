// [UCUBETECH-COPYRIGHT]
// Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
// Developed by Ultra Zone Team — ultra-zone.ucubetech.com
// GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved

// Use a path that won't be caught by the @xterm/headless alias
// eslint-disable-next-line @typescript-eslint/no-var-requires
const xtermHeadless = require('@xterm/headless/lib-headless/xterm-headless.js');
const Terminal = xtermHeadless.Terminal;

export { Terminal };
export default { Terminal };

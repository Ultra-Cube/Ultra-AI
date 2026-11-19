// [UCUBETECH-COPYRIGHT]
// Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
// Developed by Ultra Zone Team — ultra-zone.ucubetech.com
// GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved

/**
 * Hello World Extension — Activation lifecycle hook.
 * Called when the extension is enabled.
 *
 * @param {Object} context - Lifecycle context
 * @param {string} context.extensionName - Name of the extension
 * @param {string} context.extensionDir - Directory of the extension
 * @param {string} context.version - Version of the extension
 */
module.exports = function onActivate(context) {
  console.log(`[hello-world] Extension activated! v${context.version}`);
  console.log(`[hello-world] Extension directory: ${context.extensionDir}`);
};

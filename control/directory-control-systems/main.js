#!/usr/bin/env node
// [UCUBETECH-COPYRIGHT]
// Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
// Developed by Ultra Zone Team — ultra-zone.ucubetech.com
// GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved

/**
 * DIRECTORY CONTROL SYSTEMS — Ultra-AI central control entrypoint
 * Dispatches to the 4 specialized controllers:
 *   distribution | environment | infrastructure | platform | system | directory
 */
'use strict';

const path = require('path');
const DistributionController = require('./controllers/distribution-controller');
const EnvironmentsController = require('./controllers/environments-controller');
const InfrastructureController = require('./controllers/infrastructure-controller');
const PlatformController = require('./controllers/platform-controller');

const controllers = {
  distribution: new DistributionController(),
  environment: new EnvironmentsController(),
  infrastructure: new InfrastructureController(),
  platform: new PlatformController(),
};

const USAGE = `Usage: node main.js <domain> <command> [args]

Domains:
  distribution    status | build [component] | package <component> [version]
  environment     status | switch <name> | validate [name] | sync | backup
  infrastructure  status | automation [action] [script] | kubernetes [action]
                  | terraform [action] [workspace] | testing [action] [type]
  platform        status | start [component|all] | stop [component|all] | build [component|all]
  system          check          — full system health across all domains
  directory       status         — directory-level status summary
`;

function out(obj) {
  console.log(JSON.stringify(obj, null, 2));
}

async function runDomain(domain, command, args) {
  const c = controllers[domain];
  if (!c) throw new Error(`unknown domain '${domain}'`);
  switch (domain) {
    case 'distribution':
      if (command === 'status') return c.getStatus();
      if (command === 'build') return c.buildDistribution(args[0] || 'all');
      if (command === 'package') return c.packageApplication(args[0], args[1] || null);
      if (command === 'health') return c.healthCheck();
      break;
    case 'environment':
      if (command === 'status') return c.getStatus();
      if (command === 'switch') return c.switchEnvironment(args[0]);
      if (command === 'validate') return c.validateEnvironment(args[0] || null);
      if (command === 'sync') return c.syncEnvironments();
      if (command === 'backup') return c.backupEnvironments();
      if (command === 'health') return c.healthCheck();
      break;
    case 'infrastructure':
      if (command === 'status' || !command) return c.getStatus();
      if (command === 'automation') return c.manageAutomation(args[0] || 'status', args[1] || null);
      if (command === 'kubernetes') return c.manageKubernetes(args[0] || 'status', args[1] || null);
      if (command === 'terraform') return c.manageTerraform(args[0] || 'status', args[1] || null);
      if (command === 'testing') return c.manageTesting(args[0] || 'status', args[1] || null);
      if (command === 'health') return c.healthCheck();
      break;
    case 'platform':
      if (command === 'status') return c.getStatus();
      if (command === 'start') return args[0] ? c.startComponent(args[0]) : c.startAllComponents();
      if (command === 'stop') return args[0] ? c.stopComponent(args[0]) : c.stopAllComponents();
      if (command === 'build') return args[0] ? c.buildComponent(args[0]) : c.buildAllComponents();
      if (command === 'health') return c.healthCheck();
      break;
  }
  throw new Error(`unknown command '${domain} ${command || ''}'`);
}

async function systemCheck() {
  const results = {};
  for (const [name, c] of Object.entries(controllers)) {
    try {
      results[name] = await c.healthCheck();
    } catch (err) {
      results[name] = { healthy: false, error: err.message };
    }
  }
  return { system: 'directory-control-systems', timestamp: new Date().toISOString(), domains: results };
}

async function directoryStatus() {
  const results = {};
  for (const [name, c] of Object.entries(controllers)) {
    try {
      results[name] = await c.getStatus();
    } catch (err) {
      results[name] = { error: err.message };
    }
  }
  return { directory: path.resolve(__dirname, '..'), timestamp: new Date().toISOString(), controllers: results };
}

async function main() {
  const [, , domain, command, ...args] = process.argv;
  if (!domain || domain === 'help' || domain === '--help' || domain === '-h') {
    console.log(USAGE);
    process.exit(domain ? 0 : 1);
  }
  try {
    if (domain === 'system' && command === 'check') return out(await systemCheck());
    if (domain === 'directory' && command === 'status') return out(await directoryStatus());
    out(await runDomain(domain, command, args));
  } catch (err) {
    console.error(`ERROR: ${err.message}`);
    console.log(USAGE);
    process.exit(1);
  }
}

main();

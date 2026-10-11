#!/usr/bin/env node
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { installAll, uninstallAll, availableAgents } = require('../src/agents');

const DEFAULT_CONFIG = { windowSize: 6, loopThreshold: 4, similarityThreshold: 0.78, enabled: true };
const dataDir = path.join(os.homedir(), '.agent-stuck-detector');
const configPath = path.join(dataDir, 'config.json');

function setup({ announce = false } = {}) {
  fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(configPath)) fs.writeFileSync(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2) + '\n');
  const installed = installAll(path.join(__dirname, '..'));
  if (announce) console.log(`agent-stuck-detector is installed globally. Configured: ${installed.map((agent) => agent.name).join(', ')}.`);
  return installed;
}

function uninstall({ announce = false } = {}) {
  uninstallAll();
  if (announce) console.log('agent-stuck-detector integrations removed. Logs and config were kept.');
}

if (require.main === module) setup({ announce: true });
module.exports = { setup, uninstall, DEFAULT_CONFIG, configPath, availableAgents };

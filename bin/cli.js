#!/usr/bin/env node
const { setup, uninstall } = require('./setup');

const command = process.argv[2] || 'setup';
if (command === 'setup') {
  setup({ announce: true });
} else if (command === 'uninstall') {
  uninstall({ announce: true });
} else if (command === 'agents') {
  console.log('Supported agents:');
  for (const agent of require('./setup').availableAgents()) console.log(`- ${agent}`);
} else {
  console.error(`Unknown command: ${command}`);
  process.exitCode = 1;
}

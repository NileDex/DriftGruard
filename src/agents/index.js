const claudeCode = require('./claude-code');

// Add future integrations here. The detector core and storage are shared by all adapters.
const adapters = [claudeCode];

function availableAgents() { return adapters.map(({ name }) => name); }
function installAll(packageRoot) { return adapters.map((adapter) => adapter.install(packageRoot)); }
function uninstallAll() { return adapters.map((adapter) => adapter.uninstall()); }

module.exports = { adapters, availableAgents, installAll, uninstallAll };

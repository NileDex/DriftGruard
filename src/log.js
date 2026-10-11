const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { projectId, resolveProjectPath } = require('./projectId');

function configPath() { return path.join(os.homedir(), '.agent-stuck-detector', 'config.json'); }
function readConfig() {
  const defaults = { windowSize: 6, loopThreshold: 4, similarityThreshold: 0.78, enabled: true };
  try { return { ...defaults, ...JSON.parse(fs.readFileSync(configPath(), 'utf8')) }; } catch { return defaults; }
}
function logPath(cwd) { return path.join(os.homedir(), '.agent-stuck-detector', projectId(cwd), 'history.json'); }
function readHistory(cwd) {
  try {
    const value = JSON.parse(fs.readFileSync(logPath(cwd), 'utf8'));
    return Array.isArray(value) ? value : [];
  } catch { return []; }
}
function appendRecord(cwd, record, windowSize = readConfig().windowSize) {
  const file = logPath(cwd);
  const history = [...readHistory(cwd), { ...record, projectPath: resolveProjectPath(cwd) }].slice(-Math.max(1, Number(windowSize) || 6));
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(history, null, 2) + '\n');
  return history;
}
module.exports = { configPath, readConfig, logPath, readHistory, appendRecord };

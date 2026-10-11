const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const MARKER = 'agent-stuck-detector';

function settingsPath() {
  return path.join(os.homedir(), '.claude', 'settings.json');
}

function hookCommand(packageRoot) {
  return `node "${path.join(packageRoot, 'src', 'hook.js')}"`;
}

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}

function isOurs(hook) {
  return hook && (hook._agentStuckDetector === MARKER || (typeof hook.command === 'string' && hook.command.includes(MARKER)));
}

function install(packageRoot) {
  const file = settingsPath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const settings = readJson(file, {});
  if (!settings.hooks || typeof settings.hooks !== 'object') settings.hooks = {};
  const command = hookCommand(packageRoot);

  for (const eventName of ['PostToolUse', 'PostToolUseFailure']) {
    if (!Array.isArray(settings.hooks[eventName])) settings.hooks[eventName] = [];
    let group = settings.hooks[eventName].find((entry) => entry && Array.isArray(entry.hooks) && entry.hooks.some(isOurs));
    if (!group) {
      group = { matcher: '', hooks: [{ type: 'command', command, timeout: 10, _agentStuckDetector: MARKER }] };
      settings.hooks[eventName].push(group);
    } else if (!group.hooks.some(isOurs)) {
      group.hooks.push({ type: 'command', command, timeout: 10, _agentStuckDetector: MARKER });
    }
  }
  fs.writeFileSync(file, JSON.stringify(settings, null, 2) + '\n');
  return { name: 'Claude Code', settingsPath: file };
}

function uninstall() {
  const file = settingsPath();
  const settings = readJson(file, null);
  if (!settings?.hooks) return false;
  for (const eventName of ['PostToolUse', 'PostToolUseFailure']) {
    if (!Array.isArray(settings.hooks[eventName])) continue;
    settings.hooks[eventName] = settings.hooks[eventName]
      .map((group) => ({ ...group, hooks: Array.isArray(group.hooks) ? group.hooks.filter((hook) => !isOurs(hook)) : group.hooks }))
      .filter((group) => !(Array.isArray(group.hooks) && group.hooks.length === 0));
    if (!settings.hooks[eventName].length) delete settings.hooks[eventName];
  }
  fs.writeFileSync(file, JSON.stringify(settings, null, 2) + '\n');
  return true;
}

module.exports = { name: 'Claude Code', install, uninstall, settingsPath, MARKER };

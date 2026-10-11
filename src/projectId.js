const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

function resolveProjectPath(cwd = process.cwd()) {
  const absolute = path.resolve(cwd);
  try { return fs.realpathSync(absolute); } catch { return absolute; }
}

function projectId(cwd = process.cwd()) {
  return crypto.createHash('sha256').update(resolveProjectPath(cwd)).digest('hex').slice(0, 16);
}

module.exports = { resolveProjectPath, projectId };

#!/usr/bin/env node
const fs = require('node:fs');
const { readConfig, appendRecord } = require('./log');
const { resolveProjectPath } = require('./projectId');
const { detectsLoop } = require('./similarity');

const MESSAGE = "You've repeated a very similar approach several times without success. Consider stepping back and trying a different strategy, or asking the user for input.";

function asText(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  try { return JSON.stringify(value); } catch { return String(value); }
}
function hasError(event) {
  const response = event.tool_response ?? event.tool_result ?? event.result;
  const text = asText(response).toLowerCase();
  return event.hook_event_name === 'PostToolUseFailure' || event.error || event.exit_code > 0 || response?.is_error === true || /\b(error|failed|failure|exception|exit code [1-9])\b/.test(text);
}
function hasRealChange(event, failed) {
  if (failed) return false;
  const input = event.tool_input || {};
  if (input.old_string !== undefined && input.new_string !== undefined) return input.old_string !== input.new_string;
  const response = asText(event.tool_response ?? event.tool_result ?? event.result);
  if (/\b(no changes?|unchanged|already up to date|nothing to do)\b/i.test(response)) return false;
  return true;
}
function summarize(event) {
  const input = event.tool_input || {};
  const command = input.command || input.cmd || '';
  const files = [input.file_path, ...(Array.isArray(input.file_paths) ? input.file_paths : [])].filter(Boolean).join(', ');
  return [event.tool_name || event.tool || 'unknown tool', files && `files: ${files}`, command && `command: ${command}`].filter(Boolean).join(' | ').slice(0, 1000);
}
function readStdin() {
  try { return fs.readFileSync(0, 'utf8'); } catch { return ''; }
}
function run(event) {
  const cwd = resolveProjectPath(event.cwd || process.cwd());
  if (fs.existsSync(require('node:path').join(cwd, '.agent-stuck-detector-ignore'))) return false;
  const config = readConfig();
  if (config.enabled === false) return false;
  const failed = Boolean(hasError(event));
  const input = event.tool_input || {};
  const response = event.tool_response ?? event.tool_result ?? event.result ?? event.error ?? '';
  const record = {
    timestamp: new Date().toISOString(),
    actionSummary: summarize(event),
    resultSummary: asText(response).slice(0, 2000),
    diff: asText(input.diff || event.diff || '').slice(0, 3000),
    command: asText(input.command || '').slice(0, 1000),
    failed,
    changed: hasRealChange(event, failed)
  };
  const history = appendRecord(cwd, record, config.windowSize);
  if (detectsLoop(history, config)) { console.log(MESSAGE); return true; }
  return false;
}

if (require.main === module) {
  try { run(JSON.parse(readStdin() || '{}')); } catch { /* Hooks must never disrupt Claude Code. */ }
}
module.exports = { run, MESSAGE, hasError, hasRealChange, summarize };

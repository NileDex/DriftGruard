const test = require('node:test');
const assert = require('node:assert/strict');
const { similarity, detectsLoop } = require('../src/similarity');

const repeated = (n = 4) => Array.from({ length: n }, (_, i) => ({
  actionSummary: 'edit src/parser.js',
  resultSummary: 'SyntaxError unexpected token near line 42',
  diff: '- const value = ;',
  failed: true,
  changed: false,
  attempt: i
}));

test('similarity is high for repeated error and diff text', () => {
  assert.ok(similarity('SyntaxError near line 42', 'SyntaxError near line 42') > 0.99);
  assert.ok(similarity('- const value = ;', '- const value = ;') > 0.99);
});
test('detects a consecutive repeated failed approach', () => {
  assert.equal(detectsLoop(repeated()), true);
});
test('does not flag a successful change or unrelated attempt', () => {
  const records = repeated(); records[3].failed = false; records[3].changed = true;
  assert.equal(detectsLoop(records), false);
  const unrelated = repeated(); unrelated[3].resultSummary = 'Permission denied writing package.json';
  assert.equal(detectsLoop(unrelated), false);
});

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { resolveProjectPath, projectId } = require('../src/projectId');

test('resolves equivalent relative paths to the same project path and id', () => {
  const here = resolveProjectPath(__dirname);
  assert.equal(resolveProjectPath(path.join(__dirname, '.')), here);
  assert.equal(projectId(__dirname), projectId(path.join(__dirname, '.')));
});
test('different project paths have different ids', () => {
  assert.notEqual(projectId(path.join(__dirname, 'a')), projectId(path.join(__dirname, 'b')));
});

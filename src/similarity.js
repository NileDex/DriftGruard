function normalize(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9_./\\:-]+/g, ' ').replace(/\s+/g, ' ').trim();
}
function tokens(value) { return new Set(normalize(value).split(' ').filter(Boolean)); }
function similarity(a, b) {
  const left = tokens(a), right = tokens(b);
  if (!left.size && !right.size) return 1;
  if (!left.size || !right.size) return 0;
  let overlap = 0;
  for (const token of left) if (right.has(token)) overlap++;
  return overlap / (left.size + right.size - overlap);
}
function recordText(record) {
  return [record.actionSummary, record.resultSummary, record.diff, record.command].filter(Boolean).join(' ');
}
function isFailed(record) { return record && (record.failed === true || record.changed === false); }
function detectsLoop(history, { loopThreshold = 4, similarityThreshold = 0.78 } = {}) {
  const count = Math.max(2, Number(loopThreshold) || 4);
  if (!Array.isArray(history) || history.length < count) return false;
  const recent = history.slice(-count);
  if (!recent.every(isFailed)) return false;
  for (let i = 1; i < recent.length; i++) {
    if (similarity(recordText(recent[i - 1]), recordText(recent[i])) < similarityThreshold) return false;
  }
  return true;
}
module.exports = { normalize, similarity, detectsLoop, recordText };

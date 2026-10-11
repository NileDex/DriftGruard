# agent-stuck-detector

`agent-stuck-detector` watches AI coding-agent tool results and quietly notices when an agent is repeating nearly the same failed approach. The detector core is agent-agnostic; Claude Code is the first supported integration. When a loop is detected, it prints one short advisory into the active agent’s context.

It is local-only: there is no telemetry, network call, UI, or model request.

## Install

```sh
npm install -g agent-stuck-detector
```

The install runs setup automatically. To repeat setup later:

```sh
agent-stuck-detector setup
```

Setup configures every supported agent integration globally. In version 1, that is Claude Code: it creates or updates `~/.claude/settings.json`, adds `PostToolUse` and `PostToolUseFailure` handlers, preserves existing settings and hooks, and is safe to run more than once. Use `/hooks` in Claude Code to confirm the handlers are present. Run `agent-stuck-detector agents` to see supported integrations.

There is no universal hook standard shared by all coding agents. Future integrations will be added as adapters without changing the detector core or project logs; unsupported agents are not silently claimed to work.

The detector’s config is created at `~/.agent-stuck-detector/config.json`:

```json
{
  "windowSize": 6,
  "loopThreshold": 4,
  "similarityThreshold": 0.78,
  "enabled": true
}
```

`windowSize` is the number of recent records kept per project. `loopThreshold` is the number of consecutive records needed to trigger. `similarityThreshold` is the minimum token-overlap score between neighboring attempts. The default `0.78` is deliberately conservative: changing a line number or adding a small detail should still count as the same approach, while a genuinely different error or strategy should not. Set `enabled` to `false` to disable globally.

## Per-project disable

Create an empty `.agent-stuck-detector-ignore` file in a project root (the directory Claude Code reports as its working directory). That project is skipped without changing the global installation.

Logs are stored separately under `~/.agent-stuck-detector/<project-hash>/history.json`; the hash is derived from the resolved project path. Each log is capped at `windowSize` records.

## How detection works

Every tool event is reduced to a compact local record containing the timestamp, tool/files/command summary, result or error text, diff text when available, and whether it failed or made a real change. Text is normalized and compared using simple token Jaccard similarity. If the latest `loopThreshold` records all failed (or made no real change) and every neighboring pair is at least `similarityThreshold` similar, the hook emits:

> You've repeated a very similar approach several times without success. Consider stepping back and trying a different strategy, or asking the user for input.

The hook catches all errors and exits silently so it cannot break a Claude Code workflow.

## Uninstall and cleanup

Before removing the npm package, remove only the detector’s global integrations:

```sh
agent-stuck-detector uninstall
npm uninstall -g agent-stuck-detector
```

Uninstall removes the detector entries from `~/.claude/settings.json` and leaves the config and logs in place. Delete `~/.agent-stuck-detector` yourself only if you also want to remove the saved history and settings.

## Development and manual testing

Run the tests with:

```sh
npm test
```

Phase checks:

1. Setup: run `node bin/setup.js`, inspect `~/.claude/settings.json`, add an unrelated hook, run setup again, and confirm both remain. Run `node bin/setup.js` twice and confirm the detector is not duplicated.
2. Logs and similarity: run `npm test`. The tests cover repeated example syntax errors/diffs, unrelated attempts, successful changes, and stable project IDs.
3. End to end: create two temporary project directories, set `USERPROFILE`/`HOME` to a temporary home for the test, and invoke `node src/hook.js` four times with the same failed PostToolUse JSON for project A and three times for project B. Project A should print the advisory; each project should have a different `history.json` under the detector data directory.

To feed a real event manually on macOS/Linux:

```sh
printf '%s' '{"cwd":"/path/to/project","tool_name":"Bash","tool_input":{"command":"npm test"},"tool_response":"Error: test failed"}' | node src/hook.js
```

On Windows, pipe equivalent JSON from PowerShell with `ConvertTo-Json` or invoke `node src/hook.js` from a saved test input. Claude Code itself supplies the event JSON on every configured hook call.

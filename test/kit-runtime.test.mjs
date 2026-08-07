import assert from "node:assert/strict";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

const repositoryRoot = resolve(import.meta.dirname, "..");

function nodeStartupCommand() {
  const spec = readFileSync(resolve(repositoryRoot, "kits/language/node-npm/spec.yaml"), "utf8");
  const lines = spec.split("\n");
  const blockStart = lines.findIndex((line) => line.trim() === "- |") + 1;
  const blockEnd = lines.findIndex(
    (line, index) => index > blockStart && line.trimStart().startsWith("user:"),
  );

  assert(blockStart > 0, "node startup command block was not found");
  assert(blockEnd > blockStart, "node startup command block has no user boundary");
  return `${lines
    .slice(blockStart, blockEnd)
    .map((line) => line.slice(10))
    .join("\n")}\n`;
}

function runtimeFixture(t, { mounted = false } = {}) {
  const root = mkdtempSync(join(tmpdir(), "sbx-kits-node-runtime-"));
  t.after(() => rmSync(root, { force: true, recursive: true }));
  const bin = join(root, "bin");
  const workspace = join(root, "workspace");
  const marker = join(root, "mounted");
  const log = join(root, "commands.log");
  mkdirSync(bin);
  mkdirSync(workspace);
  writeFileSync(log, "");
  if (mounted) writeFileSync(marker, "");

  const commands = {
    install: `last=''
for argument in "$@"; do last=$argument; done
printf 'install %s\n' "$*" >>"$COMMAND_LOG"`,
    mount: `printf 'mount %s\n' "$*" >>"$COMMAND_LOG"
: >"$MOUNT_MARKER"`,
    mountpoint: `[ -f "$MOUNT_MARKER" ]`,
    sha256sum: `cat >/dev/null
printf 'fixture-workspace-id  -\n'`,
  };
  for (const [name, body] of Object.entries(commands)) {
    const path = join(bin, name);
    writeFileSync(path, `#!/bin/sh\n${body}\n`);
    chmodSync(path, 0o755);
  }

  return {
    log,
    workspace,
    env: {
      ...process.env,
      COMMAND_LOG: log,
      MOUNT_MARKER: marker,
      PATH: `${bin}:/usr/bin:/bin`,
      WORKSPACE_DIR: workspace,
    },
  };
}

test("node kit startup mounts sandbox-local storage over workspace node_modules", (t) => {
  const { env, log, workspace } = runtimeFixture(t);
  const result = spawnSync("/bin/bash", ["-c", nodeStartupCommand()], { encoding: "utf8", env });

  assert.equal(result.status, 0, result.stderr);
  const commands = readFileSync(log, "utf8").trim().split("\n");
  assert(
    commands.includes(
      "install -d -o 1000 -g 1000 /home/agent/.cache/node-bind-mounts/fixture-workspace-id/node_modules",
    ),
  );
  assert(
    commands.includes(
      `mount --bind /home/agent/.cache/node-bind-mounts/fixture-workspace-id/node_modules ${workspace}/node_modules`,
    ),
  );
});

test("node kit startup is idempotent when node_modules is already mounted", (t) => {
  const { env, log } = runtimeFixture(t, { mounted: true });
  const result = spawnSync("/bin/bash", ["-c", nodeStartupCommand()], { encoding: "utf8", env });

  assert.equal(result.status, 0, result.stderr);
  assert.equal(readFileSync(log, "utf8"), "");
});

test("node kit startup requires the sandbox workspace location", (t) => {
  const { env } = runtimeFixture(t);
  delete env.WORKSPACE_DIR;
  const result = spawnSync("/bin/bash", ["-c", nodeStartupCommand()], { encoding: "utf8", env });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /WORKSPACE_DIR must be set/);
});

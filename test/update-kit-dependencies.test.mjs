import assert from "node:assert/strict";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { after, test } from "node:test";

import {
  parsePublishedVersion,
  updateKitDependency,
  updatePinnedVersion,
} from "../.github/scripts/update-kit-dependencies.mjs";

const temporaryDirectories = [];

after(() => {
  for (const directory of temporaryDirectories) rmSync(directory, { force: true, recursive: true });
});

function temporaryDirectory(prefix) {
  const directory = mkdtempSync(join(tmpdir(), prefix));
  temporaryDirectories.push(directory);
  return directory;
}

function spec(version = "0.147.0") {
  return `commands:\n  install:\n    - command: npm install --global @openai/codex@${version}\n`;
}

test("parses a published version returned by npm", () => {
  assert.equal(parsePublishedVersion('"0.148.0"\n'), "0.148.0");
});

test("rejects malformed registry output", () => {
  assert.throws(
    () => parsePublishedVersion("not json"),
    /Could not parse the published @openai\/codex version/,
  );
  assert.throws(() => parsePublishedVersion('["0.148.0"]'), /Expected one published/);
  assert.throws(() => parsePublishedVersion('"latest"'), /Expected one published/);
});

test("updates exactly one semantic-version pin", () => {
  assert.deepEqual(updatePinnedVersion(spec(), "0.148.0"), {
    changed: true,
    pinnedVersion: "0.147.0",
    spec: spec("0.148.0"),
  });

  assert.equal(
    updatePinnedVersion(spec("0.148.0-beta.1"), "0.148.0").pinnedVersion,
    "0.148.0-beta.1",
  );
});

test("rejects missing and duplicate pins", () => {
  assert.throws(() => updatePinnedVersion("commands: {}\n", "0.148.0"), /found 0/);
  assert.throws(() => updatePinnedVersion(`${spec()}${spec("0.146.0")}`, "0.148.0"), /found 2/);
});

test("escapes a custom package name when matching its pin", () => {
  const result = updatePinnedVersion("tool+name@1.2.3\n", "1.2.4", "tool+name");
  assert.equal(result.spec, "tool+name@1.2.4\n");
});

test("reports a current pin without writing", () => {
  const messages = [];
  const writes = [];
  const result = updateKitDependency({
    execFile(command, args, options) {
      assert.equal(command, "npm");
      assert.deepEqual(args, ["view", "@openai/codex", "version", "--json"]);
      assert.deepEqual(options, { encoding: "utf8" });
      return '"0.147.0"';
    },
    log: (message) => messages.push(message),
    readFile: () => spec(),
    writeFile: (...args) => writes.push(args),
  });

  assert.equal(result.changed, false);
  assert.deepEqual(writes, []);
  assert.deepEqual(messages, ["@openai/codex is already pinned to 0.147.0"]);
});

test("writes and reports an available update", () => {
  const messages = [];
  const writes = [];
  const result = updateKitDependency({
    execFile: () => '"0.148.0"',
    log: (message) => messages.push(message),
    readFile(path, encoding) {
      assert.equal(path, "fixture/spec.yaml");
      assert.equal(encoding, "utf8");
      return spec();
    },
    specPath: "fixture/spec.yaml",
    writeFile: (...args) => writes.push(args),
  });

  assert.equal(result.changed, true);
  assert.deepEqual(writes, [["fixture/spec.yaml", spec("0.148.0")]]);
  assert.deepEqual(messages, ["Updated @openai/codex from 0.147.0 to 0.148.0"]);
});

test("propagates registry and write failures", () => {
  const registryFailure = new Error("registry unavailable");
  assert.throws(
    () =>
      updateKitDependency({
        execFile: () => {
          throw registryFailure;
        },
      }),
    (error) => error === registryFailure,
  );

  const writeFailure = new Error("read-only filesystem");
  assert.throws(
    () =>
      updateKitDependency({
        execFile: () => '"0.148.0"',
        log: () => {},
        readFile: () => spec(),
        writeFile: () => {
          throw writeFailure;
        },
      }),
    (error) => error === writeFailure,
  );
});

test("command-line updater uses npm output without a live registry request", () => {
  const root = temporaryDirectory("sbx-kits-updater-cli-");
  const bin = join(root, "bin");
  const specPath = join(root, "kits/harness/codex/spec.yaml");
  mkdirSync(bin, { recursive: true });
  mkdirSync(dirname(specPath), { recursive: true });
  writeFileSync(specPath, spec());
  writeFileSync(join(bin, "npm"), "#!/bin/sh\nprintf '\"0.148.0\"\\n'\n");
  chmodSync(join(bin, "npm"), 0o755);

  const updater = resolve(".github/scripts/update-kit-dependencies.mjs");
  const result = spawnSync(process.execPath, [updater], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, PATH: `${bin}:${process.env.PATH}` },
  });

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, "Updated @openai/codex from 0.147.0 to 0.148.0\n");
  assert.equal(readFileSync(specPath, "utf8"), spec("0.148.0"));
});

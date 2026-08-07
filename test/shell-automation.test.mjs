import assert from "node:assert/strict";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

const repositoryRoot = resolve(import.meta.dirname, "..");

function fixture(t, prefix) {
  const root = mkdtempSync(join(tmpdir(), prefix));
  t.after(() => rmSync(root, { force: true, recursive: true }));
  return root;
}

function executable(path, contents) {
  writeFileSync(path, contents);
  chmodSync(path, 0o755);
}

function runBash(script, args = [], options = {}) {
  return spawnSync("/bin/bash", [script, ...args], {
    encoding: "utf8",
    ...options,
  });
}

function sandboxEnvironment(t, { inspectResult = 0 } = {}) {
  const root = fixture(t, "sbx-kits-sandbox-test-");
  const bin = join(root, "bin");
  const log = join(root, "sbx.log");
  mkdirSync(bin);
  writeFileSync(log, "");
  executable(
    join(bin, "sbx"),
    `#!/bin/sh
printf '%s|%s\n' "\${DOCKER_SANDBOXES_KIT_ALLOWED_SOURCES-}" "$*" >>"$SBX_LOG"
if [ "$1" = inspect ]; then exit "\${SBX_INSPECT_RESULT:-0}"; fi
exit 0
`,
  );
  return {
    log,
    env: {
      ...process.env,
      PATH: `${bin}:/usr/bin:/bin`,
      SBX_INSPECT_RESULT: String(inspectResult),
      SBX_LOG: log,
    },
  };
}

test("sandbox orchestration fails clearly when sbx is unavailable", () => {
  const result = runBash(resolve(repositoryRoot, ".docker-sbx/sandbox.sh"), ["validate"], {
    env: { ...process.env, PATH: "/usr/bin:/bin" },
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Docker Sandbox \(sbx\) is required/);
});

test("sandbox validation checks the community kit and every public repository kit", (t) => {
  const { env, log } = sandboxEnvironment(t);
  const result = runBash(resolve(repositoryRoot, ".docker-sbx/sandbox.sh"), ["validate"], { env });

  assert.equal(result.status, 0, result.stderr);
  const calls = readFileSync(log, "utf8").trim().split("\n");
  assert.equal(calls.length, 9);
  assert(calls[0].startsWith('["docker.io/","github.com/docker/"]|kit validate '));
  assert(calls.slice(1).every((call) => call.startsWith("|kit validate ")));
  assert(calls.some((call) => call.includes("sbx-kits-contrib.git#ref=v0.12.0&dir=mise")));
  assert(calls.some((call) => call.endsWith("kits/language/python-uv")));
  assert(calls.some((call) => call.endsWith("kits/mise/network-zig")));
});

test("sandbox rebuild replaces an existing sandbox and configures the workspace", (t) => {
  const { env, log } = sandboxEnvironment(t);
  const result = runBash(resolve(repositoryRoot, ".docker-sbx/sandbox.sh"), ["rebuild"], { env });

  assert.equal(result.status, 0, result.stderr);
  const calls = readFileSync(log, "utf8").trim().split("\n");
  assert(calls.some((call) => call.endsWith("|inspect sbx-kits")));
  assert(calls.some((call) => call.endsWith("|rm --force sbx-kits")));
  assert(calls.some((call) => call.includes("|create --name sbx-kits")));
  assert(calls.some((call) => call.includes("sbx-validator")));
  assert(calls.some((call) => call.endsWith("sbx-kits mise trust")));
  assert(calls.some((call) => call.endsWith("sbx-kits mise run setup")));
});

test("sandbox rebuild does not remove a sandbox that is absent", (t) => {
  const { env, log } = sandboxEnvironment(t, { inspectResult: 1 });
  const result = runBash(resolve(repositoryRoot, ".docker-sbx/sandbox.sh"), ["rebuild"], { env });

  assert.equal(result.status, 0, result.stderr);
  assert(!readFileSync(log, "utf8").includes("|rm --force"));
});

test("sandbox attach performs setup before handing off to sbx run", (t) => {
  const { env, log } = sandboxEnvironment(t);
  const result = runBash(resolve(repositoryRoot, ".docker-sbx/sandbox.sh"), ["attach"], { env });

  assert.equal(result.status, 0, result.stderr);
  const calls = readFileSync(log, "utf8").trim().split("\n");
  assert(calls.at(-1).endsWith("|run --name sbx-kits"));
});

test("sandbox orchestration rejects unknown actions", (t) => {
  const { env } = sandboxEnvironment(t);
  const result = runBash(resolve(repositoryRoot, ".docker-sbx/sandbox.sh"), ["unknown"], { env });

  assert.equal(result.status, 2);
  assert.match(result.stderr, /usage: .* <attach\|rebuild\|validate>/);
});

function hookEnvironment(t, { withDependencies = true } = {}) {
  const root = fixture(t, "sbx-kits-hook-test-");
  const repository = join(root, "repository");
  const bin = join(root, "bin");
  const log = join(root, "commands.log");
  mkdirSync(repository);
  mkdirSync(bin);
  writeFileSync(log, "");
  if (withDependencies) mkdirSync(join(repository, "node_modules"));

  executable(
    join(bin, "git"),
    `#!/bin/sh
if [ "$1 $2" = "rev-parse --show-toplevel" ]; then printf '%s\n' "$FAKE_REPOSITORY"; exit 0; fi
printf 'git %s\n' "$*" >>"$COMMAND_LOG"
exit 0
`,
  );
  for (const command of ["mise", "npm", "tar"]) {
    executable(
      join(bin, command),
      `#!/bin/sh
printf '${command} %s\n' "$*" >>"$COMMAND_LOG"
exit 0
`,
    );
  }

  return {
    log,
    repository,
    env: {
      ...process.env,
      COMMAND_LOG: log,
      FAKE_REPOSITORY: repository,
      PATH: `${bin}:/usr/bin:/bin`,
    },
  };
}

test("Git hook entry points delegate from the repository root", (t) => {
  const { env, log } = hookEnvironment(t);
  for (const hook of ["pre-commit", "pre-push"]) {
    const result = spawnSync(resolve(repositoryRoot, `.githooks/${hook}`), [], {
      encoding: "utf8",
      env,
    });
    assert.equal(result.status, 0, result.stderr);
  }

  assert.deepEqual(readFileSync(log, "utf8").trim().split("\n"), [
    "mise run hooks:pre-commit",
    "mise run --raw hooks:pre-push",
  ]);
});

test("pre-commit automation checks the index, formatting, and linting", (t) => {
  const { env, log } = hookEnvironment(t);
  const result = runBash(resolve(repositoryRoot, ".mise/tasks/hooks/pre-commit"), [], { env });

  assert.equal(result.status, 0, result.stderr);
  const commands = readFileSync(log, "utf8").trim().split("\n");
  assert(commands.includes("git diff --cached --check"));
  assert(commands.some((command) => command.startsWith("git checkout-index --all --prefix=")));
  assert(commands.includes("mise run fmt:check"));
  assert(commands.includes("mise run lint"));
});

test("pre-commit automation explains how to recover when dependencies are absent", (t) => {
  const { env } = hookEnvironment(t, { withDependencies: false });
  const result = runBash(resolve(repositoryRoot, ".mise/tasks/hooks/pre-commit"), [], { env });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /dependencies are missing; run mise run setup/);
});

test("pre-push automation is a no-op when no tag is being created", (t) => {
  const { env, log } = hookEnvironment(t);
  const result = runBash(resolve(repositoryRoot, ".mise/tasks/hooks/pre-push"), [], {
    env,
    input: "refs/heads/main abc refs/heads/main def\n",
  });

  assert.equal(result.status, 0, result.stderr);
  assert.equal(readFileSync(log, "utf8"), "");
});

test("pre-push automation validates each newly pushed tag snapshot", (t) => {
  const { env, log } = hookEnvironment(t);
  const result = runBash(resolve(repositoryRoot, ".mise/tasks/hooks/pre-push"), [], {
    env,
    input: "refs/tags/v1.2.3 abc refs/tags/v1.2.3 0000000000000000000000000000000000000000\n",
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Validating tag v1\.2\.3/);
  const commands = readFileSync(log, "utf8").trim().split("\n");
  assert(commands.some((command) => command.includes("git -C") && command.endsWith("archive abc")));
  assert(commands.includes("mise install"));
  assert(commands.includes("npm ci"));
  assert(commands.includes("mise run validate"));
});

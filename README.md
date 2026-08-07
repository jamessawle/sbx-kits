# sbx-kits

[![CI](https://github.com/jamessawle/sbx-kits/actions/workflows/pr-check.yml/badge.svg?branch=main)](https://github.com/jamessawle/sbx-kits/actions/workflows/pr-check.yml?query=branch%3Amain)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/jamessawle/sbx-kits/badge)](https://scorecard.dev/viewer/?uri=github.com/jamessawle/sbx-kits)
[![OpenSSF Best Practices](https://www.bestpractices.dev/projects/13983/badge)](https://www.bestpractices.dev/en/projects/13983/passing)
[![Latest release](https://img.shields.io/github/v/release/jamessawle/sbx-kits?sort=date&label=release)](https://github.com/jamessawle/sbx-kits/releases/latest)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Reusable [Docker Sandbox](https://docs.docker.com/ai/sandboxes/) (`sbx`) kits
for running coding agents in isolated environments. Each kit grants one focused
capability so projects can compose only the policy they need.

Tested with `sbx 0.35.0`.

> [!IMPORTANT]
> A kit can install software as root and expand a sandbox's network access. Pin
> trusted sources to an immutable release tag or commit, and review each kit's
> security implications before applying it.

## Getting started

### 1. Check the prerequisites

Install Docker Sandbox using the upstream
[platform instructions](https://docs.docker.com/ai/sandboxes/get-started/), sign
in, and confirm that the supported CLI is available:

```sh
sbx login
sbx version
```

You also need a local project directory and credentials for the coding agent you
intend to run. This repository currently tests `sbx 0.35.0`; other releases may
interpret the experimental kit format differently.

### 2. Select and compose kits

Start with the capability you need, then add its stated dependencies:

- Use a `language-*` kit to isolate generated project state from the
  bind-mounted host workspace. It does not install a toolchain.
- Use a `mise-network-*` kit with the community
  [Mise kit](https://github.com/docker/sbx-kits-contrib/tree/main/mise) when Mise
  must download that toolchain.
- Add `harness-codex` only when you want the repository's pinned Codex version
  instead of the version bundled with Docker Sandbox.

The [kit catalogue](#kit-catalogue) links to the capabilities, required
composition, visible behavior, security implications, and constraints of every
kit.

### 3. Pin every remote kit

A Git kit reference has two selectors:

```text
git+https://github.com/jamessawle/sbx-kits.git#ref=v2026.08.01&dir=kits/harness/codex
```

- `ref` selects a tag, branch, or commit. Prefer a release tag or commit rather
  than a moving branch.
- `dir` selects one kit directory within the repository.

Releases use CalVer tags in the form `vYYYY.MM.NN`, where `NN` is the release
sequence within the month. A release is created whenever a change under `kits/`
reaches `main`; months without kit changes have no release. Tags are immutable
snapshots of every kit in the repository. Check the latest-release badge before
copying an example if you want a newer snapshot.

### 4. Allow the publishers and create the sandbox

Remote Git kits are rejected unless their publishers are in Docker Sandbox's
allowed-sources policy. The setting replaces the whole list, so retain Docker
Hub and allow both repositories used by the example:

```sh
sbx settings set kit.allowedSources \
  '["docker.io/","github.com/docker/","github.com/jamessawle/"]'
```

From the Node.js project you want to mount, create a named Codex sandbox with a
pinned kit set and isolated `node_modules`:

```sh
sbx create --name my-project \
  --kit 'git+https://github.com/docker/sbx-kits-contrib.git#ref=v0.12.0&dir=mise' \
  --kit 'git+https://github.com/jamessawle/sbx-kits.git#ref=v2026.08.01&dir=kits/harness/codex' \
  --kit 'git+https://github.com/jamessawle/sbx-kits.git#ref=v2026.08.01&dir=kits/language/node-npm' \
  --kit 'git+https://github.com/jamessawle/sbx-kits.git#ref=v2026.08.01&dir=kits/mise/network-node' \
  codex .
```

`--kit` can be repeated: Docker Sandbox composes the mixins with the selected
agent. The final `.` bind-mounts the current project as its workspace. Quote Git
references because `&` has special meaning in shells.

Inspect the resulting kit set, then attach to the agent:

```sh
sbx inspect my-project
sbx run --name my-project
```

## Kit catalogue

### Harness

Harness kits install or override coding-agent CLIs independently of the Docker
Sandbox release.

| Kit                          | Directory            | Purpose                                                              |
| ---------------------------- | -------------------- | -------------------------------------------------------------------- |
| [Codex](kits/harness/codex/) | `kits/harness/codex` | Pins Codex independently of the version bundled with Docker Sandbox. |

### Language

Language kits isolate platform-specific project state from the bind-mounted
host workspace. They can be used independently when their toolchain is already
available.

| Kit                                     | Directory                 | Purpose                                                          |
| --------------------------------------- | ------------------------- | ---------------------------------------------------------------- |
| [Node & npm](kits/language/node-npm/)   | `kits/language/node-npm`  | Isolates Linux `node_modules` and permits npm package downloads. |
| [Python & uv](kits/language/python-uv/) | `kits/language/python-uv` | Isolates Python generated state and permits package downloads.   |

### Mise network

Mise network kits grant the additional hosts required to resolve and install a
specific toolchain. Compose them with the community
[Mise kit](https://github.com/docker/sbx-kits-contrib/tree/main/mise).

| Kit                                                 | Directory                     | Purpose                                                       |
| --------------------------------------------------- | ----------------------------- | ------------------------------------------------------------- |
| [Go Network](kits/mise/network-go/)                 | `kits/mise/network-go`        | Permits Go toolchain, module, and checksum downloads.         |
| [Hugo Network](kits/mise/network-hugo/)             | `kits/mise/network-hugo`      | Permits Hugo Extended version resolution.                     |
| [Node.js Network](kits/mise/network-node/)          | `kits/mise/network-node`      | Permits Node.js toolchain and npm package downloads.          |
| [Python & uv Network](kits/mise/network-python-uv/) | `kits/mise/network-python-uv` | Permits Python, uv, Pyright toolchain, and package downloads. |
| [Zig Network](kits/mise/network-zig/)               | `kits/mise/network-zig`       | Permits Zig toolchain downloads.                              |

## `spec.yaml` reference

Each catalogue directory is a mixin kit whose canonical machine-readable
definition is `spec.yaml`. The
[upstream kit reference](https://docs.docker.com/ai/sandboxes/customize/kit-reference/)
documents the complete experimental format; this section explains the fields
used in this repository and what users will observe.

### Identity

```yaml
schemaVersion: "2"
kind: mixin
name: language-node-npm
displayName: Node.js npm workspace isolation
description: Keeps Linux node_modules out of bind-mounted host workspaces
```

- `schemaVersion` selects the format understood by the repository's supported
  `sbx` version.
- `kind: mixin` means the kit extends the agent chosen by `sbx create`; it does
  not define a complete sandbox or agent by itself.
- `name` is the stable, lowercase identifier shown by Docker Sandbox. It must be
  unique across this catalogue.
- `displayName` and `description` are human-readable metadata.

### Network capabilities

```yaml
caps:
  network:
    allow:
      - registry.npmjs.org
```

`caps.network.allow` adds outbound destinations to the sandbox policy. An entry
permits access; it does not install or configure the named tool. These rules
broaden the sandbox's security boundary and can still be overridden by a more
restrictive organization policy. Review the exact hosts in the selected kit's
specification.

### Environment variables

```yaml
environment:
  variables:
    UV_PROJECT_ENVIRONMENT: /home/agent/.cache/python-uv/venv
```

`environment.variables` exposes non-secret configuration to agent processes.
Values are visible inside the sandbox. Never store credentials here, and do not
override `HTTP_PROXY`, `HTTPS_PROXY`, `NO_PROXY`, or their lowercase forms;
Docker Sandbox manages those variables to enforce network policy.

### Lifecycle commands and files

```yaml
commands:
  install:
    - command: npm install --global example@1.2.3
      description: Install a pinned tool
  initFiles:
    - path: /home/agent/.cache/example/.keep
      mode: "0644"
      content: ""
      description: Materialize sandbox-local storage
  startup:
    - command: [example-daemon, --serve]
      user: "0"
      description: Start the service
```

- `commands.install` runs once during sandbox creation. A string command is run
  through a shell and defaults to root.
- `commands.initFiles` writes the declared path and content while the sandbox is
  initialized. `mode` is an octal permission string.
- `commands.startup` runs on every sandbox start. Array commands are executed
  directly rather than interpreted by a shell; use an explicit shell entry when
  shell syntax is required. Startup commands must be idempotent.
- `user` selects the numeric user. `"0"` is root. `description` explains the
  operation shown to users and maintainers.

Install and startup behavior is privileged. Inspect commands before trusting a
kit. Startup hooks may still be running when `sbx create`, `sbx run`, or the
first `sbx exec` makes the agent available; a dependent operation must perform
its own readiness check.

## Troubleshooting

### The kit source is not allowed

If creation reports that a source is not in the allowlist, inspect the current
setting and add the narrow publisher prefixes you trust:

```sh
sbx settings get kit.allowedSources
sbx settings set kit.allowedSources \
  '["docker.io/","github.com/docker/","github.com/jamessawle/"]'
```

For a one-command override, set
`DOCKER_SANDBOXES_KIT_ALLOWED_SOURCES` to the same JSON array. Do not use `"*"`
unless you intentionally trust every remote kit source.

### A changed kit has no effect

`--kit` is applied when a sandbox is created. A new ref does not mutate an
existing named sandbox. Use `sbx kit add <sandbox> <kit-reference>` to augment a
running sandbox, or remove and recreate the sandbox when you need to replace or
remove a kit. Pinning a moving branch also leaves existing sandbox state
unchanged.

### A command races the Node.js mount

Docker Sandbox does not wait for startup hooks before making the agent or
`sbx exec` available. With `language-node-npm`, wait until
`$WORKSPACE_DIR/node_modules` is a mount point before installing dependencies.
The [kit reference](kits/language/node-npm/#operational-constraints) includes a
ready-to-use polling command.

### Python or uv writes to an unexpected location

`language-python-uv` intentionally sets `UV_PROJECT_ENVIRONMENT` and
`PYTHONPYCACHEPREFIX` to sandbox-local paths. Inspect them inside the sandbox:

```sh
sbx exec my-project sh -c \
  'printf "%s\n%s\n" "$UV_PROJECT_ENVIRONMENT" "$PYTHONPYCACHEPREFIX"'
```

Project-level configuration that overrides either variable also overrides the
kit's isolation behavior.

### Mise cannot resolve or install a toolchain

A `mise-network-*` kit grants network access only. Also compose the community
Mise kit, declare the tool version in the project, and select the matching
network kit. If resolution still fails, compare the failing hostname with the
kit's `caps.network.allow` list and inspect the effective policy with
`sbx policy ls`.

### General startup or configuration failure

Run `sbx diagnose`, inspect the sandbox and effective network policy, then retry
the failing command explicitly:

```sh
sbx diagnose
sbx inspect my-project
sbx policy ls
sbx exec -it my-project bash
```

When reporting a reproducible problem, include the `sbx` version, pinned kit
references, relevant diagnostic output, and the kit's documented constraints.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the development environment,
validation commands, and release checks.

## License

[MIT](LICENSE)

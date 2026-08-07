# sbx-kits

[![CI](https://github.com/jamessawle/sbx-kits/actions/workflows/pr-check.yml/badge.svg?branch=main)](https://github.com/jamessawle/sbx-kits/actions/workflows/pr-check.yml?query=branch%3Amain)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/jamessawle/sbx-kits/badge)](https://scorecard.dev/viewer/?uri=github.com/jamessawle/sbx-kits)
[![OpenSSF Best Practices](https://www.bestpractices.dev/projects/13983/badge)](https://www.bestpractices.dev/en/projects/13983/passing)
[![Latest release](https://img.shields.io/github/v/release/jamessawle/sbx-kits?sort=date&label=release)](https://github.com/jamessawle/sbx-kits/releases/latest)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Reusable [Docker Sandbox](https://docs.docker.com/ai/sandboxes/) (`sbx`) kits
for running coding agents in isolated environments. Each kit grants one focused
capability so projects can compose the policy they need.

Tested with `sbx 0.35.0`.

> [!IMPORTANT]
> Docker Sandbox will reject these kits unless its allowed-sources policy
> includes `github.com/jamessawle/`. The usage example below sets this policy
> for the `sbx create` command with
> `DOCKER_SANDBOXES_KIT_ALLOWED_SOURCES`.

## Kits

### Harness

Harness kits install or override coding-agent CLIs independently of the Docker
Sandbox release.

| Kit                          | dir                | Purpose                                                              |
| ---------------------------- | ------------------ | -------------------------------------------------------------------- |
| [Codex](kits/harness/codex/) | kits/harness/codex | Pins Codex independently of the version bundled with Docker Sandbox. |

### Language

Language kits isolate platform-specific project state from the bind-mounted
host workspace. They can be used independently when their toolchain is already
available.

| Kit                                     | dir                     | Purpose                                                          |
| --------------------------------------- | ----------------------- | ---------------------------------------------------------------- |
| [Node & npm](kits/language/node-npm/)   | kits/language/node-npm  | Isolates Linux `node_modules` and permits npm package downloads. |
| [Python & uv](kits/language/python-uv/) | kits/language/python-uv | Isolates Python generated state and permits package downloads.   |

### Mise network

Mise network kits grant the additional hosts required to resolve and install a
specific toolchain. Compose them with the community
[Mise kit](https://github.com/docker/sbx-kits-contrib/tree/main/mise).

| Kit                                                 | dir                         | Purpose                                                       |
| --------------------------------------------------- | --------------------------- | ------------------------------------------------------------- |
| [Go Network](kits/mise/network-go/)                 | kits/mise/network-go        | Permits Go toolchain, module, and checksum downloads.         |
| [Hugo Network](kits/mise/network-hugo/)             | kits/mise/network-hugo      | Permits Hugo Extended version resolution.                     |
| [Node.js Network](kits/mise/network-node/)          | kits/mise/network-node      | Permits Node.js toolchain and npm package downloads.          |
| [Python & uv Network](kits/mise/network-python-uv/) | kits/mise/network-python-uv | Permits Python, uv, Pyright toolchain, and package downloads. |
| [Zig Network](kits/mise/network-zig/)               | kits/mise/network-zig       | Permits Zig toolchain downloads.                              |

Each kit's README documents its capabilities, composition, and operational
constraints.

## Usage

Reference a kit by tag and directory:

```text
git+https://github.com/jamessawle/sbx-kits.git#ref=v2026.08.01&dir=kits/harness/codex
```

For example, a Node.js Codex sandbox can compose the community Mise kit with
the Codex, Node.js network, and Node.js workspace-isolation kits:

```sh
DOCKER_SANDBOXES_KIT_ALLOWED_SOURCES='["docker.io/","github.com/docker/","github.com/jamessawle/"]' \
  sbx create --name my-project \
    --kit 'git+https://github.com/docker/sbx-kits-contrib.git#ref=v0.12.0&dir=mise' \
    --kit 'git+https://github.com/jamessawle/sbx-kits.git#ref=v2026.08.01&dir=kits/harness/codex' \
    --kit 'git+https://github.com/jamessawle/sbx-kits.git#ref=v2026.08.01&dir=kits/language/node-npm' \
    --kit 'git+https://github.com/jamessawle/sbx-kits.git#ref=v2026.08.01&dir=kits/mise/network-node' \
    codex .
```

Releases use CalVer tags in the form `vYYYY.MM.NN`, where `NN` is the release
sequence within the month. A release is created whenever a change under
`kits/` reaches `main`; months without kit changes have no release. Tags are
immutable snapshots of every kit in the repository. Pin a tag and upgrade
deliberately; use a commit SHA if you need a guarantee independent of that
convention. The examples above pin a known release and are updated when usage
documentation changes; check the latest-release badge before copying them if
you want a newer snapshot.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the development environment,
validation commands, and release checks.

## License

[MIT](LICENSE)

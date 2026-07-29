# sbx-kits

[![Latest tag](https://img.shields.io/github/v/tag/jamessawle/sbx-kits?sort=semver)](https://github.com/jamessawle/sbx-kits/tags)

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
git+https://github.com/jamessawle/sbx-kits.git#ref=v0.2.0&dir=kits/harness/codex
```

For example, a Node.js Codex sandbox can compose the community Mise kit with
the Codex, Node.js network, and Node.js workspace-isolation kits:

```sh
DOCKER_SANDBOXES_KIT_ALLOWED_SOURCES='["docker.io/","github.com/docker/","github.com/jamessawle/"]' \
  sbx create --name my-project \
    --kit 'git+https://github.com/docker/sbx-kits-contrib.git#ref=v0.12.0&dir=mise' \
    --kit 'git+https://github.com/jamessawle/sbx-kits.git#ref=v0.2.0&dir=kits/harness/codex' \
    --kit 'git+https://github.com/jamessawle/sbx-kits.git#ref=v0.2.0&dir=kits/language/node-npm' \
    --kit 'git+https://github.com/jamessawle/sbx-kits.git#ref=v0.2.0&dir=kits/mise/network-node' \
    codex .
```

Tags are immutable snapshots of every kit in the repository. Pin a tag and
upgrade deliberately; use a commit SHA if you need a guarantee independent of
that convention.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the development environment,
validation commands, and release checks.

## License

[MIT](LICENSE)

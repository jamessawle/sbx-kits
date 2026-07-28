# sbx-kits

Reusable [Docker Sandbox](https://docs.docker.com/ai/sandboxes/) (`sbx`) kits
for running coding agents in isolated environments. Each kit is a `schemaVersion: "2"`
`mixin` that grants a focused capability — a network allowlist for a specific
toolchain, or a pinned CLI install — so a project's `sandbox.sh` can compose
just the kits it needs instead of hand-maintaining one large policy.

Tested with `sbx 0.35.0`.

## Kits

| Kit | Purpose |
|-----|---------|
| [`codex-cli`](codex-cli/) | Installs the pinned Codex CLI and permits its network access (`registry.npmjs.org`, `chatgpt.com`). |
| [`network-mise-go`](network-mise-go/) | Permits the Go toolchain, module, and checksum downloads used by [Mise](https://mise.jdx.dev/). |
| [`network-mise-hugo`](network-mise-hugo/) | Permits Hugo Extended version resolution via Mise. |
| [`network-mise-node`](network-mise-node/) | Permits the Node.js toolchain and npm package downloads used by Mise. |
| [`network-mise-zig`](network-mise-zig/) | Permits Zig toolchain downloads. |

The `network-mise-*` kits cover only the hosts each toolchain reaches *beyond*
those already supplied by the community
[Mise kit](https://github.com/docker/sbx-kits-contrib/tree/main/mise), which
should be composed alongside them.

## Usage

Reference a kit remotely from your project's sandbox composition — `sbx`
fetches and pins it, so consumers need no clone and no vendoring:

```sh
git+https://github.com/jamessawle/sbx-kits.git#ref=v0.1.0&dir=codex-cli
```

- `ref=` — the release to pin. **Tags here are immutable**: a fix ships as a
  new tag (`v0.1.1`), never by re-pointing an existing one, so a pinned
  consumer's sandbox policy can't change underneath it. Pin a commit SHA
  instead if you want a guarantee independent of that convention.
- `dir=` — the kit's directory in this repo.

### Allowed sources

`sbx` only fetches remote kits from namespaces on its allowed-sources list. A
project pulling from here must include `github.com/jamessawle/`:

```sh
DOCKER_SANDBOXES_KIT_ALLOWED_SOURCES='["docker.io/","github.com/docker/","github.com/jamessawle/"]' \
  sbx create --kit 'git+https://github.com/jamessawle/sbx-kits.git#ref=v0.1.0&dir=codex-cli' ...
```

### Validate

```sh
DOCKER_SANDBOXES_KIT_ALLOWED_SOURCES='["github.com/jamessawle/"]' \
  sbx kit validate 'git+https://github.com/jamessawle/sbx-kits.git#ref=v0.1.0&dir=codex-cli'
```

## Versioning

Kits are released together under a single repo tag. Because they only grant
network and install capabilities, treat every tag as an immutable snapshot of
policy — publish changes as new tags and let consumers upgrade `ref=`
deliberately.

## License

[MIT](LICENSE)

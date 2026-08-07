# mise-network-python-uv

Permits Python toolchain and locked package downloads.

Specification: [`spec.yaml`](spec.yaml)

## Capabilities

- Allows version resolution through `mise-versions.jdx.dev`.
- Allows Python package metadata and artifacts from `pypi.org` and
  `files.pythonhosted.org`.
- Allows Pyright's `nodeenv` fallback to download Node.js from `nodejs.org`.

## Composition

Compose this mixin with the community
[Mise kit](https://github.com/docker/sbx-kits-contrib/tree/main/mise) and a
project that declares its Python and uv versions. Add
[`language-python-uv`](../../language/python-uv/) to keep the virtual
environment and bytecode cache outside a bind-mounted host workspace.

## Externally visible behavior

The named hosts are added to the sandbox's outbound network policy. The kit
runs no commands, writes no files, and sets no environment variables.

## Security implications

The sandbox can download executable toolchains and Python packages from the
hosts listed in the specification. `nodejs.org` is reachable even when Pyright
does not need its fallback. Review project lock data before execution;
organization policy may still deny a host.

## Operational constraints

This kit grants network access only. Repository-specific uv and Python
environment behavior belongs in a language kit or the consuming project. Its
Python registry allowances deliberately overlap with `language-python-uv`,
allowing either kit to support dependency downloads independently.

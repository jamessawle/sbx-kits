# mise-network-python-uv

Permits Python, uv, and Pyright downloads used through Mise.

## Capabilities

- Allows version resolution through `mise-versions.jdx.dev`.
- Allows Python package metadata and artifacts from `pypi.org` and
  `files.pythonhosted.org`.
- Allows Pyright's `nodeenv` fallback to download Node.js from `nodejs.org`.

## Composition

Compose with the community
[Mise kit](https://github.com/docker/sbx-kits-contrib/tree/main/mise). Compose
with [`language-python-uv`](../../language/python-uv/) to keep the virtual
environment and bytecode cache outside a bind-mounted host workspace.

## Operational notes

This kit grants network access only. Repository-specific uv and Python
environment behavior belongs in a language kit or the consuming project. Its
Python package registry allowances deliberately overlap with
`language-python-uv`, allowing either kit to support dependency downloads
independently.

# language-python-uv

Keeps Python and uv generated state outside a bind-mounted host workspace.

## Capabilities

- Sets `UV_PROJECT_ENVIRONMENT` to a sandbox-local virtual environment.
- Sets `PYTHONPYCACHEPREFIX` to a sandbox-local bytecode cache.
- Prevents Linux virtual environments and `__pycache__` directories from
  replacing or polluting host-platform state.
- Allows Python package metadata and artifacts from `pypi.org` and
  `files.pythonhosted.org`.

## Composition

Use this kit by itself when Python and uv are already installed. Compose with
[`mise-network-python-uv`](../../mise/network-python-uv/) when Mise must resolve
or install the toolchain, or when Pyright may provision Node.js; the overlapping
Python package registry allowances are intentional.

## Operational notes

The paths are generic to the sandbox rather than tied to a repository name.
Each sandbox is expected to host one primary Python project environment. This
kit does not install Python or uv.

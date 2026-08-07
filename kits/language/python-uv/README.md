# language-python-uv

Keeps Python and uv generated state out of bind-mounted workspaces.

Specification: [`spec.yaml`](spec.yaml)

## Capabilities

- Sets `UV_PROJECT_ENVIRONMENT` to a sandbox-local virtual environment.
- Sets `PYTHONPYCACHEPREFIX` to a sandbox-local bytecode cache.
- Prevents Linux virtual environments and `__pycache__` directories from
  replacing or polluting host-platform state.
- Allows Python package metadata and artifacts from `pypi.org` and
  `files.pythonhosted.org`.

## Composition

Use this mixin by itself when Python and uv are already installed. Compose it
with [`mise-network-python-uv`](../../mise/network-python-uv/) and the community
Mise kit when Mise must resolve or install the toolchain, or when Pyright may
provision Node.js. The overlapping Python registry allowances are intentional.

## Externally visible behavior

Agent processes receive these values:

| Variable                 | Value                                  |
| ------------------------ | -------------------------------------- |
| `UV_PROJECT_ENVIRONMENT` | `/home/agent/.cache/python-uv/venv`    |
| `PYTHONPYCACHEPREFIX`    | `/home/agent/.cache/python-uv/pycache` |

uv therefore creates or reuses the virtual environment outside the mounted
repository, and Python writes bytecode into the sandbox-local cache.

## Security implications

The kit exposes no credential values and runs no privileged commands. It does
permit outbound HTTPS requests to the Python package indexes named in the
specification. Downloaded packages remain part of the consuming project's
supply chain.

## Operational constraints

The cache paths are generic to the sandbox rather than tied to a repository
name. Each sandbox is expected to host one primary Python project environment.
Project-level configuration that replaces either environment variable also
replaces this kit's isolation behavior. Recreating the sandbox removes the
sandbox-local environment. This kit does not install Python or uv.

# language-node-npm

Keeps Linux node_modules out of bind-mounted host workspaces.

Specification: [`spec.yaml`](spec.yaml)

## Capabilities

- Creates sandbox-local storage for each workspace.
- Bind-mounts that storage over `<workspace>/node_modules` on every sandbox
  start.
- Preserves any host `node_modules` by shadowing it only inside the sandbox.
- Allows npm metadata and package downloads from `registry.npmjs.org`.

## Composition

Use this mixin by itself when Node.js and npm are already installed. Compose it
with [`mise-network-node`](../../mise/network-node/) and the community Mise kit
when Mise must resolve or install Node.js. The overlapping npm registry
allowance is intentional.

## Externally visible behavior

On every start, the kit derives a stable storage directory from
`$WORKSPACE_DIR`, creates `<workspace>/node_modules`, and bind-mounts the
sandbox-local directory over it. Files in a host `node_modules` directory are
hidden inside the sandbox but remain unchanged on the host.

The mount source is under `/home/agent/.cache/node-bind-mounts/` and is owned by
UID and GID `1000` after creation.

## Security implications

The startup hook runs as root because creating a bind mount requires elevated
privileges. It mounts only the computed sandbox-local directory over the
workspace's `node_modules`. The kit also permits outbound HTTPS requests to
`registry.npmjs.org`; npm packages remain part of the consuming project's
supply chain.

## Operational constraints

Docker Sandbox startup hooks do not gate the agent or `sbx exec`. Automation
that installs dependencies immediately after a sandbox starts must wait until
`node_modules` is a mount point.

For example, a host-side setup script can use the first `sbx exec` to start the
sandbox and poll for readiness before installing dependencies:

```bash
sandbox_name=my-project
repository_root=$(git rev-parse --show-toplevel)

sbx exec \
  --workdir "$repository_root" \
  "$sandbox_name" \
  bash -c '
    for _ in {1..300}; do
      mountpoint -q "$WORKSPACE_DIR/node_modules" && exit 0
      sleep 0.1
    done
    echo "Timed out waiting for the sandbox-local node_modules mount." >&2
    exit 1
  '

sbx exec \
  --workdir "$repository_root" \
  "$sandbox_name" \
  npm ci
```

This waits for up to 30 seconds and fails without touching dependencies if the
mount does not become ready. `WORKSPACE_DIR` must be set by Docker Sandbox; the
startup hook fails if it is absent.

Recreating the sandbox removes its isolated `node_modules`; run the project's
dependency setup again after a rebuild. This kit does not install Node.js or
npm.

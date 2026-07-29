# language-node-npm

Keeps Linux `node_modules` isolated from a bind-mounted host workspace.

## Capabilities

- Creates sandbox-local storage for each workspace.
- Bind-mounts that storage over `<workspace>/node_modules` on every sandbox
  start.
- Preserves any host `node_modules` by shadowing it only inside the sandbox.
- Allows npm metadata and package downloads from `registry.npmjs.org`.

## Composition

Use this kit by itself when Node.js and npm are already installed. Compose with
[`mise-network-node`](../../mise/network-node/) when Mise must resolve or
install Node.js; the overlapping npm registry allowance is intentional.

## Operational notes

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
mount does not become ready.

Recreating the sandbox removes its isolated `node_modules`; run the project's
dependency setup again after a rebuild. This kit does not install Node.js or
npm.

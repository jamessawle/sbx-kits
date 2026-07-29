# Docker Sandbox configuration

[`sandbox.sh`](sandbox.sh) composes the pinned community Mise kit with this
checkout's local Codex, Node.js network, and Node.js workspace-isolation kits.
Using the local kits makes a rebuild exercise the same installation, network,
and bind-mount policies that this repository publishes.

Every rebuild validates all repository kits. The Python/uv language kit and the
Go, Hugo, Python/uv, and Zig network kits are not needed to edit this repository
and therefore do not broaden its network access.

Docker Sandbox startup hooks are asynchronous. Before running `npm ci`,
`sandbox.sh` explicitly waits for the Node.js kit to mount sandbox-local storage
over the workspace's `node_modules`.

| Command                     | Purpose                                        |
| --------------------------- | ---------------------------------------------- |
| `mise run sandbox`          | Refresh repository setup and attach            |
| `mise run sandbox rebuild`  | Replace the sandbox and apply the current kits |
| `mise run sandbox validate` | Validate every kit and sandbox dependency      |

The defaults use Codex and the sandbox name `sbx-kits`. Override them when
needed:

```sh
SANDBOX_AGENT=claude SANDBOX_NAME=sbx-kits-claude mise run sandbox rebuild
SANDBOX_NAME=sbx-kits-claude mise run sandbox
```

Network policy is host-global and may affect unrelated sandboxes, so the Mise
tasks do not change it. Organisation governance may override local policy and
kit rules.

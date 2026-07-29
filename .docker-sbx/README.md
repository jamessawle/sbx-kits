# Docker Sandbox configuration

[`sandbox.sh`](sandbox.sh) composes the pinned community Mise kit with this
checkout's local Codex, Node.js network, and Node.js workspace-isolation kits.
It also applies an internal [`sbx-validator`](kits/sbx-validator/) kit so the
repository can validate its public kits from inside its development sandbox.
Using the local kits makes a rebuild exercise the same installation, network,
and bind-mount policies that this repository publishes.

Every rebuild validates all repository kits. The Python/uv language kit and the
Go, Hugo, Python/uv, and Zig network kits are not needed to edit this repository
and therefore do not broaden its network access.

Docker Sandbox startup hooks are asynchronous. Before running `npm ci`,
`sandbox.sh` explicitly waits for the Node.js kit to mount sandbox-local storage
over the workspace's `node_modules`.

The internal validator installs only the pinned `sbx` CLI. It supports local
`sbx kit validate` commands, but cannot create nested sandboxes because the
development sandbox does not expose KVM. Its v0.37.0 pin is separate from the
public kits' v0.35.0 compatibility target because v0.35.x has no Linux ARM64
build.

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

# harness-codex

Overrides the Codex CLI bundled with Docker Sandbox using an independently
pinned version.

## Capabilities

- Decouples the Codex CLI upgrade cadence from the Docker Sandbox release.
- Installs the exact Codex CLI version pinned in [`spec.yaml`](spec.yaml).
- Allows npm package downloads from `registry.npmjs.org`.
- Allows Codex model traffic to `chatgpt.com`.

## Composition

Apply this kit when a sandbox needs an explicit Codex version rather than the
version bundled with its sbx release. It is unnecessary when the bundled
version is acceptable.

## Operational notes

Docker Sandbox normally couples its sbx and Codex versions. This kit replaces
that default with a second, independent compatibility pin. Test each Codex
upgrade against the supported sbx release, then publish the change under a new
repository tag.

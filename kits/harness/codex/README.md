# harness-codex

Pins Codex independently of the version bundled with Docker Sandbox.

Specification: [`spec.yaml`](spec.yaml)

## Capabilities

- Installs the exact Codex CLI version pinned in the specification.
- Allows npm package downloads from `registry.npmjs.org`.
- Allows Codex model traffic to `chatgpt.com:443`.

## Composition

Apply this mixin when a sandbox needs the pinned Codex version rather than the
version bundled with its `sbx` release. It is unnecessary when the bundled
version is acceptable. It can be composed with any language or toolchain kit
required by the project.

## Externally visible behavior

During sandbox creation, the kit runs `npm install --global` as root and
replaces the Codex executable available on the sandbox's global npm path. The
installed version is the exact package version shown in the specification.

## Security implications

The install hook executes npm package installation as root. The network policy
allows traffic to the npm registry and to the Codex service on HTTPS port 443.
Review the pinned package version and these destinations before applying the
kit; authentication values are not declared by this kit.

## Operational constraints

Docker Sandbox normally couples its `sbx` and Codex versions. This kit creates a
second compatibility pin. Test each Codex upgrade against the supported `sbx`
release, then publish the change under a new repository tag. The install hook
runs only when the kit is applied during sandbox creation.

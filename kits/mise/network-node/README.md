# mise-network-node

Permits Node.js toolchain and npm package downloads.

Specification: [`spec.yaml`](spec.yaml)

## Capabilities

- Allows version resolution through `mise-versions.jdx.dev`.
- Allows Node.js toolchain downloads from `nodejs.org`.
- Allows npm metadata and package downloads from `registry.npmjs.org`.

## Composition

Compose this mixin with the community
[Mise kit](https://github.com/docker/sbx-kits-contrib/tree/main/mise) and a
project that declares its Node.js version. Add
[`language-node-npm`](../../language/node-npm/) when Linux `node_modules` must
be isolated from a bind-mounted host workspace.

## Externally visible behavior

The named hosts are added to the sandbox's outbound network policy. The kit
runs no commands, writes no files, and sets no environment variables.

## Security implications

The sandbox can download executable Node.js toolchains and npm packages from
the hosts listed in the specification. Review the project's package lock and
install scripts before execution. Organization policy may still deny a host.

## Operational constraints

This kit grants network access only. It does not install Node.js, isolate
`node_modules`, or configure a project toolchain version. Its npm registry
allowance deliberately overlaps with `language-node-npm`, allowing either kit
to support dependency downloads independently.

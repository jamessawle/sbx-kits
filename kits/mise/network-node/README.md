# mise-network-node

Permits Node.js toolchain and npm package downloads used through Mise.

## Capabilities

- Allows version resolution through `mise-versions.jdx.dev`.
- Allows Node.js toolchain downloads from `nodejs.org`.
- Allows npm metadata and package downloads from `registry.npmjs.org`.

## Composition

Compose with the community
[Mise kit](https://github.com/docker/sbx-kits-contrib/tree/main/mise). Compose
with [`language-node-npm`](../../language/node-npm/) when Linux `node_modules`
must be isolated from a bind-mounted host workspace.

## Operational notes

This kit grants network access only. It does not install Node.js, isolate
`node_modules`, or configure a project toolchain version. Its npm registry
allowance deliberately overlaps with `language-node-npm`, allowing either kit
to support dependency downloads independently.

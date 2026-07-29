# mise-network-go

Permits Go toolchain, module, and checksum downloads used through Mise.

## Capabilities

- Allows version resolution through `mise-versions.jdx.dev`.
- Allows Go toolchain downloads from `go.dev`, `dl.google.com`, and
  `storage.googleapis.com`.
- Allows module and checksum downloads from `proxy.golang.org` and
  `sum.golang.org`.

## Composition

Compose with the community
[Mise kit](https://github.com/docker/sbx-kits-contrib/tree/main/mise).

## Operational notes

This kit grants only the Go-specific hosts needed beyond the community Mise
kit. It does not install Go or configure a project toolchain version.

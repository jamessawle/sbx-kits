# mise-network-go

Permits Go toolchain and module downloads.

Specification: [`spec.yaml`](spec.yaml)

## Capabilities

- Allows version resolution through `mise-versions.jdx.dev`.
- Allows Go toolchain downloads from `go.dev`, `dl.google.com`, and
  `storage.googleapis.com`.
- Allows module and checksum downloads from `proxy.golang.org` and
  `sum.golang.org`.

## Composition

Compose this mixin with the community
[Mise kit](https://github.com/docker/sbx-kits-contrib/tree/main/mise) and a
project that declares its Go version. No language workspace-isolation kit is
currently required.

## Externally visible behavior

The named hosts are added to the sandbox's outbound network policy. The kit
runs no commands, writes no files, and sets no environment variables.

## Security implications

The sandbox can download executable toolchains and project dependencies from
the hosts listed in the specification. Review project module sources and lock
or checksum data before execution. Organization policy may still deny a host.

## Operational constraints

This kit grants network access only. It does not install Go or configure a
project toolchain version. Download paths may change upstream; compare any
blocked hostname with the specification before expanding the policy.

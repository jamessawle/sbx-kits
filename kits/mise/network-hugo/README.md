# mise-network-hugo

Permits Hugo Extended version resolution.

Specification: [`spec.yaml`](spec.yaml)

## Capabilities

- Allows version resolution through `mise-versions.jdx.dev`.

## Composition

Compose this mixin with the community
[Mise kit](https://github.com/docker/sbx-kits-contrib/tree/main/mise), which
supplies the GitHub release hosts used for the Hugo download, and a project that
declares its Hugo version.

## Externally visible behavior

`mise-versions.jdx.dev` is added to the sandbox's outbound network policy. The
kit runs no commands, writes no files, and sets no environment variables.

## Security implications

The kit expands outbound access to the version-resolution service. The
community Mise kit separately controls access to the executable download
source. Review both kits before composition; organization policy may still deny
a host.

## Operational constraints

This kit does not install Hugo or configure a project toolchain version. It is
insufficient without the community Mise kit because the actual Hugo Extended
artifact is hosted on GitHub.

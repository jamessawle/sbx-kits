# mise-network-zig

Permits Zig toolchain downloads.

Specification: [`spec.yaml`](spec.yaml)

## Capabilities

- Allows Zig toolchain downloads from `ziglang.org`.

## Composition

Compose this mixin with the community
[Mise kit](https://github.com/docker/sbx-kits-contrib/tree/main/mise) and a
project that declares its Zig version.

## Externally visible behavior

`ziglang.org` is added to the sandbox's outbound network policy. The kit runs
no commands, writes no files, and sets no environment variables.

## Security implications

The sandbox can download executable Zig toolchains from `ziglang.org`. Review
the selected version before execution; organization policy may still deny the
host.

## Operational constraints

This kit grants network access only. It does not install Zig or configure a
project toolchain version.

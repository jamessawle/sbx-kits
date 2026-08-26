# Internal sbx validator

Installs the pinned Docker Sandbox CLI used by this repository's development
sandbox to run `sbx kit validate`.

This is an internal development kit, not part of the public kit catalogue. It
installs only the statically linked `sbx` executable and does not configure a
daemon, authentication, or network policy. The CLI can validate kit schemas
inside the development sandbox, but commands that create or manage sandboxes
remain host-side because the development sandbox does not expose KVM.

The v0.39.0 pin matches the public kits' compatibility target and supports
both Linux AMD64 and ARM64.

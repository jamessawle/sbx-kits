# Security Policy

## Supported versions

Security fixes are provided for the latest published release of `sbx-kits`.
Older releases and unreleased commits are not supported. Because releases are
immutable snapshots, a fix will be published in a new release rather than
added to an existing tag.

Users should pin a release tag and upgrade to the latest release when a
security fix is announced.

## Reporting a vulnerability

Report suspected vulnerabilities through
[GitHub's private vulnerability reporting form](https://github.com/jamessawle/sbx-kits/security/advisories/new).
Please do not disclose an unpatched vulnerability in a public issue,
discussion, or pull request.

Include enough information to reproduce and assess the issue, where possible:

- the affected kit, release, and Docker Sandbox version;
- the expected and observed sandbox or network-policy behavior;
- reproduction steps or a minimal configuration; and
- the potential impact and any known mitigations.

You can expect an acknowledgement within three business days and an initial
assessment within seven business days. We will provide progress updates at
least every seven business days while the report remains active. Resolution
time depends on the issue's complexity and the coordination required with
upstream projects.

We will coordinate remediation and public disclosure with the reporter. Please
allow time for a fix and release before publishing details. Reports made in
good faith will be handled respectfully, and contributors will be credited if
they wish.

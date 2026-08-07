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

## Responding to exposed credentials

GitHub secret scanning and push protection are enabled for this repository.
Push protection blocks recognized secrets before they reach the repository;
secret scanning continues to inspect the repository and its full Git history.
Do not test either feature with a real credential.

Repository administrators receive GitHub notifications for new secret-scanning
alerts according to their personal notification settings. Maintainers can also
review the canonical alert queue under **Security > Secret scanning** in the
repository. Treat that queue as the source of truth; do not copy a detected
secret into an issue, pull request, chat message, or remediation notes.

When a credential is reported or suspected to have been committed:

1. Revoke or rotate it with the credential provider immediately. Do this before
   changing Git history, because deleting a commit does not invalidate copies
   that have already been fetched or indexed.
2. Review provider audit logs and the credential's permissions to determine
   whether it was used, and restrict or disable affected accounts and systems
   as necessary.
3. Remove the credential from the current files. If it appears in Git history,
   rewrite every affected ref with a tool such as `git-filter-repo`, then
   coordinate a force-push and ask contributors to re-clone or carefully clean
   their local clones. Rewriting history is disruptive and is not a substitute
   for rotation.
4. Check branches, tags, forks, releases, workflow artifacts, caches, logs, and
   pull-request text for additional copies. Remove them through the applicable
   GitHub or provider interface without reproducing the credential elsewhere.
5. In **Security > Secret scanning**, record the alert's accurate resolution
   reason only after rotation and cleanup are complete. Preserve a redacted
   incident timeline and follow up on any unauthorized use.

If push protection must be bypassed for a false positive or a documented test
value, use GitHub's narrowest applicable bypass reason and explain why the value
is safe. Never bypass protection merely to unblock a push containing a working
credential.

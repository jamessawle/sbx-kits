# Contributing

## Development environment

Install [Mise](https://mise.jdx.dev/) 2026.5.2 or later and
[Docker Sandbox](https://docs.docker.com/ai/sandboxes/). Authenticate Docker
Sandbox and choose a host network policy:

```sh
sbx login
sbx secret set -g openai --oauth
sbx policy init deny-all
```

Create the development sandbox:

```sh
mise trust
mise run sandbox rebuild
```

Use `mise run sandbox` for subsequent sessions. The sandbox composes this
checkout's Codex and Node.js kits, while rebuilds validate every repository kit.
See [`.docker-sbx/README.md`](.docker-sbx/README.md) for its configuration and
overrides.

To work directly on the host instead:

```sh
mise trust
mise run setup
```

Setup installs the pinned tools and dependencies and configures the repository
Git hooks.

## Commands

| Command              | Purpose                                                 |
| -------------------- | ------------------------------------------------------- |
| `mise run setup`     | Install repository tools, dependencies, and Git hooks   |
| `mise run fmt`       | Format authored source files                            |
| `mise run fmt:check` | Check source formatting                                 |
| `mise run lint`      | Run static analysis                                     |
| `mise run test`      | Run tests and enforce JavaScript branch coverage        |
| `mise run validate`  | Run all checks, including Docker Sandbox kit validation |
| `mise run sandbox`   | Manage the Docker Sandbox                               |

The toolchain is pinned in [`mise.toml`](mise.toml); Node-based tools are pinned
in [`package.json`](package.json).

See [`TESTING.md`](TESTING.md) for the test inventory, coverage policy, and the
boundary between deterministic CI checks and Docker-backed manual validation.

## Testing policy

Major new functionality and significant changes to executable behavior must
include automated tests in the same pull request. Tests should exercise the new
or changed behavior and its important failure modes at the narrowest practical
level. Bug fixes should include a regression test that fails without the fix.

Use the validation appropriate to the type of change:

- Executable JavaScript, shell automation, and runtime kit commands require
  focused automated tests, plus `mise run test`.
- Kit specifications, repository configuration, workflows, and metadata require
  the relevant repository validators, linters, or `sbx kit validate` checks.
- Documentation-only changes require formatting and link or metadata validation
  when the edited content is covered by those checks; they do not require new
  runtime tests.

Run `mise run validate` before submitting a pull request whenever the required
Docker tooling is available. The pull request must identify the tests and
validation run. If an automated test is not practical, explain the concrete
technical reason, describe the alternative validation performed, and identify
any remaining risk. Cost or schedule alone is not a sufficient exception.

## Git hooks

The pre-commit hook runs formatting and linting against the staged repository
state. When a tag is pushed, the pre-push hook extracts the exact tagged tree,
installs its locked dependencies, and runs the complete validation against it.
Ordinary branch pushes do not repeat tag validation.

Run the same complete check before creating a tag:

```sh
mise run validate
```

## Releases

Changes under `kits/` are released automatically after they reach `main` and
pass validation. Releases use CalVer tags in the form `vYYYY.MM.NN`; the final
component is a two-digit sequence that restarts each month. Months without kit
changes have no release.

A scheduled workflow checks dependencies pinned within kits each week. When an
update is available, it opens a pull request and enables auto-merge after the
repository's required checks pass. Repository development tools are outside
this update and release cycle.

Configure an `SBX_KITS_AUTOMATION_TOKEN` repository secret with contents and
pull-request write access so that dependency pull requests trigger validation
and their merges trigger releases. The updater falls back to `GITHUB_TOKEN`,
but GitHub suppresses workflows caused by that token. Repository auto-merge
must also be enabled for dependency pull requests to merge automatically.

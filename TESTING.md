# Testing strategy

The standard test command runs the complete deterministic suite and enforces
coverage for every production JavaScript module:

```sh
mise run test
```

`mise run validate` additionally runs formatting, static analysis, metadata
validation, and `sbx kit validate` for every public kit. Pull requests and
pushes to `main` run that complete validation in GitHub Actions.

## Automated test inventory

| Area                     | Level                | Evidence                                                                                                                                                                                                               |
| ------------------------ | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Kit metadata validator   | Unit                 | Temporary repository fixtures exercise valid metadata and structural failures.                                                                                                                                         |
| Dependency updater       | Unit and integration | Injected npm and filesystem boundaries cover current, updated, malformed, missing, duplicate, registry-failure, and write-failure behavior. A CLI test uses a local fake `npm`; it never contacts the public registry. |
| Sandbox orchestration    | Integration          | The actual Bash entry point runs against a recording `sbx` replacement and exercises validation, attach, rebuild, absent/existing sandboxes, missing CLI, and invalid actions.                                         |
| Git hooks                | Integration          | The actual hook entry points and Mise task scripts run with recording process boundaries, including missing dependencies, ordinary pushes, and tag validation.                                                         |
| Node workspace isolation | Runtime smoke test   | The startup command embedded in `kits/language/node-npm/spec.yaml` runs with controlled mount commands and exercises first-run, already-mounted, and missing-workspace behavior.                                       |
| All kit specifications   | Tool integration     | `mise run validate` invokes the pinned Docker Sandbox CLI's `sbx kit validate` for each public kit and the pinned community Mise kit.                                                                                  |

## Coverage policy

Node's test runner instruments both production JavaScript locations:

- `scripts/**/*.mjs`
- `.github/scripts/**/*.mjs`

The aggregate branch threshold is 80%. The threshold is part of `npm test`, so
the same command enforces it locally, in required pull-request CI, on `main`,
and before a release tag is pushed.

V8 line and branch instrumentation cannot meaningfully measure Bash scripts or
declarative YAML kit specifications. They are intentionally excluded from the
JavaScript percentage. Their behavior is instead checked by assertion-rich
process tests, runtime command smoke tests, ShellCheck, and `sbx kit validate`.

## Docker-backed boundary

CI installs the pinned Docker Sandbox CLI and validates every kit, but it does
not create a live agent sandbox. Live creation requires an authenticated Docker
backend, agent credentials, network access, privileged bind mounts, and external
registries; treating those dependencies as a required test would make failures
non-deterministic.

Maintainers can exercise that end-to-end boundary before a release with:

```sh
mise run sandbox rebuild
```

The deterministic runtime smoke test covers the materially distinct executable
Node isolation kit. The Python isolation and Mise network kits are declarative:
their observable behavior is environment or network policy, so metadata and
Docker Sandbox validation are the reliable automated checks.

## OpenSSF evidence

- `dynamic_analysis` is supported by measured branch coverage above 80% for all
  instrumentable production JavaScript, plus automated dynamic shell and kit
  command tests.
- `dynamic_analysis_enable_assertions` is supported by explicit Node assertions
  across success and failure paths; assertions are not disabled in test builds.
- `test_most` is not claimed project-wide. The suite covers the repository's
  principal executable automation, but live Docker-backed behavior and every
  possible declarative network-policy outcome are not automated.

This distinction keeps the assessment tied to repeatable evidence without
treating declarative validation as line or branch coverage.

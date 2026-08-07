import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { validateRepository } from "../scripts/validate-kit-metadata.mjs";

function validKitReadme({ name, description = "Example kit" }) {
  return `# ${name}

${description}.

Specification: [\`spec.yaml\`](spec.yaml)

## Capabilities

Capabilities.

## Composition

Composition.

## Externally visible behavior

Behavior.

## Security implications

Security.

## Operational constraints

Constraints.
`;
}

function fixture({
  catalogue = ["kits/language/example"],
  kits = [{ directory: "kits/language/example", name: "language-example" }],
  versions = ["1.2.3", "1.2.3", "1.2.3"],
} = {}) {
  const root = mkdtempSync(join(tmpdir(), "sbx-kits-metadata-"));

  for (const kit of kits) {
    const directory = join(root, kit.directory);
    mkdirSync(directory, { recursive: true });
    const description = kit.description ?? "Example kit";
    writeFileSync(
      join(directory, "spec.yaml"),
      `schemaVersion: "2"\nkind: mixin\nname: ${kit.name}\ndisplayName: Example kit\ndescription: ${description}\n`,
    );
    if (kit.readme !== false) {
      writeFileSync(
        join(directory, "README.md"),
        typeof kit.readme === "string" ? kit.readme : validKitReadme({ ...kit, description }),
      );
    }
  }

  writeFileSync(
    join(root, "README.md"),
    `Tested with \`sbx ${versions[0]}\`.\n\n## Kits\n\n${catalogue.map((path) => `- [Kit](${path}/)`).join("\n")}\n\n## Usage\n`,
  );
  mkdirSync(join(root, ".github/workflows"), { recursive: true });
  writeFileSync(
    join(root, ".github/workflows/pr-check.yml"),
    `env:\n  SBX_VERSION: ${versions[1]}\n`,
  );
  writeFileSync(
    join(root, ".github/workflows/release.yml"),
    `env:\n  SBX_VERSION: ${versions[2]}\n`,
  );

  return root;
}

test("accepts consistent kit metadata", () => {
  assert.deepEqual(validateRepository(fixture()), []);
});

test("reports a missing kit README", () => {
  const errors = validateRepository(
    fixture({ kits: [{ directory: "kits/language/example", name: "example", readme: false }] }),
  );

  assert(errors.some((error) => error.includes("has no sibling README.md")));
});

test("reports duplicate kit names", () => {
  const errors = validateRepository(
    fixture({
      catalogue: ["kits/language/one", "kits/mise/two"],
      kits: [
        { directory: "kits/language/one", name: "duplicate" },
        { directory: "kits/mise/two", name: "duplicate" },
      ],
    }),
  );

  assert(errors.some((error) => error.includes('duplicate kit name "duplicate"')));
});

test("reports invalid and missing catalogue paths", () => {
  const errors = validateRepository(fixture({ catalogue: ["kits/language/missing"] }));

  assert(errors.some((error) => error.includes("does not identify a kit")));
  assert(errors.some((error) => error.includes("catalogue is missing kits/language/example")));
});

test("reports inconsistent compatibility versions", () => {
  const errors = validateRepository(fixture({ versions: ["1.2.3", "1.2.4", "1.2.3"] }));

  assert(errors.some((error) => error.includes("compatibility versions disagree")));
});

test("reports duplicated catalogue entries", () => {
  const errors = validateRepository(
    fixture({ catalogue: ["kits/language/example", "kits/language/example"] }),
  );

  assert(
    errors.some((error) => error.includes("catalogue lists kits/language/example more than once")),
  );
});

test("reports kit reference metadata and structure drift", () => {
  const errors = validateRepository(
    fixture({
      kits: [
        {
          directory: "kits/language/example",
          name: "language-example",
          readme: "# wrong-name\n\nWrong summary.\n",
        },
      ],
    }),
  );

  assert(errors.some((error) => error.includes("heading must match kit name")));
  assert(errors.some((error) => error.includes("summary must match")));
  assert(errors.some((error) => error.includes("must link to its spec.yaml")));
  assert(errors.some((error) => error.includes('missing the "Capabilities" section')));
});

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const specPath = "kits/harness/codex/spec.yaml";
const packageName = "@openai/codex";
const versionPattern = /@openai\/codex@(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)/g;

const publishedVersion = JSON.parse(
  execFileSync("npm", ["view", packageName, "version", "--json"], {
    encoding: "utf8",
  }),
);

if (typeof publishedVersion !== "string") {
  throw new Error(`Expected one published ${packageName} version`);
}

const spec = readFileSync(specPath, "utf8");
const pinnedVersions = [...spec.matchAll(versionPattern)].map((match) => match[1]);

if (pinnedVersions.length !== 1) {
  throw new Error(
    `Expected exactly one ${packageName} pin in ${specPath}; found ${pinnedVersions.length}`,
  );
}

const pinnedVersion = pinnedVersions[0];

if (pinnedVersion === publishedVersion) {
  console.log(`${packageName} is already pinned to ${pinnedVersion}`);
  process.exit(0);
}

writeFileSync(specPath, spec.replace(versionPattern, `${packageName}@${publishedVersion}`));
console.log(`Updated ${packageName} from ${pinnedVersion} to ${publishedVersion}`);

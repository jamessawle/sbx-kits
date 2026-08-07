import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const defaultSpecPath = "kits/harness/codex/spec.yaml";
export const defaultPackageName = "@openai/codex";
const semanticVersionPattern = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

function versionPattern(packageName) {
  const escapedPackageName = packageName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`${escapedPackageName}@(\\d+\\.\\d+\\.\\d+(?:-[0-9A-Za-z.-]+)?)`, "g");
}

export function parsePublishedVersion(output, packageName = defaultPackageName) {
  let publishedVersion;
  try {
    publishedVersion = JSON.parse(output);
  } catch (error) {
    throw new Error(`Could not parse the published ${packageName} version`, { cause: error });
  }

  if (typeof publishedVersion !== "string" || !semanticVersionPattern.test(publishedVersion)) {
    throw new Error(`Expected one published ${packageName} version`);
  }

  return publishedVersion;
}

export function updatePinnedVersion(
  spec,
  publishedVersion,
  packageName = defaultPackageName,
  source = "the kit specification",
) {
  const pattern = versionPattern(packageName);
  const pinnedVersions = [...spec.matchAll(pattern)].map((match) => match[1]);

  if (pinnedVersions.length !== 1) {
    throw new Error(
      `Expected exactly one ${packageName} pin in ${source}; found ${pinnedVersions.length}`,
    );
  }

  const pinnedVersion = pinnedVersions[0];
  return {
    changed: pinnedVersion !== publishedVersion,
    pinnedVersion,
    spec: spec.replace(pattern, `${packageName}@${publishedVersion}`),
  };
}

export function updateKitDependency({
  execFile = execFileSync,
  log = console.log,
  packageName = defaultPackageName,
  readFile = readFileSync,
  specPath = defaultSpecPath,
  writeFile = writeFileSync,
} = {}) {
  const output = execFile("npm", ["view", packageName, "version", "--json"], {
    encoding: "utf8",
  });
  const publishedVersion = parsePublishedVersion(output, packageName);
  const spec = readFile(specPath, "utf8");
  const result = updatePinnedVersion(spec, publishedVersion, packageName, specPath);

  if (!result.changed) {
    log(`${packageName} is already pinned to ${result.pinnedVersion}`);
    return result;
  }

  writeFile(specPath, result.spec);
  log(`Updated ${packageName} from ${result.pinnedVersion} to ${publishedVersion}`);
  return result;
}

const invokedPath = process.argv[1] && resolve(process.argv[1]);
if (invokedPath === fileURLToPath(import.meta.url)) {
  updateKitDependency();
}

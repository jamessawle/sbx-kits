import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const compatibilityFiles = [
  ["README.md", /Tested with `sbx (\d+\.\d+\.\d+)`/],
  [".github/workflows/pr-check.yml", /SBX_VERSION: (\d+\.\d+\.\d+)/],
  [".github/workflows/release.yml", /SBX_VERSION: (\d+\.\d+\.\d+)/],
];

const requiredKitReadmeSections = [
  "Capabilities",
  "Composition",
  "Externally visible behavior",
  "Security implications",
  "Operational constraints",
];

function kitDirectories(root) {
  const kitsRoot = resolve(root, "kits");

  if (!existsSync(kitsRoot)) return [];

  return readdirSync(kitsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((area) =>
      readdirSync(resolve(kitsRoot, area.name), { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => `kits/${area.name}/${entry.name}`),
    )
    .filter((directory) => existsSync(resolve(root, directory, "spec.yaml")))
    .sort();
}

function yamlScalar(spec, field) {
  return spec.match(new RegExp(`^${field}:\\s*["']?([^\\n"']+?)["']?\\s*$`, "m"))?.[1];
}

function kitMetadata(spec) {
  return {
    name: yamlScalar(spec, "name"),
    displayName: yamlScalar(spec, "displayName"),
    description: yamlScalar(spec, "description"),
  };
}

function cataloguePaths(readme) {
  const catalogue = readme.match(/^## (?:Kits|Kit catalogue)\s*$([\s\S]*?)(?=^##\s)/m)?.[1] ?? "";

  return [...catalogue.matchAll(/\]\((kits\/[^/\s)]+\/[^/\s)]+)\/?\)/g)].map((match) => match[1]);
}

function normalizeProse(value) {
  return value.replace(/\s+/g, " ").trim().replace(/\.$/, "");
}

function kitReadmeSummary(readme) {
  return readme.match(/^#\s+[^\n]+\n\s*\n([\s\S]*?)(?=\n\s*\n)/)?.[1];
}

export function validateRepository(root) {
  const errors = [];
  const directories = kitDirectories(root);
  const names = new Map();

  for (const directory of directories) {
    const readmePath = resolve(root, directory, "README.md");
    if (!existsSync(readmePath)) {
      errors.push(`${directory}/spec.yaml has no sibling README.md`);
    }

    const specPath = resolve(root, directory, "spec.yaml");
    const metadata = kitMetadata(readFileSync(specPath, "utf8"));
    const { name } = metadata;
    if (!name) {
      errors.push(`${directory}/spec.yaml has no top-level name`);
      continue;
    }

    const previous = names.get(name);
    if (previous) {
      errors.push(`duplicate kit name ${JSON.stringify(name)}: ${previous} and ${directory}`);
    } else {
      names.set(name, directory);
    }

    if (!metadata.displayName) {
      errors.push(`${directory}/spec.yaml has no top-level displayName`);
    }
    if (!metadata.description) {
      errors.push(`${directory}/spec.yaml has no top-level description`);
    }

    if (existsSync(readmePath)) {
      const readme = readFileSync(readmePath, "utf8");
      const heading = readme.match(/^#\s+(.+)$/m)?.[1];
      if (heading !== name) {
        errors.push(`${directory}/README.md heading must match kit name ${JSON.stringify(name)}`);
      }

      const summary = kitReadmeSummary(readme);
      if (!summary || normalizeProse(summary) !== normalizeProse(metadata.description ?? "")) {
        errors.push(`${directory}/README.md summary must match its spec.yaml description`);
      }

      if (!readme.includes("[`spec.yaml`](spec.yaml)")) {
        errors.push(`${directory}/README.md must link to its spec.yaml`);
      }

      for (const section of requiredKitReadmeSections) {
        if (!readme.includes(`\n## ${section}\n`)) {
          errors.push(`${directory}/README.md is missing the ${JSON.stringify(section)} section`);
        }
      }
    }
  }

  const rootReadme = resolve(root, "README.md");
  if (!existsSync(rootReadme)) {
    errors.push("README.md is missing");
  } else {
    const paths = cataloguePaths(readFileSync(rootReadme, "utf8"));
    const listed = new Set(paths);

    for (const path of listed) {
      if (paths.filter((candidate) => candidate === path).length > 1) {
        errors.push(`README.md catalogue lists ${path} more than once`);
      }
    }

    for (const path of paths) {
      if (!directories.includes(path)) {
        errors.push(`README.md catalogue path does not identify a kit: ${path}`);
      }
    }

    for (const directory of directories) {
      if (!listed.has(directory)) {
        errors.push(`README.md catalogue is missing ${directory}`);
      }
    }
  }

  const versions = new Map();
  for (const [path, pattern] of compatibilityFiles) {
    const absolutePath = resolve(root, path);
    if (!existsSync(absolutePath)) continue;

    const version = readFileSync(absolutePath, "utf8").match(pattern)?.[1];
    if (!version) {
      errors.push(`could not find the sbx compatibility version in ${path}`);
    } else {
      versions.set(path, version);
    }
  }

  if (new Set(versions.values()).size > 1) {
    errors.push(
      `sbx compatibility versions disagree: ${[...versions].map(([path, version]) => `${path}=${version}`).join(", ")}`,
    );
  }

  return errors;
}

const invokedPath = process.argv[1] && resolve(process.argv[1]);
if (invokedPath === fileURLToPath(import.meta.url)) {
  const root = resolve(process.argv[2] ?? ".");
  const errors = validateRepository(root);

  if (errors.length > 0) {
    console.error("Kit metadata validation failed:");
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
  } else {
    console.log(`Kit metadata is consistent (${kitDirectories(root).length} kits checked).`);
  }
}

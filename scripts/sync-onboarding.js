const fs = require("node:fs");
const path = require("node:path");

/*
  Copies static/onboarding.html into a build output directory.

  Plasmo/Parcel only bundles files it can statically resolve. background.ts
  opens the onboarding page through chrome.runtime.getURL("static/onboarding.html"),
  which is a runtime string the bundler cannot see, so the file has to be copied
  in explicitly or the post-install onboarding tab 404s.

  Usage: node scripts/sync-onboarding.js [dev|prod]   (defaults to dev)
*/

const targetEnv = process.argv[2] === "prod" ? "prod" : "dev";
const distDirectoryName = `chrome-mv3-${targetEnv}`;

const projectRoot = path.resolve(__dirname, "..");
const sourcePath = path.join(projectRoot, "static", "onboarding.html");
const targetDirectory = path.join(projectRoot, "build", distDirectoryName, "static");
const targetPath = path.join(targetDirectory, "onboarding.html");

if (!fs.existsSync(sourcePath)) {
  console.error(`Missing source file: ${path.relative(projectRoot, sourcePath)}`);
  process.exit(1);
}

fs.mkdirSync(targetDirectory, { recursive: true });
fs.copyFileSync(sourcePath, targetPath);
console.log(`Synchronized ${path.relative(projectRoot, sourcePath)} with ${path.relative(projectRoot, targetPath)}`);

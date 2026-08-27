const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const sourcePath = path.join(projectRoot, "static", "onboarding.html");
const targetDirectory = path.join(projectRoot, "build", "chrome-mv3-dev", "static");
const targetPath = path.join(targetDirectory, "onboarding.html");

fs.mkdirSync(targetDirectory, { recursive: true });
fs.copyFileSync(sourcePath, targetPath);
console.log(`Synchronized ${path.relative(projectRoot, sourcePath)} with ${path.relative(projectRoot, targetPath)}`);

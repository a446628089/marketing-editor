const fs = require('fs');
const path = require('path');

// Resolve from this script so the cleanup never depends on the caller's cwd.
const projectRoot = path.resolve(__dirname, '..');
const outputPath = path.resolve(projectRoot, 'output');
if (path.dirname(outputPath) !== projectRoot || path.basename(outputPath) !== 'output') {
  throw new Error('Refusing to clean a path outside the project output directory');
}
fs.rmSync(outputPath, { recursive: true, force: true });

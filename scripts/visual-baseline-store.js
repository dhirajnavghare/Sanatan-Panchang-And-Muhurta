const fs = require('fs');
const path = require('path');

const BASELINE_DIR = path.join(process.cwd(), '__tests__', 'visual', 'baselines');

function getBaselinePath(name) {
  return path.join(BASELINE_DIR, `${name}.baseline.json`);
}

function baselineExists(name) {
  return fs.existsSync(getBaselinePath(name));
}

function readBaseline(name) {
  return fs.readFileSync(getBaselinePath(name), 'utf8');
}

function writeBaseline(name, content) {
  fs.mkdirSync(BASELINE_DIR, { recursive: true });
  fs.writeFileSync(getBaselinePath(name), content, 'utf8');
}

module.exports = {
  getBaselinePath,
  baselineExists,
  readBaseline,
  writeBaseline,
};

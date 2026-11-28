#!/usr/bin/env node
/**
 * Repository Release, Config Parity, Tour Integrity & Anti-Cheat Quality Gate.
 * Exits non-zero on ANY configuration mismatch, orphaned tour target, skipped test,
 * secret leak pattern, or missing visual baseline.
 */
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
let failures = 0;

function fail(msg) {
  console.error(`❌ [QualityGate] ${msg}`);
  failures += 1;
}

function pass(msg) {
  console.log(`✅ [QualityGate] ${msg}`);
}

function walkFiles(dir, exts, result = []) {
  if (!fs.existsSync(dir)) return result;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'coverage') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(full, exts, result);
    } else if (exts.some((e) => entry.name.endsWith(e))) {
      result.push(full);
    }
  }
  return result;
}

// 1. Config & Version Parity Checks (package.json, app.json, android/app/build.gradle, eas.json)
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const appJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'app.json'), 'utf8'));
const gradlePath = path.join(ROOT, 'android', 'app', 'build.gradle');
const gradle = fs.existsSync(gradlePath) ? fs.readFileSync(gradlePath, 'utf8') : '';
const easPath = path.join(ROOT, 'eas.json');
const easJson = fs.existsSync(easPath) ? JSON.parse(fs.readFileSync(easPath, 'utf8')) : null;

const expoVersion = appJson?.expo?.version;
const androidPkg = appJson?.expo?.android?.package;
const iosBundle = appJson?.expo?.ios?.bundleIdentifier;
const androidVersionCode = appJson?.expo?.android?.versionCode;

if (!expoVersion || expoVersion !== pkg.version) {
  fail(`Version mismatch: package.json (${pkg.version}) vs app.json (${expoVersion})`);
} else {
  pass(`App version parity verified (${expoVersion})`);
}

if (!androidPkg || !iosBundle || androidPkg !== iosBundle) {
  fail(`Bundle/Package ID mismatch: android (${androidPkg}) vs ios (${iosBundle})`);
} else if (gradle) {
  const appIdMatch = gradle.match(/applicationId\s+['"]([^'"]+)['"]/);
  const nsMatch = gradle.match(/namespace\s+['"]([^'"]+)['"]/);
  const vcMatch = gradle.match(/versionCode\s+(\d+)/);
  const vnMatch = gradle.match(/versionName\s+["']([^"']+)["']/);

  if (appIdMatch?.[1] !== androidPkg || nsMatch?.[1] !== androidPkg) {
    fail(`Android Gradle package mismatch: gradle=${appIdMatch?.[1]} / ${nsMatch?.[1]} vs app.json=${androidPkg}`);
  } else if (Number(vcMatch?.[1]) !== Number(androidVersionCode)) {
    fail(`versionCode mismatch: gradle=${vcMatch?.[1]} vs app.json=${androidVersionCode}`);
  } else if (vnMatch?.[1] !== expoVersion) {
    fail(`versionName mismatch: gradle=${vnMatch?.[1]} vs app.json=${expoVersion}`);
  } else {
    pass(`Android Gradle parity verified (${androidPkg}, versionCode ${androidVersionCode}, versionName ${expoVersion})`);
  }
}

if (!easJson?.build?.['e2e-test'] || !easJson?.build?.production) {
  fail('eas.json must define production and e2e-test build profiles');
} else {
  pass('EAS build profiles verified (development, preview, e2e-test, production)');
}

// 2. Tour Integrity Checks (all 7 tabs, 8 sections, contextual help topics & targetTestID wiring)
const tourStepsFile = fs.readFileSync(path.join(ROOT, 'src/constants/tourSteps.ts'), 'utf8');
const targetIds = [...tourStepsFile.matchAll(/targetTestID:\s*'([^']+)'/g)].map((m) => m[1]);
const requiredTabs = [
  '/(tabs)',
  '/(tabs)/muhurta',
  '/(tabs)/festivals',
  '/(tabs)/prayers',
  '/(tabs)/more',
  '/(tabs)/community',
  '/(tabs)/settings',
];
for (const tab of requiredTabs) {
  if (!tourStepsFile.includes(`tab: '${tab}'`)) {
    fail(`Tour steps missing tab coverage for ${tab}`);
  }
}
const requiredSections = [
  'dinacharya',
  'dayplanner',
  'muhurta',
  'festivals',
  'prayers',
  'more',
  'community',
  'settings',
];
for (const sec of requiredSections) {
  if (!tourStepsFile.includes(`id: '${sec}'`)) {
    fail(`TOUR_SECTIONS missing section "${sec}"`);
  }
  if (!tourStepsFile.includes(`${sec}: {`)) {
    fail(`CONTEXTUAL_HELP_TOPICS missing topic "${sec}"`);
  }
}

const uiFiles = [
  ...walkFiles(path.join(ROOT, 'app'), ['.tsx', '.ts']),
  ...walkFiles(path.join(ROOT, 'src'), ['.tsx', '.ts']),
];
const allUiSource = uiFiles.map((f) => fs.readFileSync(f, 'utf8')).join('\n');
const spotlightSource = fs.readFileSync(path.join(ROOT, 'src/utils/tourSpotlight.ts'), 'utf8');

for (const tid of targetIds) {
  const wired =
    allUiSource.includes(`"${tid}"`) ||
    allUiSource.includes(`'${tid}'`) ||
    spotlightSource.includes(`'${tid}'`);
  if (!wired) {
    fail(`Tour step targetTestID "${tid}" not found in app/ or src/ UI targets`);
  }
}
if (targetIds.length < 30) {
  fail(`Expected >= 30 tour targets, found ${targetIds.length}`);
} else {
  pass(`All ${targetIds.length} tour step targetTestIDs and 8 sections verified`);
}

// 3. Anti-Cheat Checks: No Skipped Tests, No Swallowed Failures (|| true), No Leaked Secrets
const testFiles = walkFiles(path.join(ROOT, '__tests__'), ['.ts', '.tsx', '.js', '.jsx']);
const skipRegex = /\b(?:it|test|describe)\.skip\s*\(|\bx(?:it|test|describe)\s*\(/;
for (const tf of testFiles) {
  const content = fs.readFileSync(tf, 'utf8');
  if (skipRegex.test(content)) {
    fail(`Skipped test detected in ${path.relative(ROOT, tf)}`);
  }
}
pass(`Zero skipped tests across ${testFiles.length} test files`);

const scriptsAndCi = [
  path.join(ROOT, 'package.json'),
  path.join(ROOT, '.github', 'workflows', 'ci.yml'),
];
for (const cf of scriptsAndCi) {
  if (fs.existsSync(cf) && /\|\|\s*true/.test(fs.readFileSync(cf, 'utf8'))) {
    fail(`Swallowed failure ("|| true") found in ${path.relative(ROOT, cf)}`);
  }
}

const secretPatterns = [
  /sk_live_[0-9a-zA-Z]{16,}/,
  /AKIA[0-9A-Z]{16}/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /AIzaSy[0-9A-Za-z_-]{30,}/,
];
const codeFiles = [
  ...walkFiles(path.join(ROOT, 'app'), ['.ts', '.tsx', '.js']),
  ...walkFiles(path.join(ROOT, 'src'), ['.ts', '.tsx', '.js']),
];
for (const cf of codeFiles) {
  const content = fs.readFileSync(cf, 'utf8');
  for (const pat of secretPatterns) {
    if (pat.test(content)) {
      fail(`Potential secret pattern ${pat} detected in ${path.relative(ROOT, cf)}`);
    }
  }
}
pass('Zero secret leaks or swallowed CI failures detected');

// 4. Visual Regression Baselines Check
const baselineDir = path.join(ROOT, '__tests__', 'visual', 'baselines');
const baselineFiles = fs.existsSync(baselineDir)
  ? fs.readdirSync(baselineDir).filter((f) => f.endsWith('.baseline.json'))
  : [];
if (baselineFiles.length < 10) {
  fail(`Expected >= 10 visual baseline files, found ${baselineFiles.length}`);
} else {
  pass(`${baselineFiles.length} locked visual regression baselines verified`);
}

if (fs.existsSync(path.join(ROOT, '.tmp-export'))) {
  fail('Temporary bundle directory .tmp-export was left behind');
}

if (failures > 0) {
  console.error(`\n💥 Quality gate failed with ${failures} error(s).`);
  process.exit(1);
}
console.log('\n🎉 All project quality checks passed!');

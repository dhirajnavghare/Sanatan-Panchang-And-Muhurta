#!/usr/bin/env node
/* global Buffer */
/**
 * Zero-dependency PNG structural/pixel diff validator for Maestro device screenshots.
 * Compares candidate screenshots against committed baselines in visual-baselines/approved/
 * and fails non-zero on dimension or raw IDAT pixel mismatch above tolerance.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const APPROVED_DIR = path.join(process.cwd(), 'visual-baselines', 'approved');
const CANDIDATE_DIR = process.argv[2] || path.join(process.cwd(), 'visual-baselines', 'current');
const MAX_BYTE_DIFF_RATIO = 0.005; // 0.5% tolerance for subtle anti-aliasing

function parsePng(buffer) {
  const signature = '89504e470d0a1a0a';
  if (buffer.subarray(0, 8).toString('hex') !== signature) {
    throw new Error('Invalid PNG signature');
  }
  let offset = 8;
  let width = 0;
  let height = 0;
  const idatChunks = [];
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString('ascii');
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
    } else if (type === 'IDAT') {
      idatChunks.push(data);
    } else if (type === 'IEND') {
      break;
    }
    offset += 12 + length;
  }
  const inflated = zlib.inflateSync(Buffer.concat(idatChunks));
  return { width, height, data: inflated };
}

function main() {
  if (!fs.existsSync(APPROVED_DIR)) {
    console.log('[visual-diff-png] No visual-baselines/approved directory yet. Skipping PNG check.');
    process.exit(0);
  }
  const baselines = fs.readdirSync(APPROVED_DIR).filter((f) => f.endsWith('.png'));
  if (baselines.length === 0) {
    console.log('[visual-diff-png] No PNG baselines present in visual-baselines/approved.');
    process.exit(0);
  }

  let failures = 0;
  for (const file of baselines) {
    const baselinePath = path.join(APPROVED_DIR, file);
    const candidatePath = path.join(CANDIDATE_DIR, file);
    if (!fs.existsSync(candidatePath)) {
      console.error(`❌ Missing candidate screenshot: ${candidatePath}`);
      failures += 1;
      continue;
    }

    const base = parsePng(fs.readFileSync(baselinePath));
    const cand = parsePng(fs.readFileSync(candidatePath));
    if (base.width !== cand.width || base.height !== cand.height) {
      console.error(
        `❌ Dimension mismatch for ${file}: expected ${base.width}x${base.height}, got ${cand.width}x${cand.height}`
      );
      failures += 1;
      continue;
    }

    const len = Math.min(base.data.length, cand.data.length);
    let diffBytes = Math.abs(base.data.length - cand.data.length);
    for (let i = 0; i < len; i += 1) {
      if (Math.abs(base.data[i] - cand.data[i]) > 3) {
        diffBytes += 1;
      }
    }
    const ratio = diffBytes / Math.max(1, base.data.length);
    if (ratio > MAX_BYTE_DIFF_RATIO) {
      console.error(`❌ Visual pixel diff ${(ratio * 100).toFixed(2)}% in ${file} exceeds ${(MAX_BYTE_DIFF_RATIO * 100).toFixed(2)}%`);
      failures += 1;
    } else {
      console.log(`✅ ${file}: ${(ratio * 100).toFixed(3)}% pixel delta`);
    }
  }

  if (failures > 0) {
    process.exit(1);
  }
}

main();

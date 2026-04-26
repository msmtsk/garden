#!/usr/bin/env node
/**
 * Watermark script for Mary's Garden
 *
 * Places a single semi-transparent signature in the lower-right quadrant,
 * offset inward from the corner (roughly 60-65% down, 70% across).
 *
 * Usage:
 *   node scripts/watermark.js                  <- all images in public/images/
 *   node scripts/watermark.js path/to/img.jpg  <- specific file(s)
 */

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const CONFIG = {
  text: 'Maria',

  // Position: fraction of image dimensions (0 = top/left, 1 = bottom/right)
  xFraction: 0.72,   // how far right (0.72 = right of center, not at the edge)
  yFraction: 0.62,   // how far down  (0.62 = just below vertical center)

  fontSize: 36,
  fontFamily: 'serif',
  color: 'rgba(160, 90, 160, 0.55)',   // semi-transparent violet
  rotation: -20,                        // slight diagonal tilt
};
// ─────────────────────────────────────────────────────────────────────────────

import sharp from 'sharp';
import { readdir, writeFile, readFile } from 'fs/promises';
import { join, extname, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');
const IMAGES_DIR   = join(PROJECT_ROOT, 'public', 'images');
const IMAGE_EXTS   = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const WM_MARKER    = 'mg-watermarked';

async function collectImages(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const results = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...await collectImages(full));
    } else if (IMAGE_EXTS.has(extname(entry.name).toLowerCase())) {
      results.push(full);
    }
  }
  return results;
}

async function isAlreadyWatermarked(filePath) {
  try {
    const meta = await sharp(filePath).metadata();
    if (meta.exif) {
      const str = meta.exif.toString('latin1');
      if (str.includes(WM_MARKER)) return true;
    }
    return false;
  } catch {
    return false;
  }
}

function buildWatermarkSvg(width, height) {
  const { text, xFraction, yFraction, fontSize, fontFamily, color, rotation } = CONFIG;

  const cx = Math.round(width  * xFraction);
  const cy = Math.round(height * yFraction);

  // Outer SVG — full image size for compositing
  return Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">` +
    `<text ` +
      `x="${cx}" y="${cy}" ` +
      `font-size="${fontSize}" ` +
      `font-family="${fontFamily}" ` +
      `font-style="italic" ` +
      `fill="${color}" ` +
      `text-anchor="middle" ` +
      `dominant-baseline="middle" ` +
      `transform="rotate(${rotation}, ${cx}, ${cy})"` +
    `>${text}</text>` +
    `</svg>`
  );
}

async function watermarkImage(filePath) {
  if (await isAlreadyWatermarked(filePath)) {
    console.log(`⏭  ${filePath.replace(PROJECT_ROOT + '/', '')} (уже размечено, пропущено)`);
    return;
  }

  const fileBuffer = await readFile(filePath);
  const img  = sharp(fileBuffer);
  const meta = await img.metadata();
  const svg  = buildWatermarkSvg(meta.width, meta.height);

  const buf = await img
    .composite([{ input: svg, top: 0, left: 0 }])
    .toBuffer();

  const outBuf = await sharp(buf)
    .withMetadata({ exif: { IFD0: { ImageDescription: WM_MARKER } } })
    .toBuffer();

  // writeFile вместо sharp.toFile — обходит блокировку файла на Windows
  await writeFile(filePath, outBuf);

  console.log(`✓  ${filePath.replace(PROJECT_ROOT + '/', '')}`);
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
const args    = process.argv.slice(2);
const targets = args.length > 0
  ? args.map(f => resolve(f))
  : await collectImages(IMAGES_DIR);

if (targets.length === 0) {
  console.log('Изображений не найдено.');
  process.exit(0);
}

console.log(`Обрабатываю ${targets.length} файл(ов)...`);
for (const file of targets) {
  try {
    await watermarkImage(file);
  } catch (err) {
    console.error(`✗  ${file}: ${err.message}`);
    process.exit(1);
  }
}
console.log('Готово.');

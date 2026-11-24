/* Whole Truth Maps - offline renderer.
   node tools/render.js <city>                        -> tools/out/<city>-day.png + <city>-night.png (add "alpha" for a transparent background)
   node tools/render.js <city> x y w h scale [night] [name] -> tools/out/<name>.png, nearest-neighbour upscaled */
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const cityId = process.argv[2];
if (!['kolkata', 'bengaluru'].includes(cityId)) { console.error('Usage: node tools/render.js kolkata|bengaluru [x y w h scale [night] [name]]'); process.exit(1); }
process.argv.splice(2, 1);
const alpha = process.argv[2] === 'alpha';
require(`../${cityId}/config.js`);
require('../shared/engine.js');
require(`../${cityId}/layout.js`);
require(`../${cityId}/city.js`);
const PK = globalThis.PK;
const E = PK.E;

const crcT = new Uint32Array(256);
for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crcT[n] = c >>> 0; }
function crc32(buf) { let c = 0xffffffff; for (let i = 0; i < buf.length; i++) c = crcT[(c ^ buf[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(w, h, rgba) { // rgba: Buffer w*h*4
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4); }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 6 })), chunk('IEND', Buffer.alloc(0))]);
}
const BG = alpha ? 0 : E.C('#2b2a3a');
function toBuf(src) { // Uint32 ABGR(LE) -> RGBA bytes, unpainted = dark background
  const out = new Uint32Array(src.length);
  for (let k = 0; k < src.length; k++) out[k] = src[k] ? src[k] : BG;
  return Buffer.from(out.buffer);
}
function crop(buf, W, x, y, w, h, s) {
  const o = Buffer.alloc(w * s * h * s * 4);
  for (let yy = 0; yy < h * s; yy++) for (let xx = 0; xx < w * s; xx++) {
    const sxp = x + ((xx / s) | 0), syp = y + ((yy / s) | 0), k = (syp * W + sxp) * 4, d = (yy * w * s + xx) * 4;
    if (sxp < 0 || syp < 0 || sxp >= W || syp >= E.H) { o[d] = 0; o[d + 1] = 0; o[d + 2] = 0; o[d + 3] = 255; continue; }
    buf.copy(o, d, k, k + 4);
  }
  return o;
}

const t0 = Date.now();
PK.city.build();
console.log('build time ' + (Date.now() - t0) + ' ms  (' + E.W + 'x' + E.H + ')');
const outDir = path.join(__dirname, 'out');
fs.mkdirSync(outDir, { recursive: true });
const day = toBuf(E.col);
const args = process.argv.slice(2).map(Number);
if (args.length >= 5 && args.every((v, i) => i >= 5 || !isNaN(v))) {
  const night = process.argv[7] === 'night';
  const src = night ? toBuf(E.makeNight(E.finalizeLights())) : day;
  const [x, y, w, h, s] = args;
  const name = process.argv[8] || 'crop';   // optional 7th arg: output basename
  fs.writeFileSync(path.join(outDir, name + '.png'), png(w * s, h * s, crop(src, E.W, x, y, w, h, s)));
  console.log('wrote ' + name + '.png ' + w * s + 'x' + h * s);
} else {
  fs.writeFileSync(path.join(outDir, cityId + '-day.png'), png(E.W, E.H, day));
  fs.writeFileSync(path.join(outDir, cityId + '-night.png'), png(E.W, E.H, toBuf(E.makeNight(E.finalizeLights()))));
  console.log('wrote ' + cityId + '-day.png and ' + cityId + '-night.png');
}

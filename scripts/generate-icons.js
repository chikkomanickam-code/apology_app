import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPNG(width, height, drawFn) {
  // RGBA buffer
  const buffer = Buffer.alloc(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      buffer[idx] = r;
      buffer[idx + 1] = g;
      buffer[idx + 2] = b;
      buffer[idx + 3] = a;
    }
  }

  // PNG raw scanlines (1 filter byte per row = 0)
  const scanlineBuffer = Buffer.alloc(height * (width * 4 + 1));
  let scanIdx = 0;
  for (let y = 0; y < height; y++) {
    scanlineBuffer[scanIdx++] = 0; // Filter type 0
    buffer.copy(scanlineBuffer, scanIdx, y * width * 4, (y + 1) * width * 4);
    scanIdx += width * 4;
  }

  const deflated = zlib.deflateSync(scanlineBuffer);

  // PNG structure
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const toCrc = Buffer.concat([typeBuf, data]);
    crcBuf.writeUInt32BE(crc32(toCrc), 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  // CRC32 table
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    crcTable[n] = c;
  }

  function crc32(buf) {
    let crc = -1;
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ -1) >>> 0;
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth
  ihdr[9] = 6; // Color type 6 (RGBA)
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflated),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

// Draw lavender romance icon with heart & sparkle
function drawRomanceIcon(x, y, w, h) {
  const nx = (x / w) * 2 - 1; // -1 to 1
  const ny = (y / h) * 2 - 1;

  // Background rounded squircle / gradient
  const distFromCenter = Math.sqrt(nx * nx + ny * ny);
  
  // Base background: dreamy gradient from #6D28D9 (deep purple) to #C8A2E8 (primary lavender)
  const t = (nx + ny + 2) / 4;
  let bgR = Math.round(109 + (200 - 109) * t);
  let bgG = Math.round(40 + (162 - 40) * t);
  let bgB = Math.round(217 + (232 - 217) * t);

  // Heart formula: (x^2 + (y - 0.2)^2 - 0.4)^3 - x^2 * (y - 0.2)^3 <= 0
  const hx = nx * 1.5;
  const hy = -ny * 1.5 + 0.15; // Invert y for math coordinates
  const heartVal = Math.pow(hx * hx + hy * hy - 0.65, 3) - hx * hx * Math.pow(hy, 3);

  if (heartVal <= 0.05) {
    // Inside or border of heart
    if (heartVal <= -0.05) {
      // Pure heart center: soft lavender white/pink gradient
      const pinkT = (hy + 1) / 2;
      return [
        Math.round(255 - 10 * pinkT),
        Math.round(230 + 15 * pinkT),
        Math.round(245 + 10 * pinkT),
        255
      ];
    } else {
      // Golden / soft glowing edge
      return [246, 201, 229, 255]; // Romantic pink
    }
  }

  return [bgR, bgG, bgB, 255];
}

const publicDir = path.resolve('./public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPNG(192, 192, drawRomanceIcon));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPNG(512, 512, drawRomanceIcon));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPNG(180, 180, drawRomanceIcon));
console.log('Successfully generated PWA PNG icons!');

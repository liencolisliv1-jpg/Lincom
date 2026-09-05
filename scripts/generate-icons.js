import fs from 'fs';
import zlib from 'zlib';

function createSolidPng(width, height, r, g, b, a = 255) {
  // Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth: 8
  ihdrData[9] = 6; // Color type: 6 (RGBA)
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Raw image data with filter byte 0 at start of each scanline
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // None filter
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      // Border or background check for subtle rounded card
      const dx = x - width / 2;
      const dy = y - height / 2;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < width * 0.35) {
        // Inner amber badge
        rawData[pixelOffset] = 245;     // R
        rawData[pixelOffset + 1] = 158; // G
        rawData[pixelOffset + 2] = 11;  // B
        rawData[pixelOffset + 3] = 255; // A
      } else {
        // Background slate #0B192C
        rawData[pixelOffset] = 11;
        rawData[pixelOffset + 1] = 25;
        rawData[pixelOffset + 2] = 44;
        rawData[pixelOffset + 3] = 255;
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const length = data.length;
  const buffer = Buffer.alloc(4 + 4 + length + 4);
  buffer.writeUInt32BE(length, 0);
  buffer.write(type, 4, 4, 'ascii');
  data.copy(buffer, 8);

  const crc = crc32(buffer.subarray(4, 8 + length));
  buffer.writeUInt32BE(crc >>> 0, 8 + length);
  return buffer;
}

// Standard CRC32 calculation
function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    const byte = buf[i];
    crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

const crcTable = new Int32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[i] = c;
}

fs.writeFileSync('public/icon-192.png', createSolidPng(192, 192, 11, 25, 44));
fs.writeFileSync('public/icon-512.png', createSolidPng(512, 512, 11, 25, 44));
fs.writeFileSync('public/apple-touch-icon.png', createSolidPng(180, 180, 11, 25, 44));
console.log('PNG Icons successfully generated in public/ !');

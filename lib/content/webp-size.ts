/**
 * The pixel size a WebP file declares in its header, or null when the bytes are not a WebP image.
 *
 * Content validation compares it with the size the registry declares, so the box the page
 * reserves for a picture is the box the picture fills (no layout shift), and the media generator
 * records it from the file rather than from anyone's memory. No image library is needed: the
 * three WebP encodings each store the size at a fixed place in the first thirty bytes.
 */
export function webpSize(bytes: Uint8Array): { width: number; height: number } | null {
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.subarray(from, to));
  if (bytes.length < 30 || ascii(0, 4) !== "RIFF" || ascii(8, 12) !== "WEBP") return null;
  const u16 = (at: number) => bytes[at]! | (bytes[at + 1]! << 8);
  const u24 = (at: number) => u16(at) | (bytes[at + 2]! << 16);
  switch (ascii(12, 16)) {
    // Extended format: canvas size minus one, 24 bits each.
    case "VP8X":
      return { width: u24(24) + 1, height: u24(27) + 1 };
    // Lossy: a key frame starts with the code 9d 01 2a, then 14-bit width and height.
    case "VP8 ":
      if (bytes[23] !== 0x9d || bytes[24] !== 0x01 || bytes[25] !== 0x2a) return null;
      return { width: u16(26) & 0x3fff, height: u16(28) & 0x3fff };
    // Lossless: signature 0x2f, then width minus one and height minus one, 14 bits each.
    case "VP8L": {
      if (bytes[20] !== 0x2f) return null;
      const bits = (u24(21) | (bytes[24]! << 24)) >>> 0;
      return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
    }
    default:
      return null;
  }
}

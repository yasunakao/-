
/**
 * Converts sRGB to CIE Lab.
 * Based on standard formulas.
 * The paper uses an offset 'b_median' where the threshold is 133.6.
 * Standard Lab b* ranges from -128 to 127.
 * Offset version = b* + 128.
 */
export const calculateMedianBChannel = (ctx: CanvasRenderingContext2D, width: number, height: number): number => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;
  const bValues: number[] = [];

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i] / 255;
    const g = pixels[i + 1] / 255;
    const b = pixels[i + 2] / 255;

    // 1. RGB to XYZ (D65 Illuminant)
    let rL = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    let gL = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    let bL = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

    rL *= 100; gL *= 100; bL *= 100;

    const x = rL * 0.4124 + gL * 0.3576 + bL * 0.1805;
    const y = rL * 0.2126 + gL * 0.7152 + bL * 0.0722;
    const z = rL * 0.0193 + gL * 0.1192 + bL * 0.9505;

    // 2. XYZ to Lab
    const xN = 95.047;
    const yN = 100.000;
    const zN = 108.883;

    const f = (t: number) => t > 0.008856 ? Math.pow(t, 1/3) : (7.787 * t) + (16 / 116);

    // const lStar = 116 * f(y / yN) - 16;
    // const aStar = 500 * (f(x / xN) - f(y / yN));
    const bStar = 200 * (f(y / yN) - f(z / zN));

    // Map b* (-128 to 127) to (0 to 255) to match the paper's offset implementation
    // The paper's b_median values are around 130-150.
    bValues.push(bStar + 128);
  }

  if (bValues.length === 0) return 0;

  // Calculate Median
  bValues.sort((a, b) => a - b);
  const mid = Math.floor(bValues.length / 2);
  return bValues.length % 2 !== 0 ? bValues[mid] : (bValues[mid - 1] + bValues[mid]) / 2;
};

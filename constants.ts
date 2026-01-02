
// Optimal cutoff identified in the paper: 133.6 (Youden-derived)
// Range for Normal: < 133.6
// TSB >= 2.0 mg/dL: Subclinical
// TSB >= 3.0 mg/dL: Overt Jaundice
export const B_CHANNEL_THRESHOLD = 133.6;

// Based on the paper's linear relationship (Approximate mapping from Figure 3)
// b_median = 133.6 roughly corresponds to TSB = 2.0
// b_median = 140 roughly corresponds to TSB = 4.0
export const getBilirubinEstimate = (b: number): number => {
  // Rough linear fit from data: TSB ≈ 0.31 * (b - 127) - 1.0 (approximate)
  // Let's use a simpler mapping based on thresholds
  if (b < 125) return 0.8;
  return Math.max(0.5, (b - 133.6) * 0.3 + 2.0);
};

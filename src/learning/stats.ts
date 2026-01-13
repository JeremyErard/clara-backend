/**
 * Statistical Analysis for A/B Testing
 *
 * Z-test for proportions with significance calculation
 */

export interface VariantStats {
  name: string;
  conversions: number;
  total: number;
  rate: number;
}

export interface SignificanceResult {
  significant: boolean;
  pValue: number;
  lift: number;
  confidenceInterval: [number, number];
  winner: string | null;
  recommendation: string;
}

/**
 * Approximation of standard normal CDF
 */
function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);

  const t = 1 / (1 + p * x);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1 + sign * y);
}

/**
 * Calculate statistical significance between control and variant
 * Uses Z-test for proportions
 */
export function calculateSignificance(
  control: VariantStats,
  variant: VariantStats,
  confidenceLevel: number = 0.95
): SignificanceResult {
  const p1 = control.rate;
  const p2 = variant.rate;
  const n1 = control.total;
  const n2 = variant.total;

  // Handle edge cases
  if (n1 === 0 || n2 === 0) {
    return {
      significant: false,
      pValue: 1,
      lift: 0,
      confidenceInterval: [0, 0],
      winner: null,
      recommendation: 'Insufficient data to determine significance',
    };
  }

  // Pooled proportion
  const pooledP = (control.conversions + variant.conversions) / (n1 + n2);

  // Standard error (handle zero pooled proportion)
  const se = pooledP === 0 || pooledP === 1
    ? 0.0001 // Small value to avoid division by zero
    : Math.sqrt(pooledP * (1 - pooledP) * (1 / n1 + 1 / n2));

  // Z-score
  const z = (p2 - p1) / se;

  // P-value (two-tailed)
  const pValue = 2 * (1 - normalCDF(Math.abs(z)));

  // Confidence interval for the difference
  const zCritical = 1.96; // 95% confidence
  const seDiff = Math.sqrt((p1 * (1 - p1) / n1) + (p2 * (1 - p2) / n2));
  const ci: [number, number] = [
    (p2 - p1) - zCritical * seDiff,
    (p2 - p1) + zCritical * seDiff,
  ];

  // Calculate lift percentage
  const lift = p1 > 0 ? ((p2 - p1) / p1) * 100 : 0;

  // Determine significance
  const significant = pValue < (1 - confidenceLevel);

  // Determine winner and recommendation
  let winner: string | null = null;
  let recommendation: string;

  if (significant) {
    winner = p2 > p1 ? variant.name : control.name;
    const liftStr = Math.abs(lift).toFixed(1);
    if (p2 > p1) {
      recommendation = `${variant.name} outperforms ${control.name} by ${liftStr}%. Consider adopting the variant.`;
    } else {
      recommendation = `${control.name} outperforms ${variant.name} by ${liftStr}%. Keep the control.`;
    }
  } else {
    recommendation = `No statistically significant difference detected. Need more data or the variants perform similarly.`;
  }

  return {
    significant,
    pValue,
    lift,
    confidenceInterval: ci,
    winner,
    recommendation,
  };
}

/**
 * Calculate required sample size for desired power
 */
export function calculateRequiredSampleSize(
  baselineRate: number,
  minimumDetectableEffect: number,
  power: number = 0.8,
  alpha: number = 0.05
): number {
  const p1 = baselineRate;
  const p2 = baselineRate * (1 + minimumDetectableEffect);

  // Z values for alpha and power
  const zAlpha = 1.96; // two-tailed 95%
  const zBeta = 0.84; // 80% power

  const pooledP = (p1 + p2) / 2;
  const numerator = Math.pow(zAlpha * Math.sqrt(2 * pooledP * (1 - pooledP)) +
                            zBeta * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2)), 2);
  const denominator = Math.pow(p2 - p1, 2);

  return Math.ceil(numerator / denominator);
}

/**
 * Generate experiment summary
 */
export function generateExperimentSummary(
  control: VariantStats,
  variants: VariantStats[]
): {
  summary: string;
  results: SignificanceResult[];
  overallRecommendation: string;
} {
  const results = variants.map(v => calculateSignificance(control, v));

  const winners = results.filter(r => r.significant && r.winner !== control.name);

  let overallRecommendation: string;
  if (winners.length === 0) {
    overallRecommendation = 'No variants significantly outperform the control. Continue testing or keep current approach.';
  } else if (winners.length === 1) {
    overallRecommendation = `${winners[0].winner} is the clear winner. Consider implementing this variant.`;
  } else {
    const bestLift = Math.max(...winners.map(w => w.lift));
    const bestWinner = winners.find(w => w.lift === bestLift);
    overallRecommendation = `Multiple winning variants. ${bestWinner?.winner} has the highest lift (${bestLift.toFixed(1)}%).`;
  }

  const summary = `
Experiment Results:
- Control: ${control.name} (${(control.rate * 100).toFixed(2)}% conversion, n=${control.total})
${variants.map((v, i) => `- ${v.name}: ${(v.rate * 100).toFixed(2)}% conversion, n=${v.total}, lift=${results[i].lift.toFixed(1)}%`).join('\n')}
  `.trim();

  return { summary, results, overallRecommendation };
}

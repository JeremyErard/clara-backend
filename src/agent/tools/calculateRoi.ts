/**
 * Calculate ROI Tool
 *
 * Calculates AI workforce optimization opportunity
 */

import type { ToolContext, ToolResult } from './index.js';

interface CalculateRoiInput {
  employeeCount: number;
  averageSalary?: number;
  efficiencyGain?: number;
}

export async function handleCalculateRoi(
  input: CalculateRoiInput,
  context: ToolContext
): Promise<ToolResult> {
  const { employeeCount, averageSalary = 60000, efficiencyGain = 0.20 } = input;

  // Calculate annual capacity opportunity
  const annualCapacity = employeeCount * averageSalary * efficiencyGain;

  // Format as millions
  const capacityInMillions = annualCapacity / 1000000;
  const formattedCapacity = capacityInMillions >= 1
    ? `$${capacityInMillions.toFixed(1)} million`
    : `$${(annualCapacity / 1000).toFixed(0)}K`;

  // Assessment investment context
  const assessmentCost = 25000;
  const roiMultiple = Math.round(annualCapacity / assessmentCost);

  // Conservative vs optimistic scenarios
  const conservativeGain = employeeCount * averageSalary * 0.15;
  const optimisticGain = employeeCount * averageSalary * 0.25;

  const result = {
    employeeCount,
    averageSalary,
    efficiencyGain: `${(efficiencyGain * 100).toFixed(0)}%`,

    annualCapacityOpportunity: annualCapacity,
    formattedCapacity,

    assessmentInvestment: assessmentCost,
    roiMultiple: `${roiMultiple}x`,

    scenarios: {
      conservative: {
        gain: '15%',
        opportunity: `$${(conservativeGain / 1000000).toFixed(1)} million`,
      },
      expected: {
        gain: '20%',
        opportunity: formattedCapacity,
      },
      optimistic: {
        gain: '25%',
        opportunity: `$${(optimisticGain / 1000000).toFixed(1)} million`,
      },
    },

    context: `At ${employeeCount.toLocaleString()} employees with a ${(efficiencyGain * 100).toFixed(0)}% efficiency gain, that's ${formattedCapacity} in annual capacity opportunity. The assessment investment of $25K represents a ${roiMultiple}x return.`,
  };

  return {
    success: true,
    data: result,
    message: result.context,
    displayToUser: true,
  };
}

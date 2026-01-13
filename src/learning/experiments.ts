/**
 * Experiments Configuration System
 *
 * Manages A/B testing experiments for Clara
 */

import { prisma } from '../lib/prisma.js';
import { assignVariant, applyPromptModification, type ExperimentConfig, type VariantConfig } from './variant-assignment.js';

/**
 * Get the currently active experiment (if any)
 */
export async function getActiveExperiment(): Promise<ExperimentConfig | null> {
  const experiment = await prisma.experiment.findFirst({
    where: { status: 'active' },
    include: {
      variants: true,
    },
  });

  if (!experiment) return null;

  return {
    id: experiment.id,
    name: experiment.name,
    description: experiment.description || '',
    variants: experiment.variants.map(v => ({
      name: v.name,
      weight: v.weight,
      promptModification: v.promptDiff as any,
    })),
    targetSampleSize: experiment.targetSize ?? 100,
    successMetric: 'qualified_rate',
  };
}

/**
 * Assign a variant to a session and return the modified prompt
 */
export async function getExperimentVariant(
  sessionId: string,
  basePrompt: string
): Promise<{
  experimentId: string | null;
  variantId: string | null;
  variantName: string | null;
  modifiedPrompt: string;
}> {
  const experiment = await getActiveExperiment();

  if (!experiment) {
    return {
      experimentId: null,
      variantId: null,
      variantName: null,
      modifiedPrompt: basePrompt,
    };
  }

  // Assign variant based on session
  const variantName = assignVariant(sessionId, experiment);

  // Find the variant config
  const variantConfig = experiment.variants.find(v => v.name === variantName);

  if (!variantConfig) {
    return {
      experimentId: experiment.id,
      variantId: null,
      variantName: null,
      modifiedPrompt: basePrompt,
    };
  }

  // Look up the variant ID from the database
  const dbVariant = await prisma.variant.findFirst({
    where: {
      experiment: { id: experiment.id },
      name: variantName,
    },
  });

  // Apply prompt modification
  const modifiedPrompt = applyPromptModification(basePrompt, variantConfig.promptModification);

  return {
    experimentId: experiment.id,
    variantId: dbVariant?.id || null,
    variantName,
    modifiedPrompt,
  };
}

/**
 * Create a new experiment
 */
export async function createExperiment(config: {
  name: string;
  description?: string;
  targetSize?: number;
  variants: {
    name: string;
    description?: string;
    weight: number;
    promptModification: {
      type: 'replace' | 'append' | 'prepend';
      section?: string;
      content: string;
    };
  }[];
}): Promise<string> {
  const experiment = await prisma.experiment.create({
    data: {
      name: config.name,
      description: config.description,
      targetSize: config.targetSize || 100,
      status: 'draft',
      variants: {
        create: config.variants.map(v => ({
          name: v.name,
          description: v.description,
          weight: v.weight,
          promptDiff: v.promptModification,
        })),
      },
    },
  });

  return experiment.id;
}

/**
 * Activate an experiment
 */
export async function activateExperiment(experimentId: string): Promise<boolean> {
  // Pause any currently active experiments
  await prisma.experiment.updateMany({
    where: { status: 'active' },
    data: { status: 'paused' },
  });

  // Activate the target experiment
  await prisma.experiment.update({
    where: { id: experimentId },
    data: {
      status: 'active',
      startedAt: new Date(),
    },
  });

  return true;
}

/**
 * Pause an experiment
 */
export async function pauseExperiment(experimentId: string): Promise<boolean> {
  await prisma.experiment.update({
    where: { id: experimentId },
    data: { status: 'paused' },
  });

  return true;
}

/**
 * Complete an experiment
 */
export async function completeExperiment(experimentId: string): Promise<boolean> {
  await prisma.experiment.update({
    where: { id: experimentId },
    data: {
      status: 'completed',
      endedAt: new Date(),
    },
  });

  return true;
}

/**
 * Example experiments that can be created
 */
export const EXAMPLE_EXPERIMENTS = {
  greetingStyle: {
    name: 'Greeting Style Test',
    description: 'Testing warm vs. direct opening style',
    variants: [
      {
        name: 'control',
        description: 'Current warm greeting style',
        weight: 50,
        promptModification: { type: 'replace' as const, section: '', content: '' },
      },
      {
        name: 'direct_opener',
        description: 'Start with a direct question about their challenge',
        weight: 50,
        promptModification: {
          type: 'append' as const,
          section: 'RESPONSE STYLE',
          content: '\n- On the FIRST message only, skip the greeting and ask directly: "What challenge brought you to SDI today?"',
        },
      },
    ],
  },

  specificityTest: {
    name: 'Specificity Test',
    description: 'Testing whether more specific details improve conversion',
    variants: [
      {
        name: 'control',
        description: 'Current level of detail',
        weight: 50,
        promptModification: { type: 'replace' as const, section: '', content: '' },
      },
      {
        name: 'high_specificity',
        description: 'Include more specific numbers and examples',
        weight: 50,
        promptModification: {
          type: 'append' as const,
          section: 'RESPONSE STYLE',
          content: '\n- Always include specific numbers: "$25K", "5 weeks", "20% efficiency", not vague terms\n- When mentioning Big 5, say "Deloitte or McKinsey" specifically',
        },
      },
    ],
  },
};

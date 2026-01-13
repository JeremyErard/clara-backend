/**
 * Variant Assignment for A/B Testing
 *
 * Deterministic assignment based on session ID hash
 */

import { createHash } from 'crypto';

export interface ExperimentConfig {
  id: string;
  name: string;
  description: string;
  variants: VariantConfig[];
  targetSampleSize: number;
  successMetric: 'scheduled_rate' | 'qualified_rate' | 'engagement';
}

export interface VariantConfig {
  name: string;
  weight: number;
  promptModification: PromptModification;
}

export interface PromptModification {
  type: 'replace' | 'append' | 'prepend';
  section?: string;
  content: string;
}

/**
 * Deterministic variant assignment based on session ID
 * Ensures same visitor always gets same variant across sessions
 */
export function assignVariant(
  sessionId: string,
  experiment: ExperimentConfig
): string {
  // Hash the session ID + experiment ID for deterministic assignment
  const hash = createHash('sha256')
    .update(`${sessionId}:${experiment.id}`)
    .digest('hex');

  // Convert first 8 chars to number (0-4294967295)
  const hashNum = parseInt(hash.substring(0, 8), 16);

  // Normalize to 0-100
  const bucket = hashNum % 100;

  // Assign based on cumulative weights
  let cumulative = 0;
  for (const variant of experiment.variants) {
    cumulative += variant.weight;
    if (bucket < cumulative) {
      return variant.name;
    }
  }

  // Fallback to first variant (control)
  return experiment.variants[0]?.name || 'control';
}

/**
 * Apply prompt modification based on variant
 */
export function applyPromptModification(
  basePrompt: string,
  modification: PromptModification
): string {
  if (!modification.content) return basePrompt;

  switch (modification.type) {
    case 'append':
      if (modification.section) {
        // Find section and append after it
        const sectionRegex = new RegExp(`(## ${modification.section}[\\s\\S]*?)(?=\\n## |$)`);
        return basePrompt.replace(sectionRegex, `$1\n${modification.content}`);
      }
      return basePrompt + '\n' + modification.content;

    case 'prepend':
      if (modification.section) {
        const sectionRegex = new RegExp(`(## ${modification.section})`);
        return basePrompt.replace(sectionRegex, `${modification.content}\n$1`);
      }
      return modification.content + '\n' + basePrompt;

    case 'replace':
      if (modification.section) {
        const sectionRegex = new RegExp(`## ${modification.section}[\\s\\S]*?(?=\\n## |$)`);
        return basePrompt.replace(sectionRegex, `## ${modification.section}\n${modification.content}`);
      }
      return modification.content;

    default:
      return basePrompt;
  }
}

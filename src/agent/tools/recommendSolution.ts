/**
 * Recommend Solution Tool
 *
 * Formally recommends an SDI solution based on discovery
 */

import type { ToolContext, ToolResult } from './index.js';

interface RecommendSolutionInput {
  solution: 'ai-assessment' | 'outsourced-ld' | 'talent-consulting' | 'training-solutions';
  reason: string;
  keyBenefits?: string[];
}

const SOLUTION_DETAILS = {
  'ai-assessment': {
    name: 'AI Workforce Assessment',
    tagline: 'Find the capacity you didn\'t know you had',
    url: '/agentic-assessment',
    highlights: [
      '5 weeks, board-ready deliverables',
      'Starting at $25K (vs. Big 5\'s $250K+)',
      'Process mapping, task segmentation, implementation roadmap',
    ],
    nextStep: 'executive-briefing',
  },
  'outsourced-ld': {
    name: 'Outsourced L&D',
    tagline: 'Enterprise L&D capabilities at mid-market investment',
    url: '/outsourced-ld',
    highlights: [
      'Full L&D for the cost of a training coordinator',
      'Strategy, design, development, delivery, measurement',
      '94% of employees stay longer with development investment',
    ],
    nextStep: 'discovery-call',
  },
  'talent-consulting': {
    name: 'Talent Consulting',
    tagline: 'Strategic transformation that actually transforms',
    url: '/talent-development/talent-consulting',
    highlights: [
      'Discover → Design → Deliver → Sustain methodology',
      'Implementation support, not just recommendations',
      '20+ years of organizational transformation expertise',
    ],
    nextStep: 'discovery-call',
  },
  'training-solutions': {
    name: 'Training Solutions',
    tagline: 'Award-winning training that drives behavior change',
    url: '/training-materials',
    highlights: [
      'eLearning, ILT/VILT, motion graphics',
      'Multiple Telly Award winners',
      'Custom design, not off-the-shelf',
    ],
    nextStep: 'project-scoping',
  },
};

export async function handleRecommendSolution(
  input: RecommendSolutionInput,
  context: ToolContext
): Promise<ToolResult> {
  const { solution, reason, keyBenefits } = input;

  const details = SOLUTION_DETAILS[solution];

  if (!details) {
    return {
      success: false,
      message: 'Unknown solution type',
      displayToUser: false,
    };
  }

  const recommendation = {
    solution: details.name,
    tagline: details.tagline,
    url: details.url,
    reason,
    benefits: keyBenefits || details.highlights,
    suggestedNextStep: details.nextStep,
  };

  return {
    success: true,
    data: recommendation,
    message: `Based on your situation, I recommend ${details.name}: ${reason}`,
    displayToUser: true,
  };
}

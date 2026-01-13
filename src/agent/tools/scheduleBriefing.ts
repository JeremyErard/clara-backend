/**
 * Schedule Briefing Tool
 *
 * Presents scheduling options for qualified leads
 */

import type { ToolContext, ToolResult } from './index.js';

interface ScheduleBriefingInput {
  briefingType: 'executive-briefing' | 'discovery-call' | 'project-scoping';
  context?: string;
}

const BRIEFING_TYPES = {
  'executive-briefing': {
    title: 'Executive Briefing',
    description: 'A 30-minute call to discuss your specific situation and explore how SDI can help.',
    duration: '30 minutes',
    calendlyUrl: 'https://calendly.com/sdi-clarity/executive-briefing',
    bestFor: 'C-Suite and senior leaders exploring AI workforce optimization',
  },
  'discovery-call': {
    title: 'Discovery Call',
    description: 'A conversation to understand your challenges and discuss potential solutions.',
    duration: '30 minutes',
    calendlyUrl: 'https://calendly.com/sdi-clarity/executive-briefing',
    bestFor: 'HR and L&D leaders exploring outsourced partnerships',
  },
  'project-scoping': {
    title: 'Project Scoping Call',
    description: 'Let\'s discuss your specific training project and provide a tailored proposal.',
    duration: '30 minutes',
    calendlyUrl: 'https://calendly.com/sdi-clarity/executive-briefing',
    bestFor: 'L&D teams with specific training content needs',
  },
};

export async function handleScheduleBriefing(
  input: ScheduleBriefingInput,
  context: ToolContext
): Promise<ToolResult> {
  const { briefingType, context: callContext } = input;

  const briefingInfo = BRIEFING_TYPES[briefingType];

  if (!briefingInfo) {
    return {
      success: false,
      message: 'Unknown briefing type',
      displayToUser: false,
    };
  }

  return {
    success: true,
    data: {
      type: briefingType,
      title: briefingInfo.title,
      description: briefingInfo.description,
      duration: briefingInfo.duration,
      calendlyUrl: briefingInfo.calendlyUrl,
      context: callContext,
    },
    message: `Would you like to schedule a ${briefingInfo.title}? It's ${briefingInfo.duration} to discuss your specific situation.`,
    displayToUser: true,
  };
}

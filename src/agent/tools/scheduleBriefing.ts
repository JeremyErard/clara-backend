/**
 * Schedule Briefing Tool
 *
 * Presents scheduling options for qualified leads with tracking
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
    baseCalendlyUrl: 'https://calendly.com/sdi-clarity/executive-briefing',
    bestFor: 'C-Suite and senior leaders exploring AI workforce optimization',
  },
  'discovery-call': {
    title: 'Discovery Call',
    description: 'A conversation to understand your challenges and discuss potential solutions.',
    duration: '30 minutes',
    baseCalendlyUrl: 'https://calendly.com/sdi-clarity/executive-briefing',
    bestFor: 'HR and L&D leaders exploring outsourced partnerships',
  },
  'project-scoping': {
    title: 'Project Scoping Call',
    description: "Let's discuss your specific training project and provide a tailored proposal.",
    duration: '30 minutes',
    baseCalendlyUrl: 'https://calendly.com/sdi-clarity/executive-briefing',
    bestFor: 'L&D teams with specific training content needs',
  },
};

/**
 * Build Calendly URL with tracking parameters
 */
function buildCalendlyUrl(baseUrl: string, conversationId: string, briefingType: string): string {
  const params = new URLSearchParams({
    utm_source: 'clara',
    utm_medium: 'chat',
    utm_campaign: briefingType,
    utm_content: conversationId,
  });
  return `${baseUrl}?${params.toString()}`;
}

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

  // Build URL with tracking parameters
  const calendlyUrl = buildCalendlyUrl(
    briefingInfo.baseCalendlyUrl,
    context.conversationId,
    briefingType
  );

  return {
    success: true,
    data: {
      type: briefingType,
      title: briefingInfo.title,
      description: briefingInfo.description,
      duration: briefingInfo.duration,
      calendlyUrl: calendlyUrl,
      context: callContext,
    },
    message: `Would you like to schedule a ${briefingInfo.title}? It's ${briefingInfo.duration} to discuss your specific situation.`,
    displayToUser: true,
  };
}

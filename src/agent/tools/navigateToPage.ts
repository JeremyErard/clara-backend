/**
 * Navigate to Page Tool
 *
 * Suggests navigation to relevant SDI pages
 */

import type { ToolContext, ToolResult } from './index.js';

interface NavigateToPageInput {
  page: string;
  reason?: string;
}

const PAGE_INFO: Record<string, { title: string; description: string }> = {
  '/agentic-assessment': {
    title: 'AI Workforce Assessment',
    description: 'Learn about our 5-week board-ready assessment',
  },
  '/agentic-assessment/process-mapping': {
    title: 'Process Mapping',
    description: 'See how we document your workflows',
  },
  '/agentic-assessment/task-segmentation': {
    title: 'Task Segmentation',
    description: 'Understand AI-ready vs human-essential tasks',
  },
  '/outsourced-ld': {
    title: 'Outsourced L&D',
    description: 'Full L&D capabilities for your organization',
  },
  '/talent-development/talent-consulting': {
    title: 'Talent Consulting',
    description: 'Strategic organizational transformation',
  },
  '/training-materials': {
    title: 'Training Solutions',
    description: 'Award-winning custom training content',
  },
  '/training-materials/elearning': {
    title: 'eLearning Solutions',
    description: 'Interactive, SCORM-compliant courses',
  },
  '/training-materials/motion-graphics': {
    title: 'Motion Graphics',
    description: 'Telly Award-winning animated videos',
  },
  '/training-materials/ilt-vilt': {
    title: 'ILT/VILT',
    description: 'Instructor-led training materials',
  },
  '/roi-calculator': {
    title: 'ROI Calculator',
    description: 'Calculate your AI opportunity',
  },
  '/why-sdi': {
    title: 'Why SDI',
    description: 'See how we compare to Big 5 consulting',
  },
  '/portfolio': {
    title: 'Portfolio',
    description: 'View our award-winning work samples',
  },
  '/contact': {
    title: 'Contact',
    description: 'Get in touch with SDI',
  },
  '/blog': {
    title: 'Blog',
    description: '20+ years of thought leadership',
  },
};

export async function handleNavigateToPage(
  input: NavigateToPageInput,
  context: ToolContext
): Promise<ToolResult> {
  const { page, reason } = input;

  const pageInfo = PAGE_INFO[page];

  if (!pageInfo) {
    return {
      success: false,
      message: 'Unknown page',
      displayToUser: false,
    };
  }

  return {
    success: true,
    data: {
      url: page,
      title: pageInfo.title,
      description: pageInfo.description,
      reason,
    },
    message: `I suggest checking out our ${pageInfo.title} page${reason ? `: ${reason}` : ''}.`,
    displayToUser: true,
  };
}

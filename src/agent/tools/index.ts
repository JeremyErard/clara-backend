/**
 * Clara Tools Index
 *
 * All tools available to Clara during conversations
 */

import Anthropic from '@anthropic-ai/sdk';

export { handleCaptureLead } from './captureLead.js';
export { handleCalculateRoi } from './calculateRoi.js';
export { handleRecommendSolution } from './recommendSolution.js';
export { handleNavigateToPage } from './navigateToPage.js';
export { handleScheduleBriefing } from './scheduleBriefing.js';
export { handleGetQualification } from './getQualification.js';

/**
 * All tools available to Clara
 */
export const CLARA_TOOLS: Anthropic.Tool[] = [
  // Lead capture
  {
    name: 'capture_lead',
    description: 'Save visitor information progressively. Call this whenever you learn new information about the visitor (name, email, company, role, interests, pain points). All fields are optional - capture whatever you know.',
    input_schema: {
      type: 'object' as const,
      properties: {
        email: { type: 'string', description: 'Visitor email address' },
        firstName: { type: 'string', description: 'Visitor first name' },
        lastName: { type: 'string', description: 'Visitor last name' },
        company: { type: 'string', description: 'Company name' },
        companySize: { type: 'string', description: 'Company size (e.g., "500-1000", "1000-2500")' },
        industry: { type: 'string', description: 'Industry' },
        role: { type: 'string', description: 'Job title or role' },
        roleLevel: { type: 'string', description: 'Level: C-Suite, Director, Manager, Individual Contributor' },
        primaryInterest: { type: 'string', description: 'Primary service interest: ai-assessment, outsourced-ld, talent-consulting, training-solutions' },
        painPoints: { type: 'array', items: { type: 'string' }, description: 'Specific challenges mentioned' },
        hesitations: { type: 'array', items: { type: 'string' }, description: 'Concerns or objections expressed' },
        decisionCriteria: { type: 'array', items: { type: 'string' }, description: 'What will drive their decision' },
        timeline: { type: 'string', description: 'When they want to act' },
      },
      required: [],
    },
  },

  // ROI calculation
  {
    name: 'calculate_roi',
    description: 'Calculate and present the AI workforce optimization opportunity. Use this when discussing ROI or business case for the AI Assessment.',
    input_schema: {
      type: 'object' as const,
      properties: {
        employeeCount: { type: 'number', description: 'Number of employees (required)' },
        averageSalary: { type: 'number', description: 'Average salary (default: $60,000)' },
        efficiencyGain: { type: 'number', description: 'Expected efficiency gain as decimal (default: 0.20 for 20%)' },
      },
      required: ['employeeCount'],
    },
  },

  // Solution recommendation
  {
    name: 'recommend_solution',
    description: 'Formally recommend an SDI solution based on discovery. Use this after gathering enough context to make an informed recommendation.',
    input_schema: {
      type: 'object' as const,
      properties: {
        solution: {
          type: 'string',
          enum: ['ai-assessment', 'outsourced-ld', 'talent-consulting', 'training-solutions'],
          description: 'The recommended solution',
        },
        reason: { type: 'string', description: 'Why this solution fits their needs' },
        keyBenefits: { type: 'array', items: { type: 'string' }, description: 'Top 3 benefits for their situation' },
      },
      required: ['solution', 'reason'],
    },
  },

  // Page navigation
  {
    name: 'navigate_to_page',
    description: 'Suggest navigating the visitor to a relevant SDI page for more information.',
    input_schema: {
      type: 'object' as const,
      properties: {
        page: {
          type: 'string',
          enum: [
            '/agentic-assessment',
            '/agentic-assessment/process-mapping',
            '/agentic-assessment/task-segmentation',
            '/outsourced-ld',
            '/talent-development/talent-consulting',
            '/training-materials',
            '/training-materials/elearning',
            '/training-materials/motion-graphics',
            '/training-materials/ilt-vilt',
            '/roi-calculator',
            '/why-sdi',
            '/portfolio',
            '/contact',
            '/blog',
          ],
          description: 'The page to navigate to',
        },
        reason: { type: 'string', description: 'Why this page is relevant' },
      },
      required: ['page'],
    },
  },

  // Schedule briefing
  {
    name: 'schedule_briefing',
    description: 'Present the option to schedule an executive briefing call. Use this for qualified leads who are ready for next steps.',
    input_schema: {
      type: 'object' as const,
      properties: {
        briefingType: {
          type: 'string',
          enum: ['executive-briefing', 'discovery-call', 'project-scoping'],
          description: 'Type of call to schedule',
        },
        context: { type: 'string', description: 'Brief context about what they want to discuss' },
      },
      required: ['briefingType'],
    },
  },

  // Get qualification score
  {
    name: 'get_qualification',
    description: 'Calculate the current lead qualification score based on gathered information. Use this to determine appropriate next steps.',
    input_schema: {
      type: 'object' as const,
      properties: {
        companySize: { type: 'string', description: 'Company size' },
        roleLevel: { type: 'string', description: 'Role level' },
        hasPainPoint: { type: 'boolean', description: 'Whether they have articulated a specific pain point' },
        timeline: { type: 'string', description: 'Their timeline' },
        industry: { type: 'string', description: 'Their industry' },
      },
      required: [],
    },
  },
];

/**
 * Tool handler type
 */
export type ToolHandler = (input: Record<string, unknown>, context: ToolContext) => Promise<ToolResult>;

/**
 * Tool context passed to handlers
 */
export interface ToolContext {
  conversationId: string;
  sessionId: string;
  leadId?: string;
}

/**
 * Tool result structure
 */
export interface ToolResult {
  success: boolean;
  data?: Record<string, unknown>;
  message: string;
  displayToUser?: boolean; // Whether to show this in the chat
}

/**
 * Knowledge Index
 *
 * Central export for all Clara knowledge modules.
 * This knowledge is embedded in Clara's system prompt to provide
 * accurate, detailed information about SDI's services.
 */

export {
  AI_ASSESSMENT_KNOWLEDGE,
  getAIAssessmentPromptKnowledge,
} from './ai-assessment';

export {
  OUTSOURCED_LD_KNOWLEDGE,
  getOutsourcedLDPromptKnowledge,
} from './outsourced-ld';

/**
 * Get all knowledge formatted for system prompt
 */
export function getAllKnowledgeForPrompt(): string {
  const { getAIAssessmentPromptKnowledge } = require('./ai-assessment');
  const { getOutsourcedLDPromptKnowledge } = require('./outsourced-ld');

  return `
# SDI SERVICE KNOWLEDGE (Use this for accurate responses)

${getAIAssessmentPromptKnowledge()}

${getOutsourcedLDPromptKnowledge()}
`;
}

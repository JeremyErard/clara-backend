/**
 * Anthropic Claude Client
 *
 * Configured client for Claude API interactions
 */

import Anthropic from '@anthropic-ai/sdk';

// Initialize the Anthropic client
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Model configuration
export const MODEL = 'claude-sonnet-4-20250514';
export const MAX_TOKENS = 4096;

// Token limits for context management
export const CONTEXT_TOKEN_LIMIT = 180000; // Leave room for response

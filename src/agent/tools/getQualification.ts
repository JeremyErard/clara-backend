/**
 * Get Qualification Tool
 *
 * Calculates lead qualification score to determine next steps
 */

import type { ToolContext, ToolResult } from './index.js';

interface GetQualificationInput {
  companySize?: string;
  roleLevel?: string;
  hasPainPoint?: boolean;
  timeline?: string;
  industry?: string;
}

const TARGET_INDUSTRIES = [
  'healthcare',
  'financial',
  'banking',
  'manufacturing',
  'technology',
  'professional services',
  'insurance',
  'retail',
  'energy',
  'utilities',
];

export async function handleGetQualification(
  input: GetQualificationInput,
  context: ToolContext
): Promise<ToolResult> {
  const { companySize, roleLevel, hasPainPoint, timeline, industry } = input;

  let companyFitScore = 0;
  let authorityScore = 0;
  let intentScore = 0;

  // Company Fit (max 40 points)
  if (companySize) {
    const size = companySize.toLowerCase();
    // Extract numbers from size string
    const match = size.match(/(\d+)/g);
    if (match) {
      const numbers = match.map(Number);
      if (numbers.some(n => n >= 500 && n <= 2500)) {
        companyFitScore = 40;
      } else if (numbers.some(n => n >= 100 && n < 500)) {
        companyFitScore = 20;
      } else if (numbers.some(n => n > 2500 && n <= 5000)) {
        companyFitScore = 15;
      }
    }
  }

  // Industry bonus
  if (industry && TARGET_INDUSTRIES.some(ind => industry.toLowerCase().includes(ind))) {
    companyFitScore = Math.min(companyFitScore + 10, 40);
  }

  // Authority (max 30 points)
  if (roleLevel) {
    const level = roleLevel.toLowerCase();
    if (level.includes('c-suite') || level.includes('c-level') ||
        level.includes('ceo') || level.includes('coo') ||
        level.includes('cfo') || level.includes('cto') ||
        level.includes('chro') || level.includes('chief')) {
      authorityScore = 30;
    } else if (level.includes('vp') || level.includes('vice president') ||
               level.includes('director') || level.includes('head of')) {
      authorityScore = 20;
    } else if (level.includes('manager') || level.includes('lead')) {
      authorityScore = 10;
    } else if (level.includes('individual') || level.includes('contributor') ||
               level.includes('analyst') || level.includes('specialist')) {
      authorityScore = 5;
    }
  }

  // Intent (max 30 points)
  if (hasPainPoint) {
    intentScore += 20;
  }

  if (timeline) {
    const t = timeline.toLowerCase();
    if (t.includes('immediate') || t.includes('asap') ||
        t.includes('this quarter') || t.includes('urgent') ||
        t.includes('this month')) {
      intentScore += 10;
    } else if (t.includes('next quarter') || t.includes('soon') ||
               t.includes('few months') || t.includes('q1') ||
               t.includes('q2') || t.includes('q3') || t.includes('q4')) {
      intentScore += 5;
    }
  }

  const totalScore = companyFitScore + authorityScore + intentScore;

  let quality: string;
  let recommendedAction: string;

  if (totalScore >= 70) {
    quality = 'hot';
    recommendedAction = 'Present executive briefing option - this is a highly qualified lead';
  } else if (totalScore >= 40) {
    quality = 'warm';
    recommendedAction = 'Continue discovery, address hesitations, offer relevant resources';
  } else if (totalScore > 0) {
    quality = 'cold';
    recommendedAction = 'Provide value, nurture relationship, avoid pushing next steps';
  } else {
    quality = 'unknown';
    recommendedAction = 'Gather more information about company size, role, and challenges';
  }

  return {
    success: true,
    data: {
      scores: {
        companyFit: { score: companyFitScore, max: 40 },
        authority: { score: authorityScore, max: 30 },
        intent: { score: intentScore, max: 30 },
        total: { score: totalScore, max: 100 },
      },
      quality,
      recommendedAction,
      breakdown: {
        companySize: companySize || 'unknown',
        roleLevel: roleLevel || 'unknown',
        hasPainPoint: hasPainPoint ?? false,
        timeline: timeline || 'unknown',
        industry: industry || 'unknown',
      },
    },
    message: `Lead qualification: ${totalScore}/100 (${quality}). ${recommendedAction}`,
    displayToUser: false,
  };
}

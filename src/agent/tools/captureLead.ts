/**
 * Capture Lead Tool
 *
 * Progressively saves visitor information as it's gathered.
 * All fields optional to support partial leads.
 */

import { prisma } from '../../lib/prisma.js';
import { sendLeadNotification } from '../../lib/email.js';
import type { ToolContext, ToolResult } from './index.js';

interface CaptureLeadInput {
  email?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  companySize?: string;
  industry?: string;
  role?: string;
  roleLevel?: string;
  primaryInterest?: string;
  painPoints?: string[];
  hesitations?: string[];
  decisionCriteria?: string[];
  timeline?: string;
}

/**
 * Calculate lead score based on captured information
 */
function calculateLeadScore(data: CaptureLeadInput): {
  companyFitScore: number;
  authorityScore: number;
  intentScore: number;
  totalScore: number;
  quality: string;
} {
  let companyFitScore = 0;
  let authorityScore = 0;
  let intentScore = 0;

  // Company Fit (max 40 points)
  if (data.companySize) {
    const size = data.companySize.toLowerCase();
    if (size.includes('500') || size.includes('1000') || size.includes('1500') || size.includes('2000') || size.includes('2500')) {
      // Check if it's in the 500-2500 range
      const match = size.match(/(\d+)/g);
      if (match) {
        const numbers = match.map(Number);
        const hasIdealRange = numbers.some(n => n >= 500 && n <= 2500);
        if (hasIdealRange) {
          companyFitScore = 40;
        } else if (numbers.some(n => n >= 100 && n < 500)) {
          companyFitScore = 20;
        }
      }
    }
  }

  // Industry bonus
  const targetIndustries = ['healthcare', 'financial', 'manufacturing', 'technology', 'professional services', 'insurance'];
  if (data.industry && targetIndustries.some(ind => data.industry!.toLowerCase().includes(ind))) {
    companyFitScore = Math.min(companyFitScore + 10, 40);
  }

  // Authority (max 30 points)
  if (data.roleLevel) {
    const level = data.roleLevel.toLowerCase();
    if (level.includes('c-suite') || level.includes('ceo') || level.includes('coo') || level.includes('cfo') || level.includes('cto') || level.includes('chro')) {
      authorityScore = 30;
    } else if (level.includes('director') || level.includes('vp') || level.includes('vice president')) {
      authorityScore = 20;
    } else if (level.includes('manager')) {
      authorityScore = 10;
    }
  } else if (data.role) {
    const role = data.role.toLowerCase();
    if (role.includes('chief') || role.includes('ceo') || role.includes('coo') || role.includes('cfo')) {
      authorityScore = 30;
    } else if (role.includes('director') || role.includes('vp') || role.includes('head of')) {
      authorityScore = 20;
    } else if (role.includes('manager')) {
      authorityScore = 10;
    }
  }

  // Intent (max 30 points)
  if (data.painPoints && data.painPoints.length > 0) {
    intentScore += 20;
  }

  if (data.timeline) {
    const timeline = data.timeline.toLowerCase();
    if (timeline.includes('this quarter') || timeline.includes('immediately') || timeline.includes('urgent') || timeline.includes('asap')) {
      intentScore += 10;
    } else if (timeline.includes('next quarter') || timeline.includes('soon') || timeline.includes('few months')) {
      intentScore += 5;
    }
  }

  const totalScore = companyFitScore + authorityScore + intentScore;

  let quality = 'unknown';
  if (totalScore >= 70) {
    quality = 'hot';
  } else if (totalScore >= 40) {
    quality = 'warm';
  } else if (totalScore > 0) {
    quality = 'cold';
  }

  return { companyFitScore, authorityScore, intentScore, totalScore, quality };
}

export async function handleCaptureLead(
  input: CaptureLeadInput,
  context: ToolContext
): Promise<ToolResult> {
  try {
    const scores = calculateLeadScore(input);

    // Build update data, only including non-undefined fields
    const updateData: Record<string, unknown> = {
      ...scores,
      updatedAt: new Date(),
    };

    if (input.email) updateData.email = input.email;
    if (input.firstName) updateData.firstName = input.firstName;
    if (input.lastName) updateData.lastName = input.lastName;
    if (input.company) updateData.company = input.company;
    if (input.companySize) updateData.companySize = input.companySize;
    if (input.industry) updateData.industry = input.industry;
    if (input.role) updateData.role = input.role;
    if (input.roleLevel) updateData.roleLevel = input.roleLevel;
    if (input.primaryInterest) updateData.primaryInterest = input.primaryInterest;
    if (input.timeline) updateData.timeline = input.timeline;

    // Handle arrays - append to existing
    if (input.painPoints) updateData.painPoints = { push: input.painPoints };
    if (input.hesitations) updateData.hesitations = { push: input.hesitations };
    if (input.decisionCriteria) updateData.decisionCriteria = { push: input.decisionCriteria };

    let lead;

    if (context.leadId) {
      // Update existing lead
      lead = await prisma.lead.update({
        where: { id: context.leadId },
        data: updateData,
      });
    } else if (input.email) {
      // Upsert by email
      lead = await prisma.lead.upsert({
        where: { email: input.email },
        update: updateData,
        create: {
          ...updateData,
          email: input.email,
          status: 'incomplete',
        } as any,
      });

      // Connect lead to conversation
      await prisma.conversation.update({
        where: { id: context.conversationId },
        data: {
          leadId: lead.id,
          leadScore: scores.totalScore,
          leadQuality: scores.quality,
        },
      });
    } else {
      // Create new lead without email
      lead = await prisma.lead.create({
        data: {
          ...updateData,
          status: 'incomplete',
        } as any,
      });

      // Connect to conversation
      await prisma.conversation.update({
        where: { id: context.conversationId },
        data: {
          leadId: lead.id,
          leadScore: scores.totalScore,
          leadQuality: scores.quality,
        },
      });
    }

    // Send notification for hot or warm leads with email
    if ((scores.quality === 'hot' || scores.quality === 'warm') && (input.email || lead.email)) {
      // Fetch complete lead data for notification
      const fullLead = await prisma.lead.findUnique({
        where: { id: lead.id },
      });

      if (fullLead) {
        sendLeadNotification({
          name: fullLead.firstName ? `${fullLead.firstName} ${fullLead.lastName || ''}`.trim() : undefined,
          email: fullLead.email || undefined,
          company: fullLead.company || undefined,
          role: fullLead.role || undefined,
          companySize: fullLead.companySize || undefined,
          industry: fullLead.industry || undefined,
          leadScore: scores.totalScore,
          leadQuality: scores.quality,
          primaryInterest: fullLead.primaryInterest || undefined,
          painPoints: fullLead.painPoints,
          hesitations: fullLead.hesitations,
          decisionCriteria: fullLead.decisionCriteria,
          timeline: fullLead.timeline || undefined,
          conversationId: context.conversationId,
        }).catch(err => console.error('Failed to send lead notification:', err));
      }
    }

    return {
      success: true,
      data: {
        leadId: lead.id,
        ...scores,
      },
      message: `Lead information captured. Score: ${scores.totalScore}/100 (${scores.quality})`,
      displayToUser: false,
    };
  } catch (error) {
    console.error('Error capturing lead:', error);
    return {
      success: false,
      message: 'Failed to capture lead information',
      displayToUser: false,
    };
  }
}

/**
 * Outcome Tracking Service
 *
 * Tracks and updates conversation outcomes based on engagement signals
 */

import { prisma } from '../lib/prisma.js';
import {
  detectOutcome,
  calculateDuration,
  analyzeConversation,
  type ConversationOutcome,
  type OutcomeSignals,
} from '../learning/index.js';

/**
 * Update conversation outcome based on current signals
 */
export async function updateConversationOutcome(
  conversationId: string
): Promise<ConversationOutcome | null> {
  try {
    // Get conversation with messages and lead
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        lead: true,
        outcome: true,
      },
    });

    if (!conversation) {
      console.log('Conversation not found:', conversationId);
      return null;
    }

    // Don't downgrade SCHEDULED outcomes
    if (conversation.outcome?.outcome === 'SCHEDULED') {
      return 'SCHEDULED';
    }

    // Analyze messages for signals
    const messages = conversation.messages.map(m => ({
      role: m.role,
      content: m.content,
    }));
    const signals = analyzeConversation(messages);

    // Calculate lead score if we have a lead
    let leadScore: number | null = null;
    if (conversation.lead) {
      leadScore = calculateLeadScore(conversation.lead);
    }

    // Calculate time since last activity
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    const lastActivityMinutesAgo = lastMessage
      ? Math.floor((Date.now() - lastMessage.createdAt.getTime()) / (1000 * 60))
      : 999;

    // Build outcome signals
    const outcomeSignals: OutcomeSignals = {
      messageCount: conversation.messages.length,
      leadScore,
      askedAboutPricing: signals.askedAboutPricing,
      askedAboutProcess: signals.askedAboutProcess,
      askedAboutTimeline: signals.askedAboutTimeline,
      calendlyClicked: signals.calendlyClicked,
      calendlyBooked: conversation.outcome?.outcome === 'SCHEDULED',
      lastActivityMinutesAgo,
    };

    // Detect outcome
    const outcome = detectOutcome(outcomeSignals);

    // Calculate duration
    const firstMessage = conversation.messages[0];
    const durationSec = firstMessage && lastMessage
      ? calculateDuration(firstMessage.createdAt, lastMessage.createdAt)
      : 0;

    // Upsert the outcome
    await prisma.conversationOutcome.upsert({
      where: { conversationId },
      update: {
        outcome,
        outcomeAt: new Date(),
        messageCount: conversation.messages.length,
        durationSec,
      },
      create: {
        conversationId,
        variantId: conversation.variantId ?? undefined,
        outcome,
        outcomeAt: new Date(),
        messageCount: conversation.messages.length,
        durationSec,
        visitorRole: conversation.lead?.role ?? undefined,
        companySize: conversation.lead?.companySize ?? undefined,
        industry: conversation.lead?.industry ?? undefined,
        primaryInterest: conversation.lead?.primaryInterest ?? undefined,
      },
    });

    console.log('Conversation outcome updated:', { conversationId, outcome });
    return outcome;
  } catch (error) {
    console.error('Error updating conversation outcome:', error);
    return null;
  }
}

/**
 * Calculate lead score based on lead data
 */
function calculateLeadScore(lead: {
  companySize?: string | null;
  role?: string | null;
  roleLevel?: string | null;
  industry?: string | null;
  interest?: string | null;
  painPoints?: any;
  timeline?: string | null;
}): number {
  let score = 0;

  // Company size (0-40 points)
  if (lead.companySize) {
    const size = lead.companySize.toLowerCase();
    if (size.includes('500') || size.includes('1000') || size.includes('2000') || size.includes('2500')) {
      score += 40; // Sweet spot
    } else if (size.includes('100') || size.includes('200') || size.includes('300') || size.includes('400')) {
      score += 20; // Smaller but viable
    }
  }

  // Role level (0-30 points)
  if (lead.roleLevel) {
    const level = lead.roleLevel.toLowerCase();
    if (level.includes('c-suite') || level.includes('chief') || level.includes('ceo') || level.includes('coo')) {
      score += 30;
    } else if (level.includes('director') || level.includes('vp') || level.includes('vice president')) {
      score += 20;
    } else if (level.includes('manager')) {
      score += 10;
    }
  }

  // Pain point clarity (0-20 points)
  if (lead.painPoints && Array.isArray(lead.painPoints) && lead.painPoints.length > 0) {
    score += 20;
  }

  // Timeline (0-10 points)
  if (lead.timeline) {
    const timeline = lead.timeline.toLowerCase();
    if (timeline.includes('quarter') || timeline.includes('month') || timeline.includes('soon') || timeline.includes('asap')) {
      score += 10;
    } else if (timeline.includes('year') || timeline.includes('next')) {
      score += 5;
    }
  }

  return score;
}

/**
 * Batch update outcomes for inactive conversations
 * Run this periodically (e.g., every 30 minutes)
 */
export async function updateStaleOutcomes(): Promise<number> {
  try {
    // Find conversations without recent activity that don't have final outcomes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const staleConversations = await prisma.conversation.findMany({
      where: {
        lastActivity: {
          lt: thirtyMinutesAgo,
        },
        OR: [
          { outcome: null },
          {
            outcome: {
              outcome: {
                notIn: ['SCHEDULED', 'BOUNCED'],
              },
            },
          },
        ],
      },
      select: { id: true },
    });

    let updated = 0;
    for (const conv of staleConversations) {
      const result = await updateConversationOutcome(conv.id);
      if (result) updated++;
    }

    console.log(`Updated ${updated} stale conversation outcomes`);
    return updated;
  } catch (error) {
    console.error('Error updating stale outcomes:', error);
    return 0;
  }
}

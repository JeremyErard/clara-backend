/**
 * Outcome Detection for Clara Conversations
 *
 * Automatically classifies conversations into outcome categories
 */

export type ConversationOutcome = 'SCHEDULED' | 'QUALIFIED' | 'INTERESTED' | 'BOUNCED';

export interface OutcomeSignals {
  messageCount: number;
  leadScore: number | null;
  askedAboutPricing: boolean;
  askedAboutProcess: boolean;
  askedAboutTimeline: boolean;
  calendlyClicked: boolean;
  calendlyBooked: boolean;
  lastActivityMinutesAgo: number;
}

/**
 * Detect conversation outcome based on engagement signals
 * Hierarchy: SCHEDULED > QUALIFIED > INTERESTED > BOUNCED
 */
export function detectOutcome(signals: OutcomeSignals): ConversationOutcome {
  // SCHEDULED - Calendly confirmed (highest priority)
  if (signals.calendlyBooked) return 'SCHEDULED';

  // QUALIFIED - High engagement + good fit
  if (signals.leadScore && signals.leadScore >= 70 && signals.messageCount >= 6) {
    return 'QUALIFIED';
  }

  // INTERESTED - Showed buying intent
  if (signals.askedAboutPricing || signals.askedAboutProcess || signals.calendlyClicked) {
    return 'INTERESTED';
  }

  // BOUNCED - Low engagement
  if (signals.messageCount < 3 || signals.lastActivityMinutesAgo > 30) {
    return 'BOUNCED';
  }

  // Default to INTERESTED if still active
  return 'INTERESTED';
}

/**
 * Calculate duration between first and last message
 */
export function calculateDuration(firstMessageAt: Date, lastMessageAt: Date): number {
  return Math.floor((lastMessageAt.getTime() - firstMessageAt.getTime()) / 1000);
}

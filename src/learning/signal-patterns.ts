/**
 * Signal Pattern Detection
 *
 * Regex patterns to detect intent signals in conversation messages
 */

export const PRICING_PATTERNS = [
  /how much/i,
  /cost/i,
  /pricing/i,
  /price/i,
  /budget/i,
  /invest(ment)?/i,
  /\$\d+/,
  /what('s| is) the (cost|price|investment)/i,
  /afford/i,
  /expensive/i,
  /cheap/i,
];

export const PROCESS_PATTERNS = [
  /how (does|do) (it|this|you) work/i,
  /next step/i,
  /process/i,
  /how long/i,
  /start(ing)?/i,
  /begin/i,
  /get started/i,
  /what happens next/i,
  /what('s| is) the process/i,
];

export const TIMELINE_PATTERNS = [
  /when can/i,
  /how soon/i,
  /this quarter/i,
  /this year/i,
  /timeline/i,
  /schedule/i,
  /available/i,
  /book/i,
  /calendar/i,
  /meet(ing)?/i,
];

export const CALENDLY_PATTERNS = [
  /calendly/i,
  /schedule.*call/i,
  /book.*time/i,
  /executive briefing/i,
];

/**
 * Detect if message contains pricing intent
 */
export function hasPricingIntent(message: string): boolean {
  return PRICING_PATTERNS.some(pattern => pattern.test(message));
}

/**
 * Detect if message contains process/how-it-works intent
 */
export function hasProcessIntent(message: string): boolean {
  return PROCESS_PATTERNS.some(pattern => pattern.test(message));
}

/**
 * Detect if message contains timeline/scheduling intent
 */
export function hasTimelineIntent(message: string): boolean {
  return TIMELINE_PATTERNS.some(pattern => pattern.test(message));
}

/**
 * Detect if message shows Calendly interaction intent
 */
export function hasCalendlyIntent(message: string): boolean {
  return CALENDLY_PATTERNS.some(pattern => pattern.test(message));
}

/**
 * Analyze all messages in a conversation to extract signals
 */
export function analyzeConversation(messages: { role: string; content: string }[]): {
  askedAboutPricing: boolean;
  askedAboutProcess: boolean;
  askedAboutTimeline: boolean;
  calendlyClicked: boolean;
} {
  const userMessages = messages
    .filter(m => m.role === 'user')
    .map(m => m.content);

  const allText = userMessages.join(' ');

  return {
    askedAboutPricing: hasPricingIntent(allText),
    askedAboutProcess: hasProcessIntent(allText),
    askedAboutTimeline: hasTimelineIntent(allText),
    calendlyClicked: hasCalendlyIntent(allText),
  };
}

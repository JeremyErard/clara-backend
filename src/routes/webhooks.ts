/**
 * Webhooks Route
 *
 * Handles external webhooks (Calendly, etc.)
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

export const webhooksRouter = Router();

/**
 * POST /webhooks/calendly
 *
 * Handle Calendly webhook events
 * Configure webhook at: https://calendly.com/integrations/webhooks
 */
webhooksRouter.post('/calendly', async (req: Request, res: Response) => {
  try {
    const { event, payload } = req.body;

    console.log('Calendly webhook received:', event);

    if (event === 'invitee.created') {
      await handleInviteeCreated(payload);
    } else if (event === 'invitee.canceled') {
      await handleInviteeCanceled(payload);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Calendly webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Handle new booking created
 */
async function handleInviteeCreated(payload: any) {
  const { email, event_type, scheduled_event, tracking, questions_and_answers } = payload;

  // Extract conversation ID from UTM parameters
  const conversationId = tracking?.utm_source === 'clara'
    ? tracking.utm_content
    : await findConversationByEmail(email);

  console.log('Calendly booking created:', {
    email,
    eventType: event_type?.slug,
    conversationId,
    scheduledAt: scheduled_event?.start_time,
  });

  // Record the Calendly event
  await prisma.calendlyEvent.create({
    data: {
      calendlyEventId: scheduled_event.uuid,
      conversationId: conversationId || null,
      email: email,
      eventType: event_type?.slug || 'unknown',
      scheduledAt: new Date(scheduled_event.start_time),
      status: 'scheduled',
    },
  });

  // Update conversation outcome to SCHEDULED
  if (conversationId) {
    // Get conversation details for metrics
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: true,
        lead: true,
      },
    });

    if (conversation) {
      const messageCount = conversation.messages.length;
      const firstMessage = conversation.messages[0];
      const lastMessage = conversation.messages[conversation.messages.length - 1];
      const durationSec = firstMessage && lastMessage
        ? Math.floor((lastMessage.createdAt.getTime() - firstMessage.createdAt.getTime()) / 1000)
        : 0;

      // Upsert the outcome
      await prisma.conversationOutcome.upsert({
        where: { conversationId },
        update: {
          outcome: 'SCHEDULED',
          outcomeAt: new Date(),
          messageCount,
          durationSec,
        },
        create: {
          conversationId,
          variantId: conversation.variantId ?? undefined,
          outcome: 'SCHEDULED',
          outcomeAt: new Date(),
          messageCount,
          durationSec,
          visitorRole: conversation.lead?.role ?? undefined,
          companySize: conversation.lead?.companySize ?? undefined,
          industry: conversation.lead?.industry ?? undefined,
          primaryInterest: conversation.lead?.primaryInterest ?? undefined,
        },
      });

      console.log('Conversation outcome updated to SCHEDULED:', conversationId);
    }
  }
}

/**
 * Handle booking cancellation
 */
async function handleInviteeCanceled(payload: any) {
  const { scheduled_event } = payload;

  console.log('Calendly booking canceled:', scheduled_event?.uuid);

  // Update the event status
  await prisma.calendlyEvent.updateMany({
    where: { calendlyEventId: scheduled_event.uuid },
    data: { status: 'canceled' },
  });
}

/**
 * Find conversation by email (fallback when UTM params aren't available)
 */
async function findConversationByEmail(email: string): Promise<string | null> {
  // Find most recent lead with this email
  const lead = await prisma.lead.findFirst({
    where: { email },
    orderBy: { createdAt: 'desc' },
  });

  // The lead's source field contains the conversation ID
  return lead?.source || null;
}

/**
 * GET /webhooks/calendly/test
 *
 * Test endpoint to verify webhook is reachable
 */
webhooksRouter.get('/calendly/test', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'Calendly webhook endpoint is reachable',
    timestamp: new Date().toISOString(),
  });
});

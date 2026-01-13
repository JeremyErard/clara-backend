/**
 * Chat Route
 *
 * Handles chat API with SSE streaming
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  runAgent,
  getOrCreateConversation,
  saveMessage,
  type AgentContext,
} from '../agent/index.js';
import type { ToolResult } from '../agent/tools/index.js';

export const chatRouter = Router();

/**
 * POST /api/chat
 *
 * Handles chat messages with SSE streaming response
 */
chatRouter.post('/chat', async (req: Request, res: Response) => {
  try {
    const {
      message,
      sessionId,
      currentPage,
      companyName,
      visitorName,
    } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    // Generate session ID if not provided
    const effectiveSessionId = sessionId || uuidv4();

    // Get or create conversation
    const conversation = await getOrCreateConversation(effectiveSessionId, currentPage);

    // Save user message
    await saveMessage(conversation.id, 'user', message);

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Send session info
    res.write(`data: ${JSON.stringify({
      type: 'session',
      sessionId: effectiveSessionId,
      conversationId: conversation.id,
    })}\n\n`);

    // Agent context
    const context: AgentContext = {
      conversationId: conversation.id,
      sessionId: effectiveSessionId,
      leadId: conversation.leadId,
      currentPage,
      companyName,
      visitorName,
    };

    // Track full response for saving
    let fullResponse = '';
    const toolResults: ToolResult[] = [];

    // Stream callback
    const onStream = (chunk: string, done?: boolean, toolResult?: ToolResult) => {
      if (done) {
        res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
        res.end();
        return;
      }

      if (toolResult) {
        toolResults.push(toolResult);
        res.write(`data: ${JSON.stringify({
          type: 'tool_result',
          tool: toolResult,
        })}\n\n`);
        return;
      }

      if (chunk) {
        fullResponse += chunk;
        res.write(`data: ${JSON.stringify({
          type: 'text',
          content: chunk,
        })}\n\n`);
      }
    };

    // Run agent
    const result = await runAgent(
      message,
      conversation.messages,
      context,
      onStream
    );

    // Save assistant response
    await saveMessage(
      conversation.id,
      'assistant',
      result.response,
      undefined,
      result.toolResults.length > 0 ? result.toolResults : undefined
    );
  } catch (error) {
    console.error('Chat error:', error);

    // If headers haven't been sent, send error response
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to process chat message' });
    } else {
      // If streaming, send error event
      res.write(`data: ${JSON.stringify({
        type: 'error',
        message: 'An error occurred while processing your message',
      })}\n\n`);
      res.end();
    }
  }
});

/**
 * GET /api/conversation/:sessionId
 *
 * Get conversation history for a session
 */
chatRouter.get('/conversation/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const conversation = await getOrCreateConversation(sessionId);

    res.json({
      conversationId: conversation.id,
      messages: conversation.messages,
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

/**
 * POST /api/conversation/clear
 *
 * Start a new conversation for a session
 */
chatRouter.post('/conversation/clear', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      res.status(400).json({ error: 'Session ID is required' });
      return;
    }

    // Create new conversation (old one remains for history)
    const newSessionId = uuidv4();
    const conversation = await getOrCreateConversation(newSessionId);

    res.json({
      sessionId: newSessionId,
      conversationId: conversation.id,
      messages: [],
    });
  } catch (error) {
    console.error('Error clearing conversation:', error);
    res.status(500).json({ error: 'Failed to clear conversation' });
  }
});

/**
 * GET /api/health
 *
 * Health check endpoint
 */
chatRouter.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'clara-backend',
  });
});

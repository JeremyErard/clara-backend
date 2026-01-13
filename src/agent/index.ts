/**
 * Clara Agent Orchestration
 *
 * Handles conversation flow, tool execution, and message streaming
 */

import Anthropic from '@anthropic-ai/sdk';
import { anthropic, MODEL, MAX_TOKENS } from '../lib/anthropic.js';
import { prisma } from '../lib/prisma.js';
import { getSystemPrompt } from './prompts/system.js';
import {
  CLARA_TOOLS,
  handleCaptureLead,
  handleCalculateRoi,
  handleRecommendSolution,
  handleNavigateToPage,
  handleScheduleBriefing,
  handleGetQualification,
  type ToolContext,
  type ToolResult,
} from './tools/index.js';

/**
 * Message format for the agent
 */
export interface AgentMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Context passed to the agent
 */
export interface AgentContext {
  conversationId: string;
  sessionId: string;
  leadId?: string;
  currentPage?: string;
  companyName?: string;
  visitorName?: string;
}

/**
 * Stream callback for sending chunks to client
 */
export type StreamCallback = (chunk: string, done?: boolean, toolUse?: ToolResult) => void;

/**
 * Tool handler dispatch
 */
async function handleToolCall(
  toolName: string,
  toolInput: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  switch (toolName) {
    case 'capture_lead':
      return handleCaptureLead(toolInput as any, context);
    case 'calculate_roi':
      return handleCalculateRoi(toolInput as any, context);
    case 'recommend_solution':
      return handleRecommendSolution(toolInput as any, context);
    case 'navigate_to_page':
      return handleNavigateToPage(toolInput as any, context);
    case 'schedule_briefing':
      return handleScheduleBriefing(toolInput as any, context);
    case 'get_qualification':
      return handleGetQualification(toolInput as any, context);
    default:
      return {
        success: false,
        message: `Unknown tool: ${toolName}`,
        displayToUser: false,
      };
  }
}

/**
 * Convert stored messages to Anthropic format
 * Filters out messages with empty content to prevent API errors
 */
function formatMessagesForApi(messages: AgentMessage[]): Anthropic.MessageParam[] {
  return messages
    .filter((msg) => msg.content && msg.content.trim().length > 0)
    .map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
}

/**
 * Run Clara agent with streaming
 */
export async function runAgent(
  userMessage: string,
  history: AgentMessage[],
  context: AgentContext,
  onStream: StreamCallback
): Promise<{ response: string; toolResults: ToolResult[] }> {
  // Debug: Log conversation history
  console.log('=== CLARA DEBUG ===');
  console.log('History messages count:', history.length);
  console.log('History:', history.map(m => ({ role: m.role, contentLength: m.content?.length || 0, preview: m.content?.slice(0, 50) })));
  console.log('New user message:', userMessage.slice(0, 100));
  console.log('===================');

  const systemPrompt = getSystemPrompt({
    currentPage: context.currentPage,
    companyName: context.companyName,
    visitorName: context.visitorName,
  });

  const messages = formatMessagesForApi([
    ...history,
    { role: 'user', content: userMessage },
  ]);

  console.log('Messages to send to Claude:', messages.length);

  const toolContext: ToolContext = {
    conversationId: context.conversationId,
    sessionId: context.sessionId,
    leadId: context.leadId,
  };

  let fullResponse = '';
  const allToolResults: ToolResult[] = [];

  // Keep running until we get a final response (no more tool calls)
  let continueLoop = true;
  let currentMessages = messages;

  while (continueLoop) {
    const stream = anthropic.messages.stream({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      tools: CLARA_TOOLS,
      messages: currentMessages,
    });

    let currentResponse = '';
    const toolCalls: { id: string; name: string; input: Record<string, unknown> }[] = [];
    let hasToolUse = false;

    // Process the stream
    for await (const event of stream) {
      if (event.type === 'content_block_delta') {
        if (event.delta.type === 'text_delta') {
          currentResponse += event.delta.text;
          onStream(event.delta.text);
        } else if (event.delta.type === 'input_json_delta') {
          // Tool input is being streamed - we'll handle it at the end
        }
      } else if (event.type === 'content_block_start') {
        if (event.content_block.type === 'tool_use') {
          hasToolUse = true;
          toolCalls.push({
            id: event.content_block.id,
            name: event.content_block.name,
            input: {},
          });
        }
      } else if (event.type === 'message_stop') {
        // Message complete
      }
    }

    // Get the final message to extract complete tool inputs
    const finalMessage = await stream.finalMessage();

    // Process any tool calls
    if (finalMessage.stop_reason === 'tool_use') {
      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const contentBlock of finalMessage.content) {
        if (contentBlock.type === 'tool_use') {
          const result = await handleToolCall(
            contentBlock.name,
            contentBlock.input as Record<string, unknown>,
            toolContext
          );

          allToolResults.push(result);

          // Send tool result to client if it should be displayed
          if (result.displayToUser && result.data) {
            onStream('', false, result);
          }

          toolResults.push({
            type: 'tool_result',
            tool_use_id: contentBlock.id,
            content: JSON.stringify(result),
          });
        }
      }

      // Add assistant message and tool results to continue conversation
      currentMessages = [
        ...currentMessages,
        { role: 'assistant', content: finalMessage.content },
        { role: 'user', content: toolResults },
      ];
    } else {
      // No more tool calls - we're done
      fullResponse = currentResponse;
      continueLoop = false;
    }
  }

  // Signal completion
  onStream('', true);

  return {
    response: fullResponse,
    toolResults: allToolResults,
  };
}

/**
 * Get or create conversation
 */
export async function getOrCreateConversation(
  sessionId: string,
  currentPage?: string
): Promise<{ id: string; messages: AgentMessage[]; leadId?: string }> {
  // Try to find existing conversation for this session
  let conversation = await prisma.conversation.findFirst({
    where: { sessionId },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { startedAt: 'desc' },
  });

  if (!conversation) {
    // Create new conversation
    conversation = await prisma.conversation.create({
      data: {
        sessionId,
        currentPage,
      },
      include: {
        messages: true,
      },
    });
  } else {
    // Update current page
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { currentPage },
    });
  }

  const messages: AgentMessage[] = conversation.messages.map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

  return {
    id: conversation.id,
    messages,
    leadId: conversation.leadId || undefined,
  };
}

/**
 * Save message to conversation
 */
export async function saveMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
  toolCalls?: unknown,
  toolResults?: unknown
): Promise<void> {
  await prisma.message.create({
    data: {
      conversationId,
      role,
      content,
      toolCalls: toolCalls ? JSON.parse(JSON.stringify(toolCalls)) : undefined,
      toolResults: toolResults ? JSON.parse(JSON.stringify(toolResults)) : undefined,
    },
  });

  // Update conversation last activity
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastActivity: new Date() },
  });
}

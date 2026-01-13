/**
 * Email Service
 *
 * Sends lead notifications using Resend
 */

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface LeadNotificationData {
  // Contact
  name?: string;
  email?: string;
  company?: string;
  role?: string;

  // Qualification
  companySize?: string;
  industry?: string;
  leadScore: number;
  leadQuality: string;

  // Context
  primaryInterest?: string;
  painPoints?: string[];
  hesitations?: string[];
  decisionCriteria?: string[];
  timeline?: string;

  // Conversation
  conversationSummary?: string;
  keyMoments?: string[];
  recommendedApproach?: string;

  // Meta
  conversationId: string;
  source?: string;
}

/**
 * Send lead notification email
 */
export async function sendLeadNotification(data: LeadNotificationData): Promise<void> {
  const notificationEmail = process.env.NOTIFICATION_EMAIL || 'jerard@sdiclarity.ai';

  const qualityEmoji = {
    hot: '🔥',
    warm: '🟡',
    cold: '🔵',
    unknown: '❓',
  }[data.leadQuality] || '❓';

  const serviceNames = {
    'ai-assessment': 'AI Workforce Assessment',
    'outsourced-ld': 'Outsourced L&D',
    'talent-consulting': 'Talent Consulting',
    'training-solutions': 'Training Solutions',
  };

  const interestName = data.primaryInterest
    ? serviceNames[data.primaryInterest as keyof typeof serviceNames] || data.primaryInterest
    : 'Not specified';

  const subject = `${qualityEmoji} ${data.leadQuality.toUpperCase()} Lead: ${data.name || data.company || 'New Visitor'} - ${interestName}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1a365d 0%, #2a4a7f 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .score-badge { display: inline-block; background: ${data.leadQuality === 'hot' ? '#f56565' : data.leadQuality === 'warm' ? '#ed8936' : '#4299e1'}; color: white; padding: 4px 12px; border-radius: 20px; font-weight: bold; }
    .section { background: #f7fafc; padding: 16px; margin: 16px 0; border-radius: 8px; border-left: 4px solid #4299e1; }
    .section-title { font-weight: bold; color: #2d3748; margin-bottom: 8px; }
    .info-row { margin: 8px 0; }
    .label { color: #718096; font-size: 12px; text-transform: uppercase; }
    .value { color: #2d3748; font-weight: 500; }
    .list-item { margin: 4px 0; padding-left: 16px; position: relative; }
    .list-item:before { content: "•"; position: absolute; left: 0; color: #4299e1; }
    .footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #718096; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0;">New Lead from Clara</h2>
      <p style="margin: 8px 0 0;">SDI Clarity AI Assistant</p>
    </div>

    <div style="padding: 20px; background: white; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">

      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div>
          <h3 style="margin: 0;">${data.name || 'Unknown Name'}</h3>
          <p style="margin: 4px 0; color: #718096;">${data.company || 'Unknown Company'}</p>
        </div>
        <span class="score-badge">${data.leadScore}/100 ${data.leadQuality.toUpperCase()}</span>
      </div>

      <div class="section">
        <div class="section-title">Contact Information</div>
        ${data.email ? `<div class="info-row"><span class="label">Email:</span> <span class="value">${data.email}</span></div>` : ''}
        ${data.role ? `<div class="info-row"><span class="label">Role:</span> <span class="value">${data.role}</span></div>` : ''}
        ${data.companySize ? `<div class="info-row"><span class="label">Company Size:</span> <span class="value">${data.companySize}</span></div>` : ''}
        ${data.industry ? `<div class="info-row"><span class="label">Industry:</span> <span class="value">${data.industry}</span></div>` : ''}
      </div>

      <div class="section">
        <div class="section-title">Interest</div>
        <div class="info-row"><span class="label">Primary Interest:</span> <span class="value">${interestName}</span></div>
        ${data.timeline ? `<div class="info-row"><span class="label">Timeline:</span> <span class="value">${data.timeline}</span></div>` : ''}
      </div>

      ${data.painPoints && data.painPoints.length > 0 ? `
      <div class="section">
        <div class="section-title">Pain Points Mentioned</div>
        ${data.painPoints.map(p => `<div class="list-item">${p}</div>`).join('')}
      </div>
      ` : ''}

      ${data.hesitations && data.hesitations.length > 0 ? `
      <div class="section">
        <div class="section-title">Hesitations/Concerns</div>
        ${data.hesitations.map(h => `<div class="list-item">${h}</div>`).join('')}
      </div>
      ` : ''}

      ${data.decisionCriteria && data.decisionCriteria.length > 0 ? `
      <div class="section">
        <div class="section-title">Decision Criteria</div>
        ${data.decisionCriteria.map(d => `<div class="list-item">${d}</div>`).join('')}
      </div>
      ` : ''}

      ${data.conversationSummary ? `
      <div class="section">
        <div class="section-title">Conversation Summary</div>
        <p>${data.conversationSummary}</p>
      </div>
      ` : ''}

      ${data.recommendedApproach ? `
      <div class="section" style="border-left-color: #48bb78;">
        <div class="section-title">Recommended Approach</div>
        <p>${data.recommendedApproach}</p>
      </div>
      ` : ''}

      <div class="footer">
        <p>Conversation ID: ${data.conversationId}</p>
        <p>Source: ${data.source || 'Clara Chat'}</p>
        <p>This lead was captured by Clara, SDI Clarity's AI assistant.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  try {
    await resend.emails.send({
      from: 'Clara <clara@sdiclarity.ai>',
      to: notificationEmail,
      subject,
      html,
    });
    console.log(`Lead notification sent for ${data.email || data.company || 'unknown'}`);
  } catch (error) {
    console.error('Failed to send lead notification:', error);
    // Don't throw - email failure shouldn't break the chat
  }
}

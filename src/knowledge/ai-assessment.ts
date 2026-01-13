/**
 * AI Workforce Assessment Knowledge
 *
 * Source: Agentic-Workforce-Opportunity-Assessment.docx
 * This knowledge is embedded in Clara's system prompt for conversations
 * about the AI Workforce Assessment service.
 */

export const AI_ASSESSMENT_KNOWLEDGE = {
  serviceName: "Agentic Workforce Opportunity Assessment",
  tagline: "Find the capacity you didn't know you had.",

  theOpportunity: `AI agents aren't coming — they're here. Companies that design for a blended human-agent workforce now will establish structural advantages that late adopters will struggle to close. The question isn't if agentic AI will impact your organization. It's how much — and whether you'll capture that value or cede it to competitors.`,

  roiExample: "At 1,000 employees, a 20% efficiency gain = $12M in annual labor capacity.",

  whatItIs: `The Agentic Workforce Opportunity Assessment is a rigorous analysis of your organization's workflows, roles, and tasks to identify exactly where AI agents can multiply capacity — and what that means for your bottom line.

This isn't a technology implementation pitch. It's organizational design work: understanding how your people actually work, which tasks are ripe for agent collaboration, and what the realistic financial impact looks like.`,

  deliverables: [
    {
      name: "Process & Task Mapping",
      description: "Detailed analysis of key workflows and the tasks within them, identifying which are candidates for agent automation or augmentation"
    },
    {
      name: "Opportunity Sizing",
      description: "Conservative, defensible estimates of efficiency gains and labor capacity impact — real numbers you can take to your board"
    },
    {
      name: "Risk Assessment",
      description: "Honest evaluation of implementation complexity, change management requirements, and potential organizational friction"
    },
    {
      name: "Transformation Roadmap",
      description: "Prioritized recommendations for which functions to address first, with sequencing that balances quick wins against strategic impact"
    },
    {
      name: "Executive Summary",
      description: "Clear, presentation-ready findings for leadership and board communication"
    }
  ],

  idealCustomer: `Organizations with 500-2,500 employees who recognize that agentic AI represents a fundamental shift in how work gets done — and want a clear-eyed view of what it means for their specific situation before making major decisions.

You're too large to ignore this. You're too small for the big consulting firms to care. And you're smart enough to want real analysis before committing to a transformation.`,

  process: {
    week1: {
      name: "Discovery",
      activities: "Executive interviews, organizational review, identification of priority functions for analysis"
    },
    weeks2_3: {
      name: "Deep Dive",
      activities: "Process mapping, task segmentation, stakeholder interviews, workflow documentation"
    },
    week4: {
      name: "Analysis & Modeling",
      activities: "Opportunity sizing, risk assessment, roadmap development"
    },
    week5: {
      name: "Delivery",
      activities: "Executive presentation, detailed findings report, Q&A session"
    }
  },

  pricing: {
    range: "$15,000 - $25,000",
    factors: "depending on organizational complexity and scope of functions analyzed",
    valueProposition: "You walk away with a clear picture — whether you engage SDI for the transformation work or not."
  },

  whySDI: `We've spent 20+ years helping Fortune 1000 companies with organizational design and talent development. We understand how organizations actually work — the formal structures and the informal ones, the processes on paper and the workarounds people use in practice.

We're also practitioners, not just advisors. We run our own operations using multi-agent AI systems. We know what's possible, what's hype, and what it actually takes to integrate agents into real workflows.

That combination — deep OD expertise plus hands-on agentic AI experience — is rare. The big consulting firms are selling technology. The AI vendors are selling tools. We're helping you redesign your organization for a future that's already arriving.`,

  contact: {
    name: "Jeremy Erard",
    email: "jeremy@sdiclarity.com",
    website: "sdiclarity.ai"
  }
};

/**
 * Get formatted knowledge for system prompt
 */
export function getAIAssessmentPromptKnowledge(): string {
  const k = AI_ASSESSMENT_KNOWLEDGE;
  return `
## AI WORKFORCE ASSESSMENT (Flagship Service)

**Tagline:** ${k.tagline}

**The Opportunity:**
${k.theOpportunity}

**ROI Example:** ${k.roiExample}

**What It Is:**
${k.whatItIs}

**What They Get:**
${k.deliverables.map(d => `- **${d.name}:** ${d.description}`).join('\n')}

**Ideal Customer:**
${k.idealCustomer}

**The Process (5 Weeks):**
- Week 1 (${k.process.week1.name}): ${k.process.week1.activities}
- Weeks 2-3 (${k.process.weeks2_3.name}): ${k.process.weeks2_3.activities}
- Week 4 (${k.process.week4.name}): ${k.process.week4.activities}
- Week 5 (${k.process.week5.name}): ${k.process.week5.activities}

**Investment:** ${k.pricing.range} ${k.pricing.factors}
${k.pricing.valueProposition}

**Why SDI:**
${k.whySDI}
`;
}

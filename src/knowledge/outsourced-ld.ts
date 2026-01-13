/**
 * Outsourced Talent Development Knowledge
 *
 * Source: SDI Outsourced Talent Development Biz Case.pages
 * This knowledge is embedded in Clara's system prompt for conversations
 * about the Outsourced L&D service.
 */

export const OUTSOURCED_LD_KNOWLEDGE = {
  serviceName: "Outsourced Talent Development Services",
  tagline: "Enterprise L&D capabilities at mid-market investment.",

  targetMarket: {
    companySize: "500-2,500 employees",
    geography: "Midwest United States (initially)",
    verticals: ["Manufacturing", "Insurance", "Retail", "Mortgage/Lending"]
  },

  marketOpportunity: {
    totalAddressableMarket: "12,000-15,000 organizations",
    revenuePerClient: "$100K-$360K ARR per client",
    addressableRevenue: "$50M+ in Year 5"
  },

  competitiveAdvantage: [
    "Proven industry expertise (Haworth, BCBSM, Meijer case studies)",
    "Grant navigation capabilities",
    "Integrated delivery model",
    "20+ years of partnership with enterprise clients"
  ],

  verticalExpertise: {
    manufacturing: {
      whyStrong: "20+ years of partnership with enterprise manufacturers",
      expertise: ["Safety and compliance training", "Technology transformation", "Change management"],
      culture: "Strong fit with 'all hands' culture - we speak the language",
      targetCompanies: "Tier 2/3 regional manufacturers, plastics companies, metal fabricators, machine shops at scale",
      associations: ["Michigan Manufacturers Association (MMA)", "Wisconsin Manufacturers & Commerce (WMC)"]
    },
    insurance: {
      whyStrong: "Blue Cross Blue Shield of Michigan testimonials and case studies",
      expertise: ["Scenario-based simulations and games", "Biannual/annual product knowledge updates", "Claims systems and portals training"],
      note: "Not clinical - we focus on operational and customer-facing roles",
      targetCompanies: ["TPAs", "Regional/virtual carriers", "Pharmacy benefit managers"],
      specializations: ["Open enrollment support", "CAHPS/Star Ratings improvement through training", "CMS regulatory updates"],
      associations: ["AHIP (America's Health Insurance Plans)", "HCAA (Health Care Administrators Association)"]
    },
    retail: {
      challenges: "High turnover creates constant onboarding needs",
      expertise: ["Front-line supervisor development", "Multi-location consistency", "Customer experience training"],
      roiProof: "Can calculate turnover cost reduction by 6 points",
      targetCompanies: ["Michigan-based regional chains", "Restaurant groups"]
    },
    mortgageLending: {
      expertise: ["Compliance training (TRID, RESPA)", "LOS system training", "Loan originator licensing and continuing education"],
      geography: "Detroit metro concentration",
      targetCompanies: "Credit unions and community banks with affiliated mortgage units",
      associations: ["MBA (Mortgage Bankers Association)", "Credit union leagues", "Mid-Michigan banking groups"]
    }
  },

  targetBuyerPainPoints: [
    "Cannot justify full-time instructional designers or LMS administrators",
    "HR teams average 1 HR person per 100 employees - no bandwidth for L&D",
    "Patchwork approach: LinkedIn Learning subscriptions, vendor training, tribal knowledge",
    "Knowledge transfer issues when employees leave",
    "No measurement of training effectiveness",
    "25-35% higher turnover than companies with structured L&D",
    "Compliance audit failures",
    "Skills drift without systematic development"
  ],

  buyerPersonas: {
    economicBuyer: {
      titles: ["CHRO", "SVP Human Resources", "COO"],
      concerns: "Budget authority, skeptical of consultants",
      approach: "Must approve - focus on ROI and business outcomes"
    },
    champion: {
      titles: ["HR Director", "Training Manager"],
      concerns: "Day-to-day pain, wants solutions that don't disrupt operations",
      approach: "Feels the pain daily, will advocate internally"
    }
  },

  serviceModel: {
    description: "Full L&D department capabilities for the cost of a single training coordinator",
    includes: [
      "Training strategy and needs analysis",
      "Instructional design and content development",
      "LMS administration and management",
      "Training delivery (ILT, VILT, eLearning)",
      "Measurement and reporting",
      "Continuous improvement"
    ]
  },

  proofPoints: {
    retention: "94% of employees stay longer when invested in development",
    productivity: "37% productivity improvement from structured L&D",
    turnoverCost: "30-35% of salary to replace one employee",
    clients: ["Haworth", "Blue Cross Blue Shield of Michigan", "Meijer"]
  }
};

/**
 * Get formatted knowledge for system prompt
 */
export function getOutsourcedLDPromptKnowledge(): string {
  const k = OUTSOURCED_LD_KNOWLEDGE;
  return `
## OUTSOURCED TALENT DEVELOPMENT (L&D Partnership)

**Tagline:** ${k.tagline}

**Target Market:** ${k.targetMarket.companySize} employees, focused on ${k.targetMarket.verticals.join(', ')}

**The Problem We Solve:**
${k.targetBuyerPainPoints.map(p => `- ${p}`).join('\n')}

**Service Model:** ${k.serviceModel.description}

**What's Included:**
${k.serviceModel.includes.map(s => `- ${s}`).join('\n')}

**Proof Points:**
- ${k.proofPoints.retention}
- ${k.proofPoints.productivity}
- ${k.proofPoints.turnoverCost}
- Proven with clients like ${k.proofPoints.clients.join(', ')}

**Vertical Expertise:**

*Manufacturing:* ${k.verticalExpertise.manufacturing.whyStrong}
- Expertise: ${k.verticalExpertise.manufacturing.expertise.join(', ')}

*Insurance:* ${k.verticalExpertise.insurance.whyStrong}
- Expertise: ${k.verticalExpertise.insurance.expertise.join(', ')}

*Retail:* High turnover challenges
- ${k.verticalExpertise.retail.roiProof}

*Mortgage/Lending:* Compliance-heavy
- Expertise: ${k.verticalExpertise.mortgageLending.expertise.join(', ')}

**Revenue Potential:** ${k.marketOpportunity.revenuePerClient}

**Buyer Personas:**
- Economic Buyer: ${k.buyerPersonas.economicBuyer.titles.join(', ')}
- Champion: ${k.buyerPersonas.champion.titles.join(', ')}
`;
}

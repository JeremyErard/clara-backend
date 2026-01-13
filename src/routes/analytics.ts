/**
 * Analytics Routes
 *
 * Endpoints for querying experiment results and metrics
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { calculateSignificance, generateExperimentSummary, type VariantStats } from '../learning/stats.js';

export const analyticsRouter = Router();

/**
 * GET /api/analytics/experiments
 *
 * List all experiments with summary stats
 */
analyticsRouter.get('/experiments', async (req: Request, res: Response) => {
  try {
    const experiments = await prisma.experiment.findMany({
      include: {
        variants: {
          include: {
            _count: {
              select: { outcomes: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const results = experiments.map(exp => ({
      id: exp.id,
      name: exp.name,
      description: exp.description,
      status: exp.status,
      targetSize: exp.targetSize,
      startedAt: exp.startedAt,
      endedAt: exp.endedAt,
      createdAt: exp.createdAt,
      variants: exp.variants.map(v => ({
        id: v.id,
        name: v.name,
        weight: v.weight,
        conversationCount: v._count.outcomes,
      })),
      totalConversations: exp.variants.reduce((sum, v) => sum + v._count.outcomes, 0),
    }));

    res.json(results);
  } catch (error) {
    console.error('Error fetching experiments:', error);
    res.status(500).json({ error: 'Failed to fetch experiments' });
  }
});

/**
 * GET /api/analytics/experiments/:id
 *
 * Get detailed stats for a specific experiment
 */
analyticsRouter.get('/experiments/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const experiment = await prisma.experiment.findUnique({
      where: { id },
      include: {
        variants: {
          include: {
            outcomes: true,
          },
        },
      },
    });

    if (!experiment) {
      res.status(404).json({ error: 'Experiment not found' });
      return;
    }

    // Calculate stats for each variant
    const variantStats: VariantStats[] = experiment.variants.map(v => {
      const total = v.outcomes.length;
      const conversions = v.outcomes.filter(o =>
        o.outcome === 'SCHEDULED' || o.outcome === 'QUALIFIED'
      ).length;

      return {
        name: v.name,
        conversions,
        total,
        rate: total > 0 ? conversions / total : 0,
      };
    });

    // Find control variant
    const controlIndex = variantStats.findIndex(v => v.name === 'control');
    const control = controlIndex >= 0 ? variantStats[controlIndex] : variantStats[0];
    const otherVariants = variantStats.filter((_, i) => i !== controlIndex && controlIndex >= 0);

    // Calculate significance
    const { summary, results, overallRecommendation } = generateExperimentSummary(
      control,
      otherVariants.length > 0 ? otherVariants : variantStats.slice(1)
    );

    // Outcome breakdown by variant
    const outcomeBreakdown = experiment.variants.map(v => {
      const outcomes = v.outcomes.reduce((acc, o) => {
        acc[o.outcome] = (acc[o.outcome] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const avgMessages = v.outcomes.length > 0
        ? v.outcomes.reduce((sum, o) => sum + o.messageCount, 0) / v.outcomes.length
        : 0;

      const avgDuration = v.outcomes.length > 0
        ? v.outcomes.reduce((sum, o) => sum + o.durationSec, 0) / v.outcomes.length
        : 0;

      return {
        variantName: v.name,
        outcomes,
        avgMessages: Math.round(avgMessages * 10) / 10,
        avgDurationMinutes: Math.round(avgDuration / 6) / 10, // Convert to minutes with 1 decimal
      };
    });

    res.json({
      experiment: {
        id: experiment.id,
        name: experiment.name,
        description: experiment.description,
        status: experiment.status,
        targetSize: experiment.targetSize,
        startedAt: experiment.startedAt,
        endedAt: experiment.endedAt,
      },
      variantStats,
      significanceResults: results,
      outcomeBreakdown,
      summary,
      recommendation: overallRecommendation,
    });
  } catch (error) {
    console.error('Error fetching experiment details:', error);
    res.status(500).json({ error: 'Failed to fetch experiment details' });
  }
});

/**
 * GET /api/analytics/outcomes
 *
 * Query conversation outcomes with filters
 */
analyticsRouter.get('/outcomes', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, outcome, variantId, limit = '100' } = req.query;

    const where: any = {};

    if (startDate) {
      where.outcomeAt = { ...where.outcomeAt, gte: new Date(startDate as string) };
    }
    if (endDate) {
      where.outcomeAt = { ...where.outcomeAt, lte: new Date(endDate as string) };
    }
    if (outcome) {
      where.outcome = outcome;
    }
    if (variantId) {
      where.variantId = variantId;
    }

    const outcomes = await prisma.conversationOutcome.findMany({
      where,
      include: {
        conversation: {
          select: {
            id: true,
            sessionId: true,
            currentPage: true,
          },
        },
        variant: {
          select: {
            name: true,
            experiment: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { outcomeAt: 'desc' },
      take: parseInt(limit as string),
    });

    res.json(outcomes);
  } catch (error) {
    console.error('Error fetching outcomes:', error);
    res.status(500).json({ error: 'Failed to fetch outcomes' });
  }
});

/**
 * GET /api/analytics/daily
 *
 * Get daily aggregated metrics
 */
analyticsRouter.get('/daily', async (req: Request, res: Response) => {
  try {
    const { days = '30' } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days as string));

    const metrics = await prisma.dailyMetrics.findMany({
      where: {
        date: { gte: startDate },
      },
      include: {
        variant: {
          select: { name: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    res.json(metrics);
  } catch (error) {
    console.error('Error fetching daily metrics:', error);
    res.status(500).json({ error: 'Failed to fetch daily metrics' });
  }
});

/**
 * GET /api/analytics/summary
 *
 * Get overall summary statistics
 */
analyticsRouter.get('/summary', async (req: Request, res: Response) => {
  try {
    const { days = '30' } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days as string));

    // Get outcome counts
    const outcomeCounts = await prisma.conversationOutcome.groupBy({
      by: ['outcome'],
      where: {
        outcomeAt: { gte: startDate },
      },
      _count: true,
    });

    // Get total conversations
    const totalConversations = await prisma.conversation.count({
      where: {
        startedAt: { gte: startDate },
      },
    });

    // Get average engagement
    const avgEngagement = await prisma.conversationOutcome.aggregate({
      where: {
        outcomeAt: { gte: startDate },
      },
      _avg: {
        messageCount: true,
        durationSec: true,
      },
    });

    // Calculate conversion rates
    const outcomes = outcomeCounts.reduce((acc, o) => {
      acc[o.outcome] = o._count;
      return acc;
    }, {} as Record<string, number>);

    const totalTracked = Object.values(outcomes).reduce((sum, count) => sum + count, 0);

    res.json({
      period: `Last ${days} days`,
      totalConversations,
      trackedOutcomes: totalTracked,
      outcomes,
      conversionRates: {
        scheduled: totalTracked > 0 ? ((outcomes.SCHEDULED || 0) / totalTracked * 100).toFixed(1) + '%' : '0%',
        qualified: totalTracked > 0 ? ((outcomes.QUALIFIED || 0) / totalTracked * 100).toFixed(1) + '%' : '0%',
        interested: totalTracked > 0 ? ((outcomes.INTERESTED || 0) / totalTracked * 100).toFixed(1) + '%' : '0%',
        bounced: totalTracked > 0 ? ((outcomes.BOUNCED || 0) / totalTracked * 100).toFixed(1) + '%' : '0%',
      },
      avgEngagement: {
        messages: Math.round((avgEngagement._avg.messageCount || 0) * 10) / 10,
        durationMinutes: Math.round((avgEngagement._avg.durationSec || 0) / 6) / 10,
      },
    });
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

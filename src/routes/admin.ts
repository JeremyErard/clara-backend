/**
 * Admin Routes
 *
 * Endpoints for managing experiments and system configuration
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import {
  createExperiment,
  activateExperiment,
  pauseExperiment,
  completeExperiment,
  EXAMPLE_EXPERIMENTS,
} from '../learning/experiments.js';

export const adminRouter = Router();

/**
 * POST /api/admin/experiments
 *
 * Create a new experiment
 */
adminRouter.post('/experiments', async (req: Request, res: Response) => {
  try {
    const { name, description, targetSize, variants } = req.body;

    if (!name || !variants || !Array.isArray(variants) || variants.length < 2) {
      res.status(400).json({
        error: 'Invalid request. Required: name, variants (array with at least 2 items)'
      });
      return;
    }

    const experimentId = await createExperiment({
      name,
      description,
      targetSize,
      variants,
    });

    res.status(201).json({
      id: experimentId,
      message: 'Experiment created successfully',
    });
  } catch (error) {
    console.error('Error creating experiment:', error);
    res.status(500).json({ error: 'Failed to create experiment' });
  }
});

/**
 * POST /api/admin/experiments/from-template
 *
 * Create an experiment from a predefined template
 */
adminRouter.post('/experiments/from-template', async (req: Request, res: Response) => {
  try {
    const { template } = req.body;

    const templateConfig = EXAMPLE_EXPERIMENTS[template as keyof typeof EXAMPLE_EXPERIMENTS];

    if (!templateConfig) {
      res.status(400).json({
        error: 'Invalid template. Available: ' + Object.keys(EXAMPLE_EXPERIMENTS).join(', ')
      });
      return;
    }

    const experimentId = await createExperiment(templateConfig);

    res.status(201).json({
      id: experimentId,
      message: `Experiment created from template: ${template}`,
    });
  } catch (error) {
    console.error('Error creating experiment from template:', error);
    res.status(500).json({ error: 'Failed to create experiment' });
  }
});

/**
 * PATCH /api/admin/experiments/:id
 *
 * Update experiment status
 */
adminRouter.patch('/experiments/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    switch (action) {
      case 'activate':
        await activateExperiment(id);
        res.json({ message: 'Experiment activated' });
        break;

      case 'pause':
        await pauseExperiment(id);
        res.json({ message: 'Experiment paused' });
        break;

      case 'complete':
        await completeExperiment(id);
        res.json({ message: 'Experiment completed' });
        break;

      default:
        res.status(400).json({ error: 'Invalid action. Available: activate, pause, complete' });
    }
  } catch (error) {
    console.error('Error updating experiment:', error);
    res.status(500).json({ error: 'Failed to update experiment' });
  }
});

/**
 * DELETE /api/admin/experiments/:id
 *
 * Delete an experiment (only if draft or no data)
 */
adminRouter.delete('/experiments/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const experiment = await prisma.experiment.findUnique({
      where: { id },
      include: {
        variants: {
          include: {
            _count: {
              select: { outcomes: true },
            },
          },
        },
      },
    });

    if (!experiment) {
      res.status(404).json({ error: 'Experiment not found' });
      return;
    }

    const hasData = experiment.variants.some(v => v._count.outcomes > 0);

    if (hasData) {
      res.status(400).json({
        error: 'Cannot delete experiment with data. Mark as completed instead.'
      });
      return;
    }

    // Delete variants first, then experiment
    await prisma.variant.deleteMany({ where: { experimentId: id } });
    await prisma.experiment.delete({ where: { id } });

    res.json({ message: 'Experiment deleted' });
  } catch (error) {
    console.error('Error deleting experiment:', error);
    res.status(500).json({ error: 'Failed to delete experiment' });
  }
});

/**
 * GET /api/admin/experiments/templates
 *
 * List available experiment templates
 */
adminRouter.get('/experiments/templates', (req: Request, res: Response) => {
  const templates = Object.entries(EXAMPLE_EXPERIMENTS).map(([key, config]) => ({
    key,
    name: config.name,
    description: config.description,
    variantCount: config.variants.length,
  }));

  res.json(templates);
});

/**
 * POST /api/admin/outcomes/refresh
 *
 * Manually trigger outcome refresh for stale conversations
 */
adminRouter.post('/outcomes/refresh', async (req: Request, res: Response) => {
  try {
    const { updateStaleOutcomes } = await import('../services/outcome-tracker.js');
    const updated = await updateStaleOutcomes();

    res.json({
      message: `Refreshed ${updated} stale conversation outcomes`,
      updated,
    });
  } catch (error) {
    console.error('Error refreshing outcomes:', error);
    res.status(500).json({ error: 'Failed to refresh outcomes' });
  }
});

/**
 * GET /api/admin/system/status
 *
 * Get system status and active experiment info
 */
adminRouter.get('/system/status', async (req: Request, res: Response) => {
  try {
    const activeExperiment = await prisma.experiment.findFirst({
      where: { status: 'active' },
      include: {
        variants: true,
      },
    });

    const totalConversations = await prisma.conversation.count();
    const totalLeads = await prisma.lead.count();
    const totalOutcomes = await prisma.conversationOutcome.count();

    res.json({
      status: 'healthy',
      activeExperiment: activeExperiment ? {
        id: activeExperiment.id,
        name: activeExperiment.name,
        variantCount: activeExperiment.variants.length,
        startedAt: activeExperiment.startedAt,
      } : null,
      stats: {
        totalConversations,
        totalLeads,
        totalOutcomes,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching system status:', error);
    res.status(500).json({ error: 'Failed to fetch system status' });
  }
});

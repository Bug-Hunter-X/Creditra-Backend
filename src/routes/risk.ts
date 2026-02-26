import { Router, Request, Response } from 'express';
import { createApiKeyMiddleware } from '../middleware/auth.js';
import { loadApiKeys } from '../config/apiKeys.js';
import { evaluateWallet } from "../services/riskService.js";

const router = Router();

// Use a resolver so API_KEYS is read lazily per-request (handy for tests).
const requireApiKey = createApiKeyMiddleware(() => loadApiKeys());

// ---------------------------------------------------------------------------
// Public endpoints – no API key required
// ---------------------------------------------------------------------------

/**
 * POST /api/risk/evaluate
 * Evaluate risk for a given wallet address.
 */
router.post(
  "/evaluate",
  async (req: Request, res: Response): Promise<void> => {
    const { walletAddress } = req.body as { walletAddress?: string };

    if (!walletAddress) {
      res.status(400).json({ error: "walletAddress is required" });
      return;
    }

    try {
      const result = await evaluateWallet(walletAddress);
      res.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      res.status(400).json({ error: message });
    }
  },
);

// ---------------------------------------------------------------------------
// Internal / admin endpoints – require a valid API key
// ---------------------------------------------------------------------------

/**
 * POST /api/risk/admin/recalibrate
 * Trigger a risk-model recalibration.  Requires admin API key.
 */
router.post('/admin/recalibrate', requireApiKey, (_req: Request, res: Response): void => {
  res.json({ message: 'Risk model recalibration triggered' });
});

export default router;

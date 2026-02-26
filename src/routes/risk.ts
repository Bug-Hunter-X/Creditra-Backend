import { Router } from 'express';
import { validateBody } from '../middleware/validate.js';
import { riskEvaluateSchema } from '../schemas/index.js';
import type { RiskEvaluateBody } from '../schemas/index.js';
import { Router, Request, Response } from "express";
import { evaluateWallet } from "../services/riskService.js";
import { ok, fail } from "../utils/response.js";

export const riskRouter = Router();

riskRouter.post('/evaluate', validateBody(riskEvaluateSchema), (req, res) => {
  const { walletAddress } = req.body as RiskEvaluateBody;
  res.json({
    walletAddress,
    riskScore: 0,
    creditLimit: '0',
    interestRateBps: 0,
    message: 'Risk engine not yet connected; placeholder response.',
  });
});
router.post(
riskRouter.post(
  "/evaluate",
  async (req: Request, res: Response): Promise<void> => {
    const { walletAddress } = req.body as { walletAddress?: string };

    if (!walletAddress) {
      fail(res, "walletAddress is required", 400);
      return;
    }

    try {
      const result = await evaluateWallet(walletAddress);
      ok(res, result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      fail(res, message, 400);
    }
  },
);

export default router;

import { Router } from 'express';
import { validateBody } from '../middleware/validate.js';
import {
  createCreditLineSchema,
  drawSchema,
  repaySchema,
} from '../schemas/index.js';
import type { CreateCreditLineBody, DrawBody, RepayBody } from '../schemas/index.js';
import { Router, Request, Response } from "express";
import { ok, fail } from "../utils/response.js";
import { adminAuth } from "../middleware/adminAuth.js";
import {
  listCreditLines,
  getCreditLine,
  suspendCreditLine,
  closeCreditLine,
  CreditLineNotFoundError,
  InvalidTransitionError,
} from "../services/creditService.js";

export const creditRouter = Router();

function handleServiceError(err: unknown, res: Response): void {
  if (err instanceof CreditLineNotFoundError) {
    fail(res, err.message, 404);
    return;
  }
  if (err instanceof InvalidTransitionError) {
    fail(res, err.message, 409);
    return;
  }
  fail(res, err, 500);
}

creditRouter.get("/lines", (_req: Request, res: Response): void => {
  ok(res, listCreditLines());
});

creditRouter.get("/lines/:id", (req: Request, res: Response): void => {
  const line = getCreditLine(req.params["id"] as string);
  if (!line) {
    fail(res, `Credit line "${req.params["id"]}" not found.`, 404);
    return;
  }
  ok(res, line);
});

/** Create a new credit line */
creditRouter.post('/lines', validateBody(createCreditLineSchema), (req, res) => {
  const { walletAddress, requestedLimit } = req.body as CreateCreditLineBody;
  res.status(201).json({
    id: 'placeholder-id',
    walletAddress,
    requestedLimit,
    status: 'pending',
    message: 'Credit line creation not yet implemented; placeholder response.',
  });
});

/** Draw from a credit line */
creditRouter.post('/lines/:id/draw', validateBody(drawSchema), (req, res) => {
  const { amount } = req.body as DrawBody;
  res.json({
    id: req.params.id,
    amount,
    message: 'Draw not yet implemented; placeholder response.',
  });
});

/** Repay a credit line */
creditRouter.post('/lines/:id/repay', validateBody(repaySchema), (req, res) => {
  const { amount } = req.body as RepayBody;
  res.json({
    id: req.params.id,
    amount,
    message: 'Repay not yet implemented; placeholder response.',
  });
});
router.post(
creditRouter.post(
  "/lines/:id/suspend",
  adminAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const line = suspendCreditLine(req.params["id"] as string);
      ok(res, { line, message: "Credit line suspended." });
    } catch (err) {
      handleServiceError(err, res);
    }
  },
);

creditRouter.post(
  "/lines/:id/close",
  adminAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const line = closeCreditLine(req.params["id"] as string);
      ok(res, { line, message: "Credit line closed." });
    } catch (err) {
      handleServiceError(err, res);
    }
  },
);

export default router;
);

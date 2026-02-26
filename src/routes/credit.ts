import { Router, Request, Response } from 'express';
import { createApiKeyMiddleware } from '../middleware/auth.js';
import { loadApiKeys } from '../config/apiKeys.js';
import {
  listCreditLines,
  getCreditLine,
  suspendCreditLine,
  closeCreditLine,
  CreditLineNotFoundError,
  InvalidTransitionError,
} from "../services/creditService.js";

const router = Router();

// Use a resolver function so API_KEYS is read lazily per-request,
// allowing the env var to be set after module import (e.g. in tests).
const requireApiKey = createApiKeyMiddleware(() => loadApiKeys());

function handleServiceError(err: unknown, res: Response): void {
  if (err instanceof CreditLineNotFoundError) {
    res.status(404).json({ error: err.message });
    return;
  }
  if (err instanceof InvalidTransitionError) {
    res.status(409).json({ error: err.message });
    return;
  }
  const message = err instanceof Error ? err.message : "Internal server error";
  res.status(500).json({ error: message });
}

// ---------------------------------------------------------------------------
// Public endpoints – no API key required
// ---------------------------------------------------------------------------

router.get("/lines", (_req: Request, res: Response): void => {
  res.json({ data: listCreditLines() });
});

router.get("/lines/:id", (req: Request, res: Response): void => {
  const line = getCreditLine(req.params["id"] as string);
  if (!line) {
    res.status(404).json({ error: `Credit line "${req.params["id"]}" not found.` });
    return;
  }
  res.json({ data: line });
});

// ---------------------------------------------------------------------------
// Admin endpoints – require a valid API key via `X-API-Key` header
// ---------------------------------------------------------------------------

/**
 * POST /api/credit/lines/:id/suspend
 * Suspend an active credit line.  Requires admin API key.
 */
router.post(
  "/lines/:id/suspend",
  requireApiKey,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const line = suspendCreditLine(req.params["id"] as string);
      res.json({ data: line, message: "Credit line suspended." });
    } catch (err) {
      handleServiceError(err, res);
    }
  },
);

/**
 * POST /api/credit/lines/:id/close
 * Permanently close a credit line.  Requires admin API key.
 */
router.post(
  "/lines/:id/close",
  requireApiKey,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const line = closeCreditLine(req.params["id"] as string);
      res.json({ data: line, message: "Credit line closed." });
    } catch (err) {
      handleServiceError(err, res);
    }
  },
);

export default router;

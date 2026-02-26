import { Router, Request, Response } from "express";
import { adminAuth } from "../middleware/adminAuth.js";
import {
  listCreditLines,
  getCreditLine,
  suspendCreditLine,
  closeCreditLine,
  CreditLineNotFoundError,
  InvalidTransitionError,
  drawFromCreditLine
} from "../services/creditService.js";

const router = Router();

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

creditRouter.post('/lines/:id/draw', (req, res) => {
  const { amount, borrowerId } = req.body;
  const id = req.params.id;

  try {
    const updated = drawFromCreditLine({
      id,
      borrowerId,
      amount,
    });

    res.status(200).json({
      message: 'Draw successful',
      creditLine: updated,
    });
  } catch (err: any) {
    switch (err.message) {
      case 'NOT_FOUND':
        return res.status(404).json({ error: 'Credit line not found' });
      case 'INVALID_STATUS':
        return res.status(400).json({ error: 'Credit line not active' });
      case 'UNAUTHORIZED':
        return res.status(403).json({ error: 'Unauthorized borrower' });
      case 'OVER_LIMIT':
        return res.status(400).json({ error: 'Amount exceeds credit limit' });
      case 'INVALID_AMOUNT':
        return res.status(400).json({ error: 'Invalid amount' });
      default:
        return res.status(500).json({ error: 'Internal server error' });
    }
  }
});
router.post(
  "/lines/:id/suspend",
  adminAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const line = suspendCreditLine(req.params["id"] as string);
      res.json({ data: line, message: "Credit line suspended." });
    } catch (err) {
      handleServiceError(err, res);
    }
  },
);

router.post(
  "/lines/:id/close",
  adminAuth,
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

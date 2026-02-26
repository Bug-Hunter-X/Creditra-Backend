import { Router, Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { adminAuth } from "../middleware/adminAuth.js";
import {
  suspendCreditLine,
  closeCreditLine,
  CreditLineNotFoundError,
  InvalidTransitionError,
} from "../services/creditService.js";
import { creditLineRepository } from "../repositories/creditLineRepository.js";

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

const creditRouteErrorHandler: ErrorRequestHandler = (err, _req, res, _next): void => {
  handleServiceError(err, res);
};

router.get("/lines", (_req: Request, res: Response): void => {
  res.json({ data: creditLineRepository.getAll() });
});


router.get("/lines/:id", (req: Request, res: Response, next: NextFunction): void => {
  try {
    const id = req.params["id"] as string;
    const line = creditLineRepository.getById(id);
    if (!line) {
      throw new CreditLineNotFoundError(id);
    }
    res.status(200).json({ data: line });
  } catch (err) {
    next(err);
  }
});

router.post(
  "/lines/:id/suspend",
  adminAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const line = suspendCreditLine(req.params["id"] as string);
      res.json({ data: line, message: "Credit line suspended." });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  "/lines/:id/close",
  adminAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const line = closeCreditLine(req.params["id"] as string);
      res.json({ data: line, message: "Credit line closed." });
    } catch (err) {
      next(err);
    }
  },
);

router.use(creditRouteErrorHandler);

export default router;

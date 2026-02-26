import { Router, Request, Response } from "express";
import { ok, fail } from "../utils/response.js";
import { adminAuth } from "../middleware/adminAuth.js";
import {
  listCreditLines,
  getCreditLine,
  suspendCreditLine,
  closeCreditLine,
  getTransactions,
  CreditLineNotFoundError,
  InvalidTransitionError,
  type TransactionType,
} from "../services/creditService.js";

export const creditRouter = Router();

const VALID_TRANSACTION_TYPES: TransactionType[] = ["draw", "repayment", "status_change"];

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

creditRouter.get("/lines/:id/transactions", (req: Request, res: Response): void => {
  const id = req.params["id"] as string;
  const { type, from, to, page: pageParam, limit: limitParam } = req.query;

  if (type !== undefined && !VALID_TRANSACTION_TYPES.includes(type as TransactionType)) {
    fail(
      res,
      `Invalid type filter. Must be one of: ${VALID_TRANSACTION_TYPES.join(", ")}.`,
      400,
    );
    return;
  }

  if (from !== undefined && isNaN(new Date(from as string).getTime())) {
    fail(res, "Invalid 'from' date. Must be a valid ISO 8601 date.", 400);
    return;
  }

  if (to !== undefined && isNaN(new Date(to as string).getTime())) {
    fail(res, "Invalid 'to' date. Must be a valid ISO 8601 date.", 400);
    return;
  }

  const page = pageParam !== undefined ? parseInt(pageParam as string, 10) : 1;
  const limit = limitParam !== undefined ? parseInt(limitParam as string, 10) : 20;

  if (isNaN(page) || page < 1) {
    fail(res, "Invalid 'page'. Must be a positive integer.", 400);
    return;
  }

  if (isNaN(limit) || limit < 1 || limit > 100) {
    fail(res, "Invalid 'limit'. Must be between 1 and 100.", 400);
    return;
  }

  try {
    const result = getTransactions(
      id,
      {
        type: type as TransactionType | undefined,
        from: from as string | undefined,
        to: to as string | undefined,
      },
      { page, limit },
    );
    ok(res, result);
  } catch (err) {
    handleServiceError(err, res);
  }
});

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

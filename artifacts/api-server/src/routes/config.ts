import { Router } from "express";
import { db, appConfigTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const TOKEN_PRICE_KEY = "token_price_rs";
const DEFAULT_PRICE = 1.1;

/** GET /config/token-price  — public, no auth needed */
router.get("/config/token-price", async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(appConfigTable)
      .where(eq(appConfigTable.key, TOKEN_PRICE_KEY))
      .limit(1);
    const price = rows[0]?.value ? parseFloat(rows[0].value) : DEFAULT_PRICE;
    res.json({ tokenPriceRs: price, updatedAt: rows[0]?.updatedAt ?? null });
  } catch {
    // Fallback so the app keeps working even if DB is temporarily unavailable
    res.json({ tokenPriceRs: DEFAULT_PRICE, updatedAt: null });
  }
});

/** PUT /admin/config/token-price  — requires x-admin-key header */
router.put("/admin/config/token-price", async (req, res) => {
  const adminKey = req.headers["x-admin-key"];
  const expectedKey = process.env["ADMIN_SECRET_KEY"];

  if (!expectedKey || adminKey !== expectedKey) {
    res.status(401).json({ error: "Unauthorized — invalid admin key" });
    return;
  }

  const { price } = req.body as { price?: unknown };
  const parsed = typeof price === "number" ? price : parseFloat(String(price));

  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 1000) {
    res.status(400).json({ error: "price must be a positive number (max 1000)" });
    return;
  }

  const rounded = Math.round(parsed * 100) / 100; // round to 2 decimal places

  await db
    .insert(appConfigTable)
    .values({ key: TOKEN_PRICE_KEY, value: rounded.toString() })
    .onConflictDoUpdate({
      target: appConfigTable.key,
      set: { value: rounded.toString(), updatedAt: new Date() },
    });

  res.json({ tokenPriceRs: rounded, success: true });
});

export default router;

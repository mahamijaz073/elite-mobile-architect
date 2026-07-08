import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * app_config — key/value store for admin-adjustable settings.
 * e.g. token_price_rs → "1.1"
 */
export const appConfigTable = pgTable("app_config", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAppConfigSchema = createInsertSchema(appConfigTable);
export type AppConfig = typeof appConfigTable.$inferSelect;
export type InsertAppConfig = z.infer<typeof insertAppConfigSchema>;

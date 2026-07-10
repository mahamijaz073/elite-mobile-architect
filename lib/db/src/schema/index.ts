import { pgTable, text, timestamp, serial } from "drizzle-orm/pg-core";
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

/**
 * posts — admin-authored feed posts, with an optional screenshot image
 * hosted on Cloudinary.
 */
export const postsTable = pgTable("posts", {
  id: serial("id").primaryKey(),
  adminName: text("admin_name").notNull(),
  contentText: text("content_text").notNull(),
  screenshotUrl: text("screenshot_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPostSchema = createInsertSchema(postsTable);
export type PostRow = typeof postsTable.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;

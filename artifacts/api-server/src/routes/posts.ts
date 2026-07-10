import { Router, type IRouter } from "express";
import multer from "multer";
import { db, postsTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { uploadImageBuffer } from "../lib/cloudinary";

const router: IRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image uploads are allowed"));
      return;
    }
    cb(null, true);
  },
});

/** GET /posts — public, returns latest posts first */
router.get("/posts", async (_req, res) => {
  try {
    const rows = await db.select().from(postsTable).orderBy(desc(postsTable.createdAt)).limit(50);
    res.json({ posts: rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to load posts" });
  }
});

/** POST /admin/posts — requires x-admin-key header, multipart/form-data with optional "image" file */
router.post("/admin/posts", upload.single("image"), async (req, res) => {
  const adminKey = req.headers["x-admin-key"];
  const expectedKey = process.env["ADMIN_SECRET_KEY"];

  if (!expectedKey || adminKey !== expectedKey) {
    res.status(401).json({ error: "Unauthorized — invalid admin key" });
    return;
  }

  const { adminName, contentText } = req.body as { adminName?: string; contentText?: string };

  if (!contentText || !contentText.trim()) {
    res.status(400).json({ error: "contentText is required" });
    return;
  }

  try {
    let screenshotUrl: string | null = null;
    if (req.file) {
      screenshotUrl = await uploadImageBuffer(req.file.buffer);
    }

    const [row] = await db
      .insert(postsTable)
      .values({
        adminName: adminName?.trim() || "QuizBox Admin",
        contentText: contentText.trim(),
        screenshotUrl,
      })
      .returning();

    res.status(201).json({ post: row });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create post";
    res.status(503).json({ error: message });
  }
});

export default router;

import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import { db, meetingsTable, meetingCommentsTable } from "@workspace/db";
import { CreateCommentBody } from "@workspace/api-zod";

const router: IRouter = Router();

// GET /meetings/:id/comments
router.get("/meetings/:id/comments", async (req, res): Promise<void> => {
  const meetingId = Number(req.params.id);
  if (!Number.isFinite(meetingId) || meetingId <= 0) {
    res.status(400).json({ error: "Invalid meeting ID" });
    return;
  }

  const meeting = await db
    .select({ id: meetingsTable.id })
    .from(meetingsTable)
    .where(eq(meetingsTable.id, meetingId))
    .then((r) => r[0]);

  if (!meeting) {
    res.status(404).json({ error: "Meeting not found" });
    return;
  }

  const comments = await db
    .select()
    .from(meetingCommentsTable)
    .where(eq(meetingCommentsTable.meetingId, meetingId))
    .orderBy(asc(meetingCommentsTable.createdAt));

  res.json(comments);
});

// POST /meetings/:id/comments
router.post("/meetings/:id/comments", async (req, res): Promise<void> => {
  const meetingId = Number(req.params.id);
  if (!Number.isFinite(meetingId) || meetingId <= 0) {
    res.status(400).json({ error: "Invalid meeting ID" });
    return;
  }

  const parsed = CreateCommentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const meeting = await db
    .select({ id: meetingsTable.id })
    .from(meetingsTable)
    .where(eq(meetingsTable.id, meetingId))
    .then((r) => r[0]);

  if (!meeting) {
    res.status(404).json({ error: "Meeting not found" });
    return;
  }

  const [comment] = await db
    .insert(meetingCommentsTable)
    .values({ meetingId, authorName: parsed.data.authorName, content: parsed.data.content })
    .returning();

  res.status(201).json(comment);
});

export default router;

import { Router, type IRouter } from "express";
import { and, eq, inArray, lt, gt, ne, gte, lte } from "drizzle-orm";
import { db, employeesTable, meetingsTable, meetingParticipantsTable } from "@workspace/db";
import {
  CreateMeetingBody,
  CheckConflictBody,
  GetMeetingParams,
  DeleteMeetingParams,
  ListMeetingsResponse,
  GetMeetingResponse,
  GetTodayMeetingsResponse,
  GetWeekMeetingsResponse,
  CheckConflictResponse,
  CreateMeetingResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseListMeetingsQuery(q: Record<string, unknown>) {
  const from = typeof q.from === "string" && DATE_RE.test(q.from) ? q.from : undefined;
  const to = typeof q.to === "string" && DATE_RE.test(q.to) ? q.to : undefined;
  const rawEid = q.employeeId;
  const employeeId = rawEid != null && rawEid !== "" ? Number(rawEid) : undefined;
  if (employeeId !== undefined && (!Number.isFinite(employeeId) || employeeId <= 0)) {
    return { error: "Invalid employeeId" };
  }
  if (q.from && !from) return { error: "Invalid from format (YYYY-MM-DD)" };
  if (q.to && !to) return { error: "Invalid to format (YYYY-MM-DD)" };
  return { data: { from, to, employeeId } };
}

async function buildMeeting(meetingId: number) {
  const meeting = await db
    .select()
    .from(meetingsTable)
    .where(eq(meetingsTable.id, meetingId))
    .then((rows) => rows[0]);

  if (!meeting) return null;

  const [organizer, participantLinks] = await Promise.all([
    db.select().from(employeesTable).where(eq(employeesTable.id, meeting.organizerId)).then((r) => r[0]),
    db.select().from(meetingParticipantsTable).where(eq(meetingParticipantsTable.meetingId, meetingId)),
  ]);

  const participants =
    participantLinks.length > 0
      ? await db
          .select()
          .from(employeesTable)
          .where(inArray(employeesTable.id, participantLinks.map((p) => p.employeeId)))
      : [];

  return { ...meeting, organizer, participants };
}

async function buildManyMeetings(meetingIds: number[]) {
  if (meetingIds.length === 0) return [];
  const results = await Promise.all(meetingIds.map((id) => buildMeeting(id)));
  return results.filter((m) => m != null);
}

async function findConflicts(
  startTime: Date,
  endTime: Date,
  participantIds: number[],
  excludeMeetingId?: number | null
) {
  if (participantIds.length === 0) return [];

  const overlappingLinks = await db
    .select({
      meetingId: meetingParticipantsTable.meetingId,
      employeeId: meetingParticipantsTable.employeeId,
    })
    .from(meetingParticipantsTable)
    .innerJoin(meetingsTable, eq(meetingParticipantsTable.meetingId, meetingsTable.id))
    .where(
      and(
        inArray(meetingParticipantsTable.employeeId, participantIds),
        lt(meetingsTable.startTime, endTime),
        gt(meetingsTable.endTime, startTime),
        excludeMeetingId != null ? ne(meetingsTable.id, excludeMeetingId) : undefined
      )
    );

  if (overlappingLinks.length === 0) return [];

  const uniqueEmpIds = [...new Set(overlappingLinks.map((l) => l.employeeId))];
  const uniqueMeetingIds = [...new Set(overlappingLinks.map((l) => l.meetingId))];

  const [employees, conflictingMeetings] = await Promise.all([
    db.select().from(employeesTable).where(inArray(employeesTable.id, uniqueEmpIds)),
    db.select().from(meetingsTable).where(inArray(meetingsTable.id, uniqueMeetingIds)),
  ]);

  const empMap = new Map(employees.map((e) => [e.id, e]));
  const meetMap = new Map(conflictingMeetings.map((m) => [m.id, m]));

  return overlappingLinks
    .map((link) => {
      const emp = empMap.get(link.employeeId);
      const meet = meetMap.get(link.meetingId);
      if (!emp || !meet) return null;
      return {
        employeeId: emp.id,
        employeeName: emp.name,
        conflictingMeetingId: meet.id,
        conflictingMeetingTitle: meet.title,
      };
    })
    .filter((c) => c != null);
}

// GET /meetings/today
router.get("/meetings/today", async (_req, res): Promise<void> => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  const rows = await db
    .select({ id: meetingsTable.id })
    .from(meetingsTable)
    .where(and(gte(meetingsTable.startTime, startOfDay), lte(meetingsTable.startTime, endOfDay)))
    .orderBy(meetingsTable.startTime);

  const meetings = await buildManyMeetings(rows.map((r) => r.id));
  res.json(GetTodayMeetingsResponse.parse(meetings));
});

// GET /meetings/week
router.get("/meetings/week", async (_req, res): Promise<void> => {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = (day === 0 ? -6 : 1 - day);
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday, 0, 0, 0);
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6, 23, 59, 59);

  const rows = await db
    .select({ id: meetingsTable.id })
    .from(meetingsTable)
    .where(and(gte(meetingsTable.startTime, monday), lte(meetingsTable.startTime, sunday)))
    .orderBy(meetingsTable.startTime);

  const meetings = await buildManyMeetings(rows.map((r) => r.id));
  res.json(GetWeekMeetingsResponse.parse(meetings));
});

// GET /meetings/check-conflict (handled as POST below)

// GET /meetings
router.get("/meetings", async (req, res): Promise<void> => {
  const parsed = parseListMeetingsQuery(req.query as Record<string, unknown>);
  if ("error" in parsed) {
    res.status(400).json({ error: parsed.error });
    return;
  }
  const { from, to, employeeId } = parsed.data;

  const conditions = [];
  if (from) conditions.push(gte(meetingsTable.startTime, new Date(`${from}T00:00:00`)));
  if (to) conditions.push(lte(meetingsTable.startTime, new Date(`${to}T23:59:59`)));

  let rows;
  if (employeeId) {
    rows = await db
      .select({ id: meetingsTable.id })
      .from(meetingsTable)
      .innerJoin(meetingParticipantsTable, eq(meetingsTable.id, meetingParticipantsTable.meetingId))
      .where(and(...conditions, eq(meetingParticipantsTable.employeeId, employeeId)))
      .orderBy(meetingsTable.startTime);
  } else {
    rows = await db
      .select({ id: meetingsTable.id })
      .from(meetingsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(meetingsTable.startTime);
  }

  const meetings = await buildManyMeetings(rows.map((r) => r.id));
  res.json(ListMeetingsResponse.parse(meetings));
});

// POST /meetings
router.post("/meetings", async (req, res): Promise<void> => {
  const parsed = CreateMeetingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { title, description, startTime, endTime, organizerId, participantIds, location } = parsed.data;
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (end <= start) {
    res.status(400).json({ error: "End time must be after start time" });
    return;
  }

  const allParticipants = Array.from(new Set([...(participantIds ?? []), organizerId]));
  const conflicts = await findConflicts(start, end, allParticipants);

  if (conflicts.length > 0) {
    res.status(409).json({ error: "Scheduling conflict", conflicts });
    return;
  }

  const [meeting] = await db
    .insert(meetingsTable)
    .values({ title, description, startTime: start, endTime: end, organizerId, location })
    .returning();

  if (participantIds && participantIds.length > 0) {
    await db.insert(meetingParticipantsTable).values(
      participantIds.map((empId: number) => ({ meetingId: meeting.id, employeeId: empId }))
    );
  }

  const full = await buildMeeting(meeting.id);
  res.status(201).json(CreateMeetingResponse.parse(full));
});

// POST /meetings/check-conflict
router.post("/meetings/check-conflict", async (req, res): Promise<void> => {
  const parsed = CheckConflictBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { startTime, endTime, participantIds, excludeMeetingId } = parsed.data;
  const conflicts = await findConflicts(
    new Date(startTime),
    new Date(endTime),
    participantIds,
    excludeMeetingId
  );

  res.json(CheckConflictResponse.parse({ hasConflict: conflicts.length > 0, conflicts }));
});

// GET /meetings/:id
router.get("/meetings/:id", async (req, res): Promise<void> => {
  const parsed = GetMeetingParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid meeting ID" });
    return;
  }

  const meeting = await buildMeeting(parsed.data.id);
  if (!meeting) {
    res.status(404).json({ error: "Meeting not found" });
    return;
  }

  res.json(GetMeetingResponse.parse(meeting));
});

// DELETE /meetings/:id
router.delete("/meetings/:id", async (req, res): Promise<void> => {
  const parsed = DeleteMeetingParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid meeting ID" });
    return;
  }

  const existing = await db
    .select({ id: meetingsTable.id })
    .from(meetingsTable)
    .where(eq(meetingsTable.id, parsed.data.id))
    .then((r) => r[0]);

  if (!existing) {
    res.status(404).json({ error: "Meeting not found" });
    return;
  }

  await db.delete(meetingsTable).where(eq(meetingsTable.id, parsed.data.id));
  res.status(204).send();
});

export default router;

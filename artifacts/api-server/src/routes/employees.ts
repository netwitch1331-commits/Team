import { Router, type IRouter } from "express";
import { eq, and, gte, lte, inArray } from "drizzle-orm";
import { db, employeesTable, meetingsTable, meetingParticipantsTable } from "@workspace/db";
import { z } from "zod";

const router: IRouter = Router();

const AVATAR_COLORS = [
  "#e85d2f", "#6366f1", "#059669", "#d97706", "#7c3aed", "#db2777", "#0891b2",
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// GET /employees
router.get("/employees", async (_req, res): Promise<void> => {
  const employees = await db.select().from(employeesTable).orderBy(employeesTable.name);
  res.json(employees);
});

// POST /employees
router.post("/employees", async (req, res): Promise<void> => {
  const parsed = CreateEmployeeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, role, department, color } = parsed.data;
  const avatarInitials = getInitials(name);
  const assignedColor = color ?? AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

  const [employee] = await db
    .insert(employeesTable)
    .values({ name, role, department, avatarInitials, color: assignedColor })
    .returning();

  res.status(201).json(employee);
});

// GET /employees/:id
router.get("/employees/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    res.status(400).json({ error: "Invalid employee ID" });
    return;
  }

  const employee = await db
    .select()
    .from(employeesTable)
    .where(eq(employeesTable.id, id))
    .then((r) => r[0]);

  if (!employee) {
    res.status(404).json({ error: "Employee not found" });
    return;
  }

  res.json(employee);
});

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// GET /employees/:id/meetings
router.get("/employees/:id/meetings", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    res.status(400).json({ error: "Invalid employee ID" });
    return;
  }

  const q = req.query as Record<string, unknown>;
  const from = typeof q.from === "string" && DATE_RE.test(q.from) ? q.from : undefined;
  const to = typeof q.to === "string" && DATE_RE.test(q.to) ? q.to : undefined;

  const conditions = [eq(meetingParticipantsTable.employeeId, id)];
  if (from) conditions.push(gte(meetingsTable.startTime, new Date(`${from}T00:00:00`)));
  if (to) conditions.push(lte(meetingsTable.startTime, new Date(`${to}T23:59:59`)));

  const rows = await db
    .select({ id: meetingsTable.id })
    .from(meetingsTable)
    .innerJoin(meetingParticipantsTable, eq(meetingsTable.id, meetingParticipantsTable.meetingId))
    .where(and(...conditions))
    .orderBy(meetingsTable.startTime);

  if (rows.length === 0) {
    res.json([]);
    return;
  }

  // Build full meeting objects
  const meetingIds = rows.map((r) => r.id);
  const meetings = await db.select().from(meetingsTable).where(inArray(meetingsTable.id, meetingIds));

  const participantLinks = await db
    .select()
    .from(meetingParticipantsTable)
    .where(inArray(meetingParticipantsTable.meetingId, meetingIds));

  const uniqueEmpIds = [...new Set(participantLinks.map((p) => p.employeeId))];
  const allEmps = uniqueEmpIds.length > 0
    ? await db.select().from(employeesTable).where(inArray(employeesTable.id, uniqueEmpIds))
    : [];
  const empMap = new Map(allEmps.map((e) => [e.id, e]));

  const organizerIds = [...new Set(meetings.map((m) => m.organizerId))];
  const organizers = organizerIds.length > 0
    ? await db.select().from(employeesTable).where(inArray(employeesTable.id, organizerIds))
    : [];
  const orgMap = new Map(organizers.map((e) => [e.id, e]));

  const result = meetings.map((m) => {
    const links = participantLinks.filter((p) => p.meetingId === m.id);
    const participants = links.map((l) => empMap.get(l.employeeId)).filter(Boolean);
    return { ...m, organizer: orgMap.get(m.organizerId)!, participants };
  });

  res.json(result);
});

export default router;

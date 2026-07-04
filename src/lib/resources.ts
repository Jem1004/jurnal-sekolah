import { and, asc, eq, ilike, or } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import {
  academicYears,
  classes,
  subjects,
  teachers,
  students,
  teachingAssignments,
  periodTemplates,
  schedules,
  holidays,
  users,
} from "@/db/schema";
import { ApiError, mapDbError, type SessionUser } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";
import * as V from "@/lib/validation";

/* eslint-disable @typescript-eslint/no-explicit-any */

type Mode = "create" | "update";

interface ResourceConfig {
  table: any;
  entity: string;
  schoolScoped: boolean;
  create: z.ZodTypeAny;
  update: z.ZodTypeAny;
  order?: (t: any) => any;
  transform?: (v: any, mode: Mode) => Promise<any> | any;
  redact?: (r: any) => any;
  validate?: (
    v: any,
    mode: Mode,
    ctx: { excludeId?: string },
  ) => Promise<void> | void;
  listFilter?: (t: any, sp: URLSearchParams) => any | undefined;
  /** Column names searchable via ?q= (case-insensitive). */
  search?: string[];
}

const DEFAULT_LIMIT = 500;

/** Reject schedules that clash with an existing one on class or teacher. */
async function checkScheduleConflict(v: any, excludeId?: string) {
  const [asg] = await db
    .select()
    .from(teachingAssignments)
    .where(eq(teachingAssignments.id, v.teachingAssignmentId));
  if (!asg) throw new ApiError(400, "Penugasan mengajar tidak ditemukan.");

  const rows = await db
    .select({
      id: schedules.id,
      classId: schedules.classId,
      start: schedules.periodNoStart,
      end: schedules.periodNoEnd,
      teacherId: teachingAssignments.teacherId,
    })
    .from(schedules)
    .innerJoin(
      teachingAssignments,
      eq(schedules.teachingAssignmentId, teachingAssignments.id),
    )
    .where(
      and(
        eq(schedules.academicYearId, v.academicYearId),
        eq(schedules.dayOfWeek, v.dayOfWeek),
      ),
    );

  for (const r of rows) {
    if (excludeId && r.id === excludeId) continue;
    const overlap = v.periodNoStart <= r.end && r.start <= v.periodNoEnd;
    if (!overlap) continue;
    if (r.classId === v.classId) {
      throw new ApiError(409, "Bentrok: kelas sudah punya jadwal pada jam itu.");
    }
    if (r.teacherId === asg.teacherId) {
      throw new ApiError(
        409,
        "Bentrok: guru sudah mengajar di kelas lain pada jam itu.",
      );
    }
  }
}

const REGISTRY: Record<string, ResourceConfig> = {
  "academic-years": {
    table: academicYears,
    entity: "academic_year",
    schoolScoped: true,
    create: V.academicYearCreate,
    update: V.academicYearCreate.partial(),
    order: (t) => asc(t.name),
  },
  classes: {
    table: classes,
    entity: "class",
    schoolScoped: true,
    create: V.classCreate,
    update: V.classCreate.partial(),
    order: (t) => asc(t.name),
    listFilter: (t, sp) => {
      const ay = sp.get("academic_year_id");
      return ay ? eq(t.academicYearId, ay) : undefined;
    },
  },
  subjects: {
    table: subjects,
    entity: "subject",
    schoolScoped: true,
    create: V.subjectCreate,
    update: V.subjectCreate.partial(),
    order: (t) => asc(t.name),
  },
  teachers: {
    table: teachers,
    entity: "teacher",
    schoolScoped: true,
    create: V.teacherCreate,
    update: V.teacherCreate.partial(),
    order: (t) => asc(t.name),
  },
  students: {
    table: students,
    entity: "student",
    schoolScoped: true,
    create: V.studentCreate,
    update: V.studentCreate.partial(),
    order: (t) => asc(t.name),
    search: ["name", "nisn"],
  },
  assignments: {
    table: teachingAssignments,
    entity: "teaching_assignment",
    schoolScoped: false,
    create: V.assignmentCreate,
    update: V.assignmentCreate.partial(),
    listFilter: (t, sp) => {
      const ay = sp.get("academic_year_id");
      const cls = sp.get("class_id");
      const conds = [];
      if (ay) conds.push(eq(t.academicYearId, ay));
      if (cls) conds.push(eq(t.classId, cls));
      return conds.length ? and(...conds) : undefined;
    },
  },
  "period-templates": {
    table: periodTemplates,
    entity: "period_template",
    schoolScoped: true,
    create: V.periodTemplateCreate,
    update: V.periodTemplateCreate.partial(),
    order: (t) => asc(t.dayOfWeek),
  },
  schedules: {
    table: schedules,
    entity: "schedule",
    schoolScoped: false,
    create: V.scheduleCreate,
    update: V.scheduleCreate, // grid editor sends full payload
    validate: (v, _mode, ctx) => checkScheduleConflict(v, ctx.excludeId),
    listFilter: (t, sp) => {
      const cls = sp.get("class_id");
      const ay = sp.get("academic_year_id");
      const conds = [];
      if (cls) conds.push(eq(t.classId, cls));
      if (ay) conds.push(eq(t.academicYearId, ay));
      return conds.length ? and(...conds) : undefined;
    },
  },
  holidays: {
    table: holidays,
    entity: "holiday",
    schoolScoped: true,
    create: V.holidayCreate,
    update: V.holidayCreate.partial(),
    order: (t) => asc(t.date),
  },
  users: {
    table: users,
    entity: "user",
    schoolScoped: true,
    create: V.userCreate,
    update: V.userCreate.partial(),
    order: (t) => asc(t.name),
    transform: async (v, mode) => {
      const out: any = { ...v };
      if (out.email === "") out.email = null;
      if (out.password) out.passwordHash = await bcrypt.hash(out.password, 10);
      delete out.password;
      if (mode === "create" && !out.passwordHash) {
        throw new ApiError(400, "Password wajib diisi saat membuat akun.");
      }
      return out;
    },
    redact: (r) => {
      const o = { ...r };
      delete o.passwordHash;
      return o;
    },
  },
};

export function getConfig(slug: string): ResourceConfig {
  const cfg = REGISTRY[slug];
  if (!cfg) throw new ApiError(404, `Sumber daya "${slug}" tidak dikenal.`);
  return cfg;
}

export async function listResource(
  slug: string,
  session: SessionUser,
  sp: URLSearchParams,
) {
  const cfg = getConfig(slug);
  const conds: any[] = [];
  if (cfg.schoolScoped) conds.push(eq(cfg.table.schoolId, session.schoolId));
  if (cfg.listFilter) {
    const c = cfg.listFilter(cfg.table, sp);
    if (c) conds.push(c);
  }

  // Optional server-side text search across configured columns.
  const q = sp.get("q")?.trim();
  if (q && cfg.search?.length) {
    const like = `%${q}%`;
    conds.push(or(...cfg.search.map((col) => ilike(cfg.table[col], like))));
  }

  const limitParam = Number(sp.get("limit"));
  const limit =
    Number.isFinite(limitParam) && limitParam > 0
      ? Math.min(limitParam, DEFAULT_LIMIT)
      : DEFAULT_LIMIT;

  const base: any = db.select().from(cfg.table);
  const filtered = conds.length ? base.where(and(...conds)) : base;
  const ordered = cfg.order ? filtered.orderBy(cfg.order(cfg.table)) : filtered;
  const rows = await ordered.limit(limit);
  return cfg.redact ? rows.map(cfg.redact) : rows;
}

export async function createResource(
  slug: string,
  session: SessionUser,
  body: unknown,
) {
  const cfg = getConfig(slug);
  let values: any = cfg.create.parse(body);
  if (cfg.schoolScoped) values.schoolId = session.schoolId;
  if (cfg.transform) values = await cfg.transform(values, "create");
  if (cfg.validate) await cfg.validate(values, "create", {});

  let row: any;
  try {
    [row] = await db.insert(cfg.table).values(values).returning();
  } catch (e) {
    mapDbError(e);
  }
  const out = cfg.redact ? cfg.redact(row) : row;
  await writeAudit({
    userId: session.id,
    action: "create",
    entity: cfg.entity,
    entityId: row.id,
    diff: out,
  });
  return out;
}

export async function updateResource(
  slug: string,
  session: SessionUser,
  id: string,
  body: unknown,
) {
  const cfg = getConfig(slug);
  const [existing] = await db
    .select()
    .from(cfg.table)
    .where(eq(cfg.table.id, id));
  if (!existing) throw new ApiError(404, "Data tidak ditemukan.");
  if (cfg.schoolScoped && existing.schoolId !== session.schoolId) {
    throw new ApiError(403, "Data ini bukan milik sekolah Anda.");
  }

  let values: any = cfg.update.parse(body);
  if (cfg.transform) values = await cfg.transform(values, "update");
  if (cfg.validate) {
    await cfg.validate({ ...existing, ...values }, "update", { excludeId: id });
  }
  values.updatedAt = new Date();

  let row: any;
  try {
    [row] = await db
      .update(cfg.table)
      .set(values)
      .where(eq(cfg.table.id, id))
      .returning();
  } catch (e) {
    mapDbError(e);
  }
  const out = cfg.redact ? cfg.redact(row) : row;
  await writeAudit({
    userId: session.id,
    action: "update",
    entity: cfg.entity,
    entityId: id,
    diff: out,
  });
  return out;
}

export async function getResource(
  slug: string,
  session: SessionUser,
  id: string,
) {
  const cfg = getConfig(slug);
  const [row] = await db.select().from(cfg.table).where(eq(cfg.table.id, id));
  if (!row) throw new ApiError(404, "Data tidak ditemukan.");
  if (cfg.schoolScoped && row.schoolId !== session.schoolId) {
    throw new ApiError(403, "Data ini bukan milik sekolah Anda.");
  }
  return cfg.redact ? cfg.redact(row) : row;
}

export async function removeResource(
  slug: string,
  session: SessionUser,
  id: string,
) {
  const cfg = getConfig(slug);
  const [existing] = await db
    .select()
    .from(cfg.table)
    .where(eq(cfg.table.id, id));
  if (!existing) throw new ApiError(404, "Data tidak ditemukan.");
  if (cfg.schoolScoped && existing.schoolId !== session.schoolId) {
    throw new ApiError(403, "Data ini bukan milik sekolah Anda.");
  }
  try {
    await db.delete(cfg.table).where(eq(cfg.table.id, id));
  } catch (e) {
    mapDbError(e);
  }
  await writeAudit({
    userId: session.id,
    action: "delete",
    entity: cfg.entity,
    entityId: id,
    diff: cfg.redact ? cfg.redact(existing) : existing,
  });
  return { ok: true };
}

import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  date,
  time,
  jsonb,
  unique,
  index,
} from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ */
/* Enums                                                               */
/* ------------------------------------------------------------------ */

export const roleEnum = pgEnum("role", [
  "ADMIN",
  "GURU",
  "WALI_KELAS",
  "SEKRETARIS",
  "KEPSEK",
]);

export const teacherAttendanceEnum = pgEnum("teacher_attendance", [
  "HADIR",
  "TERLAMBAT",
  "TIDAK_HADIR",
  "DIGANTI",
  "TUGAS_MANDIRI",
]);

/** Slot type in the daily period template. */
export const periodTypeEnum = pgEnum("period_type", [
  "KBM",
  "ISTIRAHAT",
  "UPACARA",
  "IBADAH",
  "EKSKUL",
  "LAINNYA",
]);

/** Activity type of a journal entry (no ISTIRAHAT — you don't journal a break). */
export const activityTypeEnum = pgEnum("activity_type", [
  "KBM",
  "UPACARA",
  "IBADAH",
  "EKSKUL",
  "LAINNYA",
]);

export const entryStatusEnum = pgEnum("entry_status", ["TERCATAT", "TERKUNCI"]);

export const absenceTypeEnum = pgEnum("absence_type", ["S", "I", "A"]);

export const genderEnum = pgEnum("gender", ["L", "P"]);

/* ------------------------------------------------------------------ */
/* Shared column helpers                                               */
/* ------------------------------------------------------------------ */

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
};

const pk = () => uuid("id").primaryKey().defaultRandom();

export type SchoolSettings = {
  input_mode: "A" | "B" | "AB";
  auto_lock_day: number; // day-of-month; 0 disables auto-lock
  timezone: string; // IANA, e.g. "Asia/Makassar"
};

/* ------------------------------------------------------------------ */
/* Master data                                                         */
/* ------------------------------------------------------------------ */

export const schools = pgTable("schools", {
  id: pk(),
  name: text("name").notNull(),
  npsn: text("npsn"),
  address: text("address"),
  logoUrl: text("logo_url"),
  settingsJson: jsonb("settings_json").$type<SchoolSettings>().notNull(),
  ...timestamps,
});

export const academicYears = pgTable("academic_years", {
  id: pk(),
  schoolId: uuid("school_id")
    .notNull()
    .references(() => schools.id),
  name: text("name").notNull(), // "2026/2027"
  semester: integer("semester").notNull(), // 1 | 2
  startDate: date("start_date"),
  endDate: date("end_date"),
  isActive: boolean("is_active").notNull().default(false),
  ...timestamps,
});

export const teachers = pgTable("teachers", {
  id: pk(),
  schoolId: uuid("school_id")
    .notNull()
    .references(() => schools.id),
  nip: text("nip"),
  name: text("name").notNull(),
  phone: text("phone"),
  ...timestamps,
});

export const students = pgTable("students", {
  id: pk(),
  schoolId: uuid("school_id")
    .notNull()
    .references(() => schools.id),
  nisn: text("nisn"),
  name: text("name").notNull(),
  gender: genderEnum("gender"),
  ...timestamps,
});

export const classes = pgTable("classes", {
  id: pk(),
  schoolId: uuid("school_id")
    .notNull()
    .references(() => schools.id),
  academicYearId: uuid("academic_year_id")
    .notNull()
    .references(() => academicYears.id),
  name: text("name").notNull(), // "VII-A"
  gradeLevel: integer("grade_level").notNull(), // 7..12
  homeroomTeacherId: uuid("homeroom_teacher_id").references(() => teachers.id),
  ...timestamps,
});

export const users = pgTable("users", {
  id: pk(),
  schoolId: uuid("school_id")
    .notNull()
    .references(() => schools.id),
  name: text("name").notNull(),
  username: text("username").notNull().unique(),
  email: text("email"),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull(),
  teacherId: uuid("teacher_id").references(() => teachers.id),
  studentId: uuid("student_id").references(() => students.id),
  isActive: boolean("is_active").notNull().default(true),
  ...timestamps,
});

export const classMembers = pgTable(
  "class_members",
  {
    id: pk(),
    classId: uuid("class_id")
      .notNull()
      .references(() => classes.id),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id),
    isSecretary: boolean("is_secretary").notNull().default(false),
    ...timestamps,
  },
  (t) => [
    unique("class_members_class_student_uq").on(t.classId, t.studentId),
    index("class_members_student_idx").on(t.studentId),
  ],
);

export const subjects = pgTable("subjects", {
  id: pk(),
  schoolId: uuid("school_id")
    .notNull()
    .references(() => schools.id),
  code: text("code"),
  name: text("name").notNull(), // "Matematika"
  ...timestamps,
});

export const teachingAssignments = pgTable(
  "teaching_assignments",
  {
    id: pk(),
    academicYearId: uuid("academic_year_id")
      .notNull()
      .references(() => academicYears.id),
    teacherId: uuid("teacher_id")
      .notNull()
      .references(() => teachers.id),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id),
    classId: uuid("class_id")
      .notNull()
      .references(() => classes.id),
    ...timestamps,
  },
  (t) => [
    unique("teaching_assignments_uq").on(
      t.academicYearId,
      t.teacherId,
      t.subjectId,
      t.classId,
    ),
  ],
);

export const periodTemplates = pgTable(
  "period_templates",
  {
    id: pk(),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id),
    dayOfWeek: integer("day_of_week").notNull(), // 1=Senin .. 6=Sabtu
    periodNo: integer("period_no").notNull(), // 0..12 (0 = Upacara Senin)
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    type: periodTypeEnum("type").notNull().default("KBM"),
    ...timestamps,
  },
  (t) => [
    unique("period_templates_day_period_uq").on(
      t.schoolId,
      t.dayOfWeek,
      t.periodNo,
    ),
  ],
);

export const schedules = pgTable(
  "schedules",
  {
    id: pk(),
    academicYearId: uuid("academic_year_id")
      .notNull()
      .references(() => academicYears.id),
    classId: uuid("class_id")
      .notNull()
      .references(() => classes.id),
    dayOfWeek: integer("day_of_week").notNull(),
    periodNoStart: integer("period_no_start").notNull(),
    periodNoEnd: integer("period_no_end").notNull(), // supports 2-3 JP blocks
    teachingAssignmentId: uuid("teaching_assignment_id")
      .notNull()
      .references(() => teachingAssignments.id),
    ...timestamps,
  },
  (t) => [
    index("schedules_class_day_idx").on(t.classId, t.dayOfWeek),
    index("schedules_assignment_idx").on(t.teachingAssignmentId),
  ],
);

export const holidays = pgTable(
  "holidays",
  {
    id: pk(),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id),
    date: date("date").notNull(),
    description: text("description").notNull(),
    ...timestamps,
  },
  (t) => [index("holidays_school_date_idx").on(t.schoolId, t.date)],
);

/* ------------------------------------------------------------------ */
/* Journal (defined now; exercised in a later phase)                   */
/* ------------------------------------------------------------------ */

export const journalEntries = pgTable(
  "journal_entries",
  {
    id: pk(),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id),
    academicYearId: uuid("academic_year_id")
      .notNull()
      .references(() => academicYears.id),
    classId: uuid("class_id")
      .notNull()
      .references(() => classes.id),
    date: date("date").notNull(),
    scheduleId: uuid("schedule_id").references(() => schedules.id), // null = insidental
    teachingAssignmentId: uuid("teaching_assignment_id").references(
      () => teachingAssignments.id,
    ),
    periodNoStart: integer("period_no_start").notNull(),
    periodNoEnd: integer("period_no_end").notNull(),
    jpCount: integer("jp_count").notNull().default(0),
    teacherAttendance: teacherAttendanceEnum("teacher_attendance"),
    substituteTeacherId: uuid("substitute_teacher_id").references(
      () => teachers.id,
    ),
    topic: text("topic"),
    achievement: text("achievement"),
    notes: text("notes"),
    // Jumlah siswa absen (input manual; rinciannya dimiliki aplikasi absensi terpisah).
    absentCount: integer("absent_count"),
    activityType: activityTypeEnum("activity_type").notNull().default("KBM"),
    status: entryStatusEnum("status").notNull().default("TERCATAT"),
    filledByUserId: uuid("filled_by_user_id")
      .notNull()
      .references(() => users.id),
    filledAt: timestamp("filled_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    lastEditedByUserId: uuid("last_edited_by_user_id").references(
      () => users.id,
    ),
    correctedByTeacher: boolean("corrected_by_teacher").notNull().default(false),
    ...timestamps,
  },
  (t) => [
    unique("journal_entries_slot_uq").on(t.classId, t.date, t.periodNoStart),
    index("journal_entries_class_date_idx").on(t.classId, t.date),
    index("journal_entries_assignment_idx").on(t.teachingAssignmentId),
    index("journal_entries_school_date_idx").on(t.schoolId, t.date),
    index("journal_entries_substitute_idx").on(t.substituteTeacherId),
  ],
);

export const journalEntryAbsences = pgTable("journal_entry_absences", {
  id: pk(),
  journalEntryId: uuid("journal_entry_id")
    .notNull()
    .references(() => journalEntries.id, { onDelete: "cascade" }),
  studentId: uuid("student_id")
    .notNull()
    .references(() => students.id),
  absenceType: absenceTypeEnum("absence_type").notNull(),
  ...timestamps,
});

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: pk(),
    userId: uuid("user_id").references(() => users.id),
    action: text("action").notNull(), // create | update | delete | lock | unlock
    entity: text("entity").notNull(),
    entityId: uuid("entity_id"),
    diffJson: jsonb("diff_json"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("audit_logs_entity_idx").on(t.entity, t.entityId)],
);

/* ------------------------------------------------------------------ */
/* Inferred types                                                      */
/* ------------------------------------------------------------------ */

export type School = typeof schools.$inferSelect;
export type AcademicYear = typeof academicYears.$inferSelect;
export type Teacher = typeof teachers.$inferSelect;
export type Student = typeof students.$inferSelect;
export type Class = typeof classes.$inferSelect;
export type User = typeof users.$inferSelect;
export type ClassMember = typeof classMembers.$inferSelect;
export type Subject = typeof subjects.$inferSelect;
export type TeachingAssignment = typeof teachingAssignments.$inferSelect;
export type PeriodTemplate = typeof periodTemplates.$inferSelect;
export type Schedule = typeof schedules.$inferSelect;
export type Holiday = typeof holidays.$inferSelect;
export type JournalEntry = typeof journalEntries.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;

export type Role = (typeof roleEnum.enumValues)[number];

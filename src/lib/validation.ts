import { z } from "zod";

const zId = z.string().regex(/^[0-9a-fA-F-]{36}$/, "ID tidak valid");
const zDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal harus format YYYY-MM-DD");
const zTime = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, "Waktu harus format HH:MM");

const nonEmpty = (label: string) => z.string().trim().min(1, `${label} wajib diisi`);

export const academicYearCreate = z.object({
  name: nonEmpty("Nama tahun ajaran"),
  semester: z.coerce.number().int().min(1).max(2),
  startDate: zDate.nullish(),
  endDate: zDate.nullish(),
  isActive: z.boolean().optional(),
});

export const classCreate = z.object({
  name: nonEmpty("Nama kelas"),
  gradeLevel: z.coerce.number().int().min(1).max(12),
  academicYearId: zId,
  homeroomTeacherId: zId.nullish(),
});

export const subjectCreate = z.object({
  code: z.string().trim().max(20).nullish(),
  name: nonEmpty("Nama mapel"),
});

export const teacherCreate = z.object({
  name: nonEmpty("Nama guru"),
  nip: z.string().trim().max(30).nullish(),
  phone: z.string().trim().max(30).nullish(),
});

export const studentCreate = z.object({
  name: nonEmpty("Nama siswa"),
  nisn: z.string().trim().max(20).nullish(),
  gender: z.enum(["L", "P"]).nullish(),
});

export const assignmentCreate = z.object({
  academicYearId: zId,
  teacherId: zId,
  subjectId: zId,
  classId: zId,
});

export const periodTemplateCreate = z.object({
  dayOfWeek: z.coerce.number().int().min(1).max(6),
  periodNo: z.coerce.number().int().min(0).max(99),
  startTime: zTime,
  endTime: zTime,
  type: z.enum(["KBM", "ISTIRAHAT", "UPACARA", "IBADAH", "EKSKUL", "LAINNYA"]),
});

export const scheduleCreate = z
  .object({
    academicYearId: zId,
    classId: zId,
    dayOfWeek: z.coerce.number().int().min(1).max(6),
    periodNoStart: z.coerce.number().int().min(0).max(99),
    periodNoEnd: z.coerce.number().int().min(0).max(99),
    teachingAssignmentId: zId,
  })
  .refine((v) => v.periodNoEnd >= v.periodNoStart, {
    message: "Jam akhir tidak boleh sebelum jam mulai",
    path: ["periodNoEnd"],
  });

export const holidayCreate = z.object({
  date: zDate,
  description: nonEmpty("Keterangan"),
});

export const userCreate = z.object({
  name: nonEmpty("Nama"),
  username: nonEmpty("Username")
    .toLowerCase()
    .regex(/^[a-z0-9._-]+$/, "Username hanya huruf kecil, angka, . _ -"),
  email: z.string().email("Email tidak valid").nullish().or(z.literal("")),
  role: z.enum(["ADMIN", "GURU", "WALI_KELAS", "SEKRETARIS", "KEPSEK"]),
  password: z.string().min(6, "Password minimal 6 karakter").optional(),
  teacherId: zId.nullish(),
  studentId: zId.nullish(),
  isActive: z.boolean().optional(),
});

/** Self-service password change (any logged-in user). */
export const changePasswordInput = z.object({
  currentPassword: z.string().min(1, "Password saat ini wajib diisi."),
  newPassword: z.string().min(6, "Password baru minimal 6 karakter."),
});

/** Admin-initiated password reset for a user. */
export const resetPasswordInput = z.object({
  userId: zId,
  newPassword: z.string().min(6, "Password baru minimal 6 karakter."),
});

const attendanceEnum = z.enum([
  "HADIR",
  "TERLAMBAT",
  "TIDAK_HADIR",
  "DIGANTI",
  "TUGAS_MANDIRI",
]);
const activityEnum = z.enum(["KBM", "UPACARA", "IBADAH", "EKSKUL", "LAINNYA"]);

export const journalCreate = z.object({
  date: zDate,
  scheduleId: zId.nullish(),
  // For insidental / non-KBM entries without a schedule:
  classId: zId.nullish(),
  teachingAssignmentId: zId.nullish(),
  periodNoStart: z.coerce.number().int().min(0).max(99).nullish(),
  periodNoEnd: z.coerce.number().int().min(0).max(99).nullish(),
  teacherAttendance: attendanceEnum.nullish(),
  substituteTeacherId: zId.nullish(),
  topic: z.string().trim().max(2000).nullish(),
  achievement: z.string().trim().max(2000).nullish(),
  notes: z.string().trim().max(2000).nullish(),
  absentCount: z.coerce.number().int().min(0).max(999).nullish(),
  activityType: activityEnum.optional(),
});

export const journalUpdate = z.object({
  teacherAttendance: attendanceEnum.optional(),
  substituteTeacherId: zId.nullish(),
  topic: z.string().trim().max(2000).nullish(),
  achievement: z.string().trim().max(2000).nullish(),
  notes: z.string().trim().max(2000).nullish(),
  absentCount: z.coerce.number().int().min(0).max(999).nullish(),
  activityType: activityEnum.optional(),
});

/** CSV import row for teachers. */
export const teacherImportRow = z.object({
  name: nonEmpty("Nama"),
  nip: z.string().trim().max(30).optional().default(""),
  phone: z.string().trim().max(30).optional().default(""),
});

/** CSV import row for subjects. */
export const subjectImportRow = z.object({
  code: z.string().trim().max(20).optional().default(""),
  name: nonEmpty("Nama"),
});

/** CSV import row for students. */
export const studentImportRow = z.object({
  name: nonEmpty("Nama"),
  nisn: z.string().trim().max(20).optional().default(""),
  gender: z
    .string()
    .trim()
    .toUpperCase()
    .transform((g) => (g === "L" || g === "LAKI-LAKI" ? "L" : g === "P" || g === "PEREMPUAN" ? "P" : ""))
    .pipe(z.enum(["L", "P"]).or(z.literal("")))
    .optional(),
});

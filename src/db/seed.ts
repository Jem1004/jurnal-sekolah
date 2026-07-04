/*
  Demo seed for JurnalKu (Fase 0).
  Run with: pnpm db:seed
  Idempotent: truncates all tables, then inserts a coherent single-school demo.
*/
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "./index";
import {
  schools,
  academicYears,
  teachers,
  students,
  classes,
  users,
  classMembers,
  subjects,
  teachingAssignments,
  periodTemplates,
  schedules,
  holidays,
  journalEntries,
  type SchoolSettings,
} from "./schema";

type PeriodType =
  | "KBM"
  | "ISTIRAHAT"
  | "UPACARA"
  | "IBADAH"
  | "EKSKUL"
  | "LAINNYA";

type Slot = {
  periodNo: number;
  start: string;
  end: string;
  type: PeriodType;
};

// Daily period templates. Break/ibadah rows use out-of-band period numbers
// (51/52/61) so they never collide with KBM "jam ke-" 0..8.
const DAY_SLOTS: Record<number, Slot[]> = {
  1: [
    { periodNo: 0, start: "07:00", end: "07:30", type: "UPACARA" },
    { periodNo: 1, start: "07:30", end: "08:10", type: "KBM" },
    { periodNo: 2, start: "08:10", end: "08:50", type: "KBM" },
    { periodNo: 3, start: "08:50", end: "09:30", type: "KBM" },
    { periodNo: 51, start: "09:30", end: "10:00", type: "ISTIRAHAT" },
    { periodNo: 4, start: "10:00", end: "10:40", type: "KBM" },
    { periodNo: 5, start: "10:40", end: "11:20", type: "KBM" },
    { periodNo: 6, start: "11:20", end: "12:00", type: "KBM" },
    { periodNo: 52, start: "12:00", end: "13:00", type: "ISTIRAHAT" },
    { periodNo: 7, start: "13:00", end: "13:40", type: "KBM" },
    { periodNo: 8, start: "13:40", end: "14:20", type: "KBM" },
  ],
  2: weekdaySlots(),
  3: weekdaySlots(),
  4: weekdaySlots(),
  5: [
    { periodNo: 1, start: "07:00", end: "07:40", type: "KBM" },
    { periodNo: 2, start: "07:40", end: "08:20", type: "KBM" },
    { periodNo: 3, start: "08:20", end: "09:00", type: "KBM" },
    { periodNo: 51, start: "09:00", end: "09:20", type: "ISTIRAHAT" },
    { periodNo: 4, start: "09:20", end: "10:00", type: "KBM" },
    { periodNo: 5, start: "10:00", end: "10:40", type: "KBM" },
    { periodNo: 6, start: "10:40", end: "11:20", type: "KBM" },
    { periodNo: 61, start: "11:20", end: "13:00", type: "IBADAH" }, // Sholat Jumat
  ],
};

function weekdaySlots(): Slot[] {
  return [
    { periodNo: 1, start: "07:00", end: "07:40", type: "KBM" },
    { periodNo: 2, start: "07:40", end: "08:20", type: "KBM" },
    { periodNo: 3, start: "08:20", end: "09:00", type: "KBM" },
    { periodNo: 51, start: "09:00", end: "09:30", type: "ISTIRAHAT" },
    { periodNo: 4, start: "09:30", end: "10:10", type: "KBM" },
    { periodNo: 5, start: "10:10", end: "10:50", type: "KBM" },
    { periodNo: 6, start: "10:50", end: "11:30", type: "KBM" },
    { periodNo: 52, start: "11:30", end: "12:30", type: "ISTIRAHAT" },
    { periodNo: 7, start: "12:30", end: "13:10", type: "KBM" },
    { periodNo: 8, start: "13:10", end: "13:50", type: "KBM" },
  ];
}

const SUBJECTS = [
  { code: "MTK", name: "Matematika" },
  { code: "BIN", name: "Bahasa Indonesia" },
  { code: "IPA", name: "Ilmu Pengetahuan Alam" },
  { code: "IPS", name: "Ilmu Pengetahuan Sosial" },
  { code: "BIG", name: "Bahasa Inggris" },
  { code: "PAI", name: "Pendidikan Agama Islam" },
];

const TEACHER_NAMES = [
  { name: "Budi Santoso, S.Pd", nip: "198501012010011001" },
  { name: "Siti Aminah, S.Pd", nip: "198703152011012002" },
  { name: "Agus Wibowo, M.Pd", nip: "198011202005011003" },
  { name: "Dewi Lestari, S.Pd", nip: "199002102014032004" },
  { name: "Rahmat Hidayat, S.Pd", nip: "198809092012011005" },
];

const CLASS_DEFS = [
  { name: "VII-A", gradeLevel: 7 },
  { name: "VIII-A", gradeLevel: 8 },
  { name: "IX-A", gradeLevel: 9 },
  { name: "X-A", gradeLevel: 10 },
];

const FIRST_NAMES = [
  "Ahmad", "Aisyah", "Bagas", "Citra", "Dimas", "Elok", "Fajar", "Gita",
  "Hadi", "Indah", "Joko", "Kirana", "Lukman", "Maya", "Nanda", "Oki",
  "Putri", "Qori", "Rizki", "Salsa", "Taufik", "Umi", "Vino", "Wulan",
  "Yusuf", "Zahra",
];
const LAST_NAMES = [
  "Pratama", "Wijaya", "Nugraha", "Anggraini", "Saputra", "Maulana",
  "Kusuma", "Ramadhan", "Setiawan", "Handayani",
];

async function main() {
  console.log("Truncating tables…");
  await db.execute(sql`
    TRUNCATE TABLE
      audit_logs, journal_entry_absences, journal_entries, schedules,
      teaching_assignments, class_members, holidays, period_templates,
      classes, users, students, teachers, subjects, academic_years, schools
    RESTART IDENTITY CASCADE
  `);

  const settings: SchoolSettings = {
    input_mode: "AB", // sekretaris & guru dua-duanya bisa mengisi (demo)
    auto_lock_day: 5,
    timezone: "Asia/Makassar",
  };

  console.log("Inserting school & academic year…");
  const [school] = await db
    .insert(schools)
    .values({
      name: "SMP Negeri 1 Contoh",
      npsn: "20200001",
      address: "Jl. Pendidikan No. 1, Kota Contoh",
      settingsJson: settings,
    })
    .returning();

  const [ay] = await db
    .insert(academicYears)
    .values({
      schoolId: school.id,
      name: "2026/2027",
      semester: 1,
      startDate: "2026-07-13",
      endDate: "2026-12-18",
      isActive: true,
    })
    .returning();

  console.log("Inserting teachers & subjects…");
  const teacherRows = await db
    .insert(teachers)
    .values(
      TEACHER_NAMES.map((t) => ({
        schoolId: school.id,
        name: t.name,
        nip: t.nip,
        phone: null,
      })),
    )
    .returning();

  const subjectRows = await db
    .insert(subjects)
    .values(SUBJECTS.map((s) => ({ schoolId: school.id, ...s })))
    .returning();

  console.log("Inserting classes…");
  const classRows = await db
    .insert(classes)
    .values(
      CLASS_DEFS.map((c, i) => ({
        schoolId: school.id,
        academicYearId: ay.id,
        name: c.name,
        gradeLevel: c.gradeLevel,
        homeroomTeacherId: teacherRows[i].id,
      })),
    )
    .returning();

  console.log("Inserting period templates…");
  const templateValues = Object.entries(DAY_SLOTS).flatMap(([day, slots]) =>
    slots.map((s) => ({
      schoolId: school.id,
      dayOfWeek: Number(day),
      periodNo: s.periodNo,
      startTime: s.start,
      endTime: s.end,
      type: s.type,
    })),
  );
  await db.insert(periodTemplates).values(templateValues);

  console.log("Inserting teaching assignments…");
  // Each class gets one assignment per subject; teachers shared round-robin.
  const assignmentValues = classRows.flatMap((cls, ci) =>
    subjectRows.map((subj, si) => ({
      academicYearId: ay.id,
      classId: cls.id,
      subjectId: subj.id,
      teacherId: teacherRows[(ci * SUBJECTS.length + si) % teacherRows.length].id,
    })),
  );
  const assignmentRows = await db
    .insert(teachingAssignments)
    .values(assignmentValues)
    .returning();

  const assignmentsByClass = new Map<string, typeof assignmentRows>();
  for (const a of assignmentRows) {
    const list = assignmentsByClass.get(a.classId) ?? [];
    list.push(a);
    assignmentsByClass.set(a.classId, list);
  }

  console.log("Building clash-free weekly schedule…");
  const usedTeacherSlot = new Set<string>();
  const useCount = new Map<string, number>();
  const scheduleValues: (typeof schedules.$inferInsert)[] = [];

  for (let day = 1; day <= 5; day++) {
    const kbmPeriods = DAY_SLOTS[day]
      .filter((s) => s.type === "KBM")
      .map((s) => s.periodNo);
    for (const period of kbmPeriods) {
      for (const cls of classRows) {
        const asgs = assignmentsByClass.get(cls.id) ?? [];
        const candidate = asgs
          .filter(
            (a) => !usedTeacherSlot.has(`${day}-${period}-${a.teacherId}`),
          )
          .sort(
            (a, b) => (useCount.get(a.id) ?? 0) - (useCount.get(b.id) ?? 0),
          )[0];
        if (!candidate) continue; // no free teacher — leave slot empty
        usedTeacherSlot.add(`${day}-${period}-${candidate.teacherId}`);
        useCount.set(candidate.id, (useCount.get(candidate.id) ?? 0) + 1);
        scheduleValues.push({
          academicYearId: ay.id,
          classId: cls.id,
          dayOfWeek: day,
          periodNoStart: period,
          periodNoEnd: period,
          teachingAssignmentId: candidate.id,
        });
      }
    }
  }
  await db.insert(schedules).values(scheduleValues);

  console.log("Inserting students & class members…");
  const secretaryStudentByClass = new Map<string, string>();
  let nameIdx = 0;
  for (const cls of classRows) {
    const studentValues = Array.from({ length: 15 }, (_, i) => {
      const first = FIRST_NAMES[nameIdx % FIRST_NAMES.length];
      const last = LAST_NAMES[(nameIdx * 7 + i) % LAST_NAMES.length];
      nameIdx++;
      return {
        schoolId: school.id,
        name: `${first} ${last}`,
        nisn: `00${cls.gradeLevel}${String(i + 1).padStart(3, "0")}`,
        gender: (i % 2 === 0 ? "L" : "P") as "L" | "P",
      };
    });
    const studentRows = await db
      .insert(students)
      .values(studentValues)
      .returning();

    await db.insert(classMembers).values(
      studentRows.map((s, i) => ({
        classId: cls.id,
        studentId: s.id,
        isSecretary: i === 0, // first student is class secretary
      })),
    );
    secretaryStudentByClass.set(cls.id, studentRows[0].id);
  }

  console.log("Inserting holidays…");
  await db.insert(holidays).values([
    { schoolId: school.id, date: "2026-08-17", description: "HUT Kemerdekaan RI" },
    { schoolId: school.id, date: "2026-12-25", description: "Hari Natal" },
  ]);

  console.log("Inserting users…");
  const hash = (pw: string) => bcrypt.hashSync(pw, 10);
  const userValues: (typeof users.$inferInsert)[] = [
    {
      schoolId: school.id,
      name: "Administrator",
      username: "admin",
      passwordHash: hash("admin123"),
      role: "ADMIN",
    },
    {
      schoolId: school.id,
      name: "Kepala Sekolah",
      username: "kepsek",
      passwordHash: hash("kepsek123"),
      role: "KEPSEK",
    },
    // Wali kelas VII-A = homeroom teacher of first class
    {
      schoolId: school.id,
      name: teacherRows[0].name,
      username: "wali1",
      passwordHash: hash("wali123"),
      role: "WALI_KELAS",
      teacherId: teacherRows[0].id,
    },
  ];
  // Guru accounts (linked to teachers)
  teacherRows.forEach((t, i) => {
    userValues.push({
      schoolId: school.id,
      name: t.name,
      username: `guru${i + 1}`,
      passwordHash: hash("guru123"),
      role: "GURU",
      teacherId: t.id,
    });
  });
  // Sekretaris accounts (linked to secretary students, one per class)
  classRows.forEach((cls, i) => {
    userValues.push({
      schoolId: school.id,
      name: `Sekretaris ${cls.name}`,
      username: `sekre${i + 1}`,
      passwordHash: hash("sekre123"),
      role: "SEKRETARIS",
      studentId: secretaryStudentByClass.get(cls.id)!,
    });
  });
  const userRows = await db.insert(users).values(userValues).returning();
  const adminId = userRows.find((u) => u.role === "ADMIN")?.id;

  console.log("Inserting journal entries for Class X-A...");
  const classX = classRows.find((c) => c.name === "X-A");
  let journalCount = 0;
  if (classX && adminId) {
    const classXSchedules = scheduleValues.filter((s) => s.classId === classX.id);
    const journalValues: (typeof journalEntries.$inferInsert)[] = [];
    
    // Seed journal entries for Monday (2026-07-13) to Friday (2026-07-17)
    const dates = [
      { date: "2026-07-13", day: 1 },
      { date: "2026-07-14", day: 2 },
      { date: "2026-07-15", day: 3 },
      { date: "2026-07-16", day: 4 },
      { date: "2026-07-17", day: 5 },
    ];
    
    const sampleTopics: Record<string, string[]> = {
      "Matematika": [
        "Persamaan Linear Dua Variabel",
        "Penyelesaian SPLDV Metode Eliminasi",
        "Latihan Soal Cerita SPLDV",
        "Ulangan Harian SPLDV",
        "Pembahasan Soal Ujian"
      ],
      "Bahasa Indonesia": [
        "Membaca Kritis Teks Eksposisi",
        "Menganalisis Struktur Teks Eksposisi",
        "Menulis Paragraf Eksposisi",
        "Presentasi Teks Eksposisi",
        "Evaluasi Akhir Bab"
      ],
      "Ilmu Pengetahuan Alam": [
        "Klasifikasi Makhluk Hidup",
        "Mengenal Kingdom Animalia & Plantae",
        "Praktikum Mikroskop Sel Daun",
        "Ekosistem dan Interaksi Lingkungan",
        "Rantai Makanan dan Jaring Makanan"
      ],
      "Ilmu Pengetahuan Sosial": [
        "Sejarah Masa Praaksara",
        "Peninggalan Budaya Hindu-Buddha",
        "Perkembangan Kerajaan Islam",
        "Diskusi Kelompok Jalur Rempah",
        "Kuis Interaktif Sejarah"
      ],
      "Bahasa Inggris": [
        "Introduction and Greetings",
        "Expressing Intentions & Hopes",
        "Reading Descriptive Texts",
        "Writing a Simple Paragraph",
        "Vocabulary Match Games"
      ],
      "Pendidikan Agama Islam": [
        "Kajian Tafsir Surah Al-Hujurat",
        "Perilaku Jujur dan Amanah",
        "Kisah Keteladanan Khulafaur Rasyidin",
        "Tata Cara Shalat Jamak & Qashar",
        "Diskusi Akhlak Terpuji"
      ],
    };

    const sampleAchievements = [
      "Tuntas 100% dengan pemahaman baik",
      "Selesai 90%, 2 siswa butuh bimbingan",
      "Berjalan lancar, diskusi sangat aktif",
      "Tuntas materi, dilanjutkan tugas mandiri",
      "Selesai sesuai target pembelajaran"
    ];

    for (const d of dates) {
      const dayScheds = classXSchedules.filter((s) => s.dayOfWeek === d.day);
      for (const s of dayScheds) {
        const asg = assignmentRows.find((a) => a.id === s.teachingAssignmentId);
        const subj = asg ? subjectRows.find((sub) => sub.id === asg.subjectId) : null;
        const subjectName = subj ? subj.name : "Materi Umum";
        
        const topics = sampleTopics[subjectName] || ["Pembahasan Bab Baru", "Latihan Mandiri"];
        const randomTopic = topics[Math.floor(Math.random() * topics.length)];
        const randomAch = sampleAchievements[Math.floor(Math.random() * sampleAchievements.length)];
        const randomAbsent = Math.floor(Math.random() * 3);

        journalValues.push({
          schoolId: school.id,
          academicYearId: ay.id,
          classId: classX.id,
          date: d.date,
          scheduleId: null,
          teachingAssignmentId: s.teachingAssignmentId,
          periodNoStart: s.periodNoStart,
          periodNoEnd: s.periodNoEnd,
          jpCount: 2,
          teacherAttendance: "HADIR",
          substituteTeacherId: null,
          topic: randomTopic,
          achievement: randomAch,
          notes: "Pembelajaran kondusif dan interaktif.",
          absentCount: randomAbsent,
          activityType: "KBM",
          status: "TERCATAT",
          filledByUserId: adminId,
        });
      }
    }

    if (journalValues.length > 0) {
      await db.insert(journalEntries).values(journalValues);
      journalCount = journalValues.length;
    }
  }

  console.log("\n✅ Seed complete.");
  console.log(`   School:      ${school.name}`);
  console.log(`   Classes:     ${classRows.length}`);
  console.log(`   Teachers:    ${teacherRows.length}`);
  console.log(`   Assignments: ${assignmentRows.length}`);
  console.log(`   Schedule:    ${scheduleValues.length} slots`);
  console.log(`   Journals:    ${journalCount} entries (Class X-A)`);
  console.log("\n   Demo logins (all schools = SMP Negeri 1 Contoh):");
  console.log("     admin  / admin123   (ADMIN)");
  console.log("     kepsek / kepsek123  (KEPSEK)");
  console.log("     wali1  / wali123    (WALI_KELAS, VII-A)");
  console.log("     guru1..guru5 / guru123   (GURU)");
  console.log("     sekre1..sekre4 / sekre123 (SEKRETARIS: VII-A, VIII-A, IX-A, X-A)");
}

/** Retry the whole seed on transient network timeouts (Neon over flaky link). */
async function withRetry(fn: () => Promise<void>, tries = 10) {
  for (let attempt = 1; attempt <= tries; attempt++) {
    try {
      await fn();
      return;
    } catch (err) {
      const blob = JSON.stringify(
        err,
        Object.getOwnPropertyNames(err as object),
      );
      const transient = /ETIMEDOUT|CONNECT_TIMEOUT|ECONNRESET|ENETUNREACH|EAI_AGAIN/.test(
        blob,
      );
      if (transient && attempt < tries) {
        console.warn(
          `Attempt ${attempt} failed (network timeout). Retrying in 4s…`,
        );
        await new Promise((r) => setTimeout(r, 4000));
        continue;
      }
      throw err;
    }
  }
}

withRetry(main)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });

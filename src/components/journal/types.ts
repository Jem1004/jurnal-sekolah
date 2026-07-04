export type SlotEntry = {
  id: string;
  status: "TERCATAT" | "TERKUNCI";
  teacherAttendance: string | null;
  topic: string | null;
  achievement: string | null;
  correctedByTeacher: boolean;
};

export type Slot = {
  scheduleId: string;
  classId: string;
  className: string;
  assignmentId: string;
  periodNoStart: number;
  periodNoEnd: number;
  startTime: string | null;
  endTime: string | null;
  subject: string;
  teacherId: string;
  teacher: string;
  entry: SlotEntry | null;
};

export type DayResponse = {
  date: string;
  dayOfWeek: number;
  holiday: string | null;
  mode: "A" | "B" | "AB";
  slots: Slot[];
  class?: { id: string; name: string };
  teachers?: { id: string; name: string }[];
};

export type Person = { id: string; name: string };

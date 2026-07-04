import type { Role } from "@/db/schema";

/** Landing route per role after login / from "/". */
export const HOME_BY_ROLE: Record<Role, string> = {
  ADMIN: "/admin",
  GURU: "/guru",
  WALI_KELAS: "/wali-kelas",
  SEKRETARIS: "/sekretaris",
  KEPSEK: "/kepsek",
};

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Admin Sekolah",
  GURU: "Guru",
  WALI_KELAS: "Wali Kelas",
  SEKRETARIS: "Sekretaris Kelas",
  KEPSEK: "Kepala Sekolah",
};

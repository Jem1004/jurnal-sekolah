import { asc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { periodTemplates } from "@/db/schema";
import { DAY_LABELS, PERIOD_TYPE_LABELS } from "@/lib/labels";
import { PageHeader } from "@/components/admin/page-header";
import { GenerateSlots } from "@/components/admin/generate-slots";
import {
  CrudManager,
  type Field,
  type Option,
  type Row,
} from "@/components/admin/crud-manager";

const dayOptions: Option[] = Object.entries(DAY_LABELS).map(([v, l]) => ({
  value: v,
  label: l,
}));
const typeOptions: Option[] = Object.entries(PERIOD_TYPE_LABELS).map(
  ([v, l]) => ({ value: v, label: l }),
);

const fields: Field[] = [
  { name: "dayOfWeek", label: "Hari", type: "select", required: true, options: dayOptions },
  { name: "periodNo", label: "Jam ke-", type: "number", required: true, help: "0 = Upacara Senin" },
  { name: "startTime", label: "Mulai", type: "time", required: true },
  { name: "endTime", label: "Selesai", type: "time", required: true },
  { name: "type", label: "Tipe", type: "select", required: true, options: typeOptions },
];

export default async function PeriodTemplatesPage() {
  const session = await auth();
  const schoolId = session!.user.schoolId;
  const rows = await db
    .select()
    .from(periodTemplates)
    .where(eq(periodTemplates.schoolId, schoolId))
    .orderBy(asc(periodTemplates.dayOfWeek), asc(periodTemplates.startTime));

  return (
    <>
      <PageHeader
        title="Jam Pelajaran"
        description="Template slot waktu per hari. Mendukung Upacara Senin & Jumat lebih pendek."
        action={<GenerateSlots dayOptions={dayOptions} />}
      />
      <CrudManager
        slug="period-templates"
        singular="Jam Pelajaran"
        fields={fields}
        initialRows={rows as unknown as Row[]}
        requireFilter
        filters={[{ key: "dayOfWeek", label: "Hari", options: dayOptions }]}
        dayCopy={{
          endpoint: "/api/v1/period-templates/copy",
          dayOptions,
        }}
      />
    </>
  );
}

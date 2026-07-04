import { db } from "@/db";
import { auditLogs } from "@/db/schema";

type AuditAction = "create" | "update" | "delete" | "lock" | "unlock" | "import";

/** Best-effort audit log write; never throws into the caller. */
export async function writeAudit(entry: {
  userId?: string | null;
  action: AuditAction;
  entity: string;
  entityId?: string | null;
  diff?: unknown;
}) {
  try {
    await db.insert(auditLogs).values({
      userId: entry.userId ?? null,
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId ?? null,
      diffJson: (entry.diff ?? null) as object | null,
    });
  } catch (e) {
    console.error("[audit] failed to write audit log", e);
  }
}

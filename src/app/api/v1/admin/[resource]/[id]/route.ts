import { NextRequest } from "next/server";
import { requireRole, runRoute } from "@/lib/api-auth";
import { getResource, updateResource, removeResource } from "@/lib/resources";

type Params = { params: Promise<{ resource: string; id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  return runRoute(async () => {
    const session = await requireRole("ADMIN");
    const { resource, id } = await params;
    return getResource(resource, session, id);
  });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  return runRoute(async () => {
    const session = await requireRole("ADMIN");
    const { resource, id } = await params;
    const body = await req.json();
    return updateResource(resource, session, id, body);
  });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  return runRoute(async () => {
    const session = await requireRole("ADMIN");
    const { resource, id } = await params;
    return removeResource(resource, session, id);
  });
}

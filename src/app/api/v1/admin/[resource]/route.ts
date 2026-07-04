import { NextRequest } from "next/server";
import { requireRole, runRoute } from "@/lib/api-auth";
import { listResource, createResource } from "@/lib/resources";

type Params = { params: Promise<{ resource: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  return runRoute(async () => {
    const session = await requireRole("ADMIN");
    const { resource } = await params;
    return listResource(resource, session, req.nextUrl.searchParams);
  });
}

export async function POST(req: NextRequest, { params }: Params) {
  return runRoute(async () => {
    const session = await requireRole("ADMIN");
    const { resource } = await params;
    const body = await req.json();
    return createResource(resource, session, body);
  });
}

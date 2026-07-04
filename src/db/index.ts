import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

/*
  Reuse the postgres-js client across hot-reloads in dev to avoid exhausting
  connections. The Neon pooler endpoint handles pooling on its side, so we keep
  the client-side pool small.
*/
const globalForDb = globalThis as unknown as {
  _pg?: ReturnType<typeof postgres>;
};

const client =
  globalForDb._pg ??
  postgres(connectionString, {
    max: 5,
    prepare: false,
    connect_timeout: 30,
    idle_timeout: 20,
  });
if (process.env.NODE_ENV !== "production") globalForDb._pg = client;

export const db = drizzle(client, { schema });
export { schema };

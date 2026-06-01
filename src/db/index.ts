import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getEnv } from "@/lib/env";
import * as schema from "./schema";

let _db: PostgresJsDatabase<typeof schema> | undefined;

export function getDb(): PostgresJsDatabase<typeof schema> {
  if (!_db) {
    const client = postgres(getEnv().DATABASE_URL, { prepare: false });
    _db = drizzle(client, { schema });
  }
  return _db;
}

// Ergonomic lazy accessor: `db.select()...` works, but the client is only
// created on first property access — importing this module has no side effect.
export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get(_target, prop) {
    return getDb()[prop as keyof PostgresJsDatabase<typeof schema>];
  },
});

export { schema };

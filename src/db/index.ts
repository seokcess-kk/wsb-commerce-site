import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getEnv } from "@/lib/env";
import * as schema from "./schema";

let _db: PostgresJsDatabase<typeof schema> | undefined;

export function getDb(): PostgresJsDatabase<typeof schema> {
  if (!_db) {
    const e = getEnv();
    // 프로덕션은 Supabase 트랜잭션 모드 풀러(포트 6543)를 권장한다 — `prepare: false`가 이를 지원한다.
    // `max`로 동시 커넥션을 풀러 한도(세션 모드=15) 안으로 묶고, `idle_timeout`으로 유휴 커넥션을
    // 풀러에 반환해 EMAXCONNSESSION(풀 고갈)을 방지한다. 서버리스 배포 시 DB_POOL_MAX=1 권장.
    const client = postgres(e.DATABASE_URL, {
      prepare: false,
      max: e.DB_POOL_MAX ?? 8,
      idle_timeout: 20,
      connect_timeout: 10,
    });
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

import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  NEXT_PUBLIC_TOSS_CLIENT_KEY: z.string().optional(),
  TOSS_SECRET_KEY: z.string().optional(),
  // Supabase Storage(상품 이미지 업로드). service_role 키는 서버 전용 — 절대 NEXT_PUBLIC_ 금지.
  // 미설정 시 업로드 액션이 친절한 에러를 반환한다(빌드/부팅은 통과).
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_STORAGE_BUCKET: z.string().default("product-images"),
  ADMIN_EMAILS: z.string().optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  NEXT_PUBLIC_PAYMENTS_ENABLED: z.string().optional(),
  // 크론 엔드포인트(가상계좌 만료 스윕 등) 인증용. Vercel Cron 이 Bearer 토큰으로 전달.
  CRON_SECRET: z.string().optional(),
  // DB 커넥션 풀 상한(선택). 미설정 시 db/index.ts의 기본값 사용.
  // Supabase 세션 모드 풀러(한도 15) 사용 시 낮게, 트랜잭션 모드 풀러(6543)면 여유롭게.
  DB_POOL_MAX: z.coerce.number().int().positive().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(source: Record<string, string | undefined>): Env {
  return envSchema.parse(source);
}

// Lazy getter so that importing this module in test environments
// (where process.env lacks the required vars) does not throw at import time.
// In production/Next.js runtime, process.env is fully populated before any
// module import, so calling `env` eagerly there is safe.
let _env: Env | undefined;
export function getEnv(): Env {
  if (!_env) _env = parseEnv(process.env);
  return _env;
}

// Convenience re-export for non-test code that wants a direct reference.
// Access via `getEnv()` in any context where process.env may be incomplete.
export const env = new Proxy({} as Env, {
  get(_target, prop) {
    return getEnv()[prop as keyof Env];
  },
});

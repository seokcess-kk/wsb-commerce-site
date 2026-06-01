import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  NEXT_PUBLIC_TOSS_CLIENT_KEY: z.string().optional(),
  TOSS_SECRET_KEY: z.string().optional(),
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

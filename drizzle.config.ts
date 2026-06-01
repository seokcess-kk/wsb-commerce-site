import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// drizzle-kit CLI는 Next.js처럼 .env.local 을 자동 로드하지 않으므로 여기서 직접 로드한다.
config({ path: ".env.local" });

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});

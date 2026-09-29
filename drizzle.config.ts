import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// Load Next.js local environment variables first, then default .env
dotenv.config({ path: ".env.local" });
dotenv.config();

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "",
  },
});

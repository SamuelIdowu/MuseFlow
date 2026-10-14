
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

export const pool = new Pool({
  connectionString: connectionString || "postgresql://placeholder:placeholder@localhost:5432/placeholder",
  max: 20,
  idleTimeoutMillis: 30000,
});

export const db = drizzle(pool, { schema });
export type DatabaseClient = typeof db;
export * from "./schema";

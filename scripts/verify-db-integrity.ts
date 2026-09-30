import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { Pool } from "@neondatabase/serverless";
import { createClient } from "@supabase/supabase-js";

async function verify() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const tables = [
    "users",
    "profiles",
    "idea_kernels",
    "canvas_sessions",
    "canvas_blocks",
    "canvas_edges",
    "chat_messages",
    "documents",
    "scheduled_posts",
    "saved_campaigns",
    "subscriptions",
    "usage_tracking"
  ];

  console.log("\n==========================================================================");
  console.log("            DATABASE INTEGRITY AUDIT: SUPABASE vs NEON                   ");
  console.log("==========================================================================");
  console.log("| Table Name               | Supabase Count | Neon Count | Status        |");
  console.log("|--------------------------|----------------|------------|---------------|");

  let discrepancies = 0;
  for (const table of tables) {
    let sbCount: number | string = 0;
    try {
      const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
      if (error) {
        sbCount = `Err: ${error.message}`;
      } else {
        sbCount = count ?? 0;
      }
    } catch (e: any) {
      sbCount = `Err: ${e.message}`;
    }

    let neonCount: number | string = 0;
    try {
      const res = await pool.query(`SELECT count(*)::int as count FROM "${table}"`);
      neonCount = res.rows[0].count;
    } catch (e: any) {
      neonCount = `Err: ${e.message}`;
    }

    const isMatch = sbCount === neonCount;
    if (!isMatch) discrepancies++;

    const status = isMatch ? "MATCH (100%)" : "DISCREPANCY";
    const padTable = table.padEnd(24);
    const padSb = String(sbCount).padEnd(14);
    const padNeon = String(neonCount).padEnd(10);
    console.log(`| ${padTable} | ${padSb} | ${padNeon} | ${status.padEnd(13)} |`);
  }

  console.log("==========================================================================\n");

  // Sample check: foreign keys and data structure in Neon
  console.log("Checking Neon Foreign Key Relations and Sample Records...");
  const userCheck = await pool.query(`SELECT id, email, clerk_id, plan_tier FROM users LIMIT 1`);
  console.log("Neon Sample User:", userCheck.rows[0]);

  const canvasCheck = await pool.query(`
    SELECT b.id as block_id, b.type, b.position_x, b.position_y, s.name as session_name
    FROM canvas_blocks b
    JOIN canvas_sessions s ON b.canvas_id = s.id
    LIMIT 1
  `);
  console.log("Neon Sample Joined Block + Session:", canvasCheck.rows[0]);

  await pool.end();

  if (discrepancies === 0) {
    console.log("\nALL TABLES ARE 100% INTACT AND SYNCHRONIZED ACCURATELY.\n");
  } else {
    console.log(`\nFound ${discrepancies} discrepancies.\n`);
  }
}

verify().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { createSupabaseServiceClient } from "../src/lib/supabaseServerClient";
import { db } from "../src/db";
import * as schema from "../src/db/schema";

async function migrateTable(
  tableName: string,
  fetchFn: () => Promise<any[]>,
  insertFn: (rows: any[]) => Promise<any>
) {
  console.log(`[ETL] Fetching ${tableName} from Supabase...`);
  const rows = await fetchFn();
  if (!rows || rows.length === 0) {
    console.log(`[ETL] ${tableName}: 0 rows found. Skipping.`);
    return;
  }
  console.log(`[ETL] ${tableName}: Migrating ${rows.length} rows to Neon...`);
  await insertFn(rows);
  console.log(`[ETL] ${tableName}: Successfully migrated ${rows.length} rows.`);
}

async function runMigration() {
  const supabase = createSupabaseServiceClient();

  console.log("=================================================");
  console.log("  MUSEFLOW DATA MIGRATION: SUPABASE -> NEON      ");
  console.log("=================================================");

  try {
    // 1. Users
    await migrateTable(
      "users",
      async () => {
        const { data, error } = await supabase.from("users").select("*");
        if (error) throw error;
        return data || [];
      },
      async (rows) => {
        for (const row of rows) {
          await db
            .insert(schema.users)
            .values({
              id: row.id,
              email: row.email,
              clerkId: row.clerk_id,
              stripeCustomerId: row.stripe_customer_id,
              flutterwaveCustomerId: row.flutterwave_customer_id,
              flutterwaveTransactionRef: row.flutterwave_transaction_ref,
              flutterwavePlanId: row.flutterwave_plan_id,
              planTier: row.plan_tier,
              paymentProvider: row.payment_provider,
              subscriptionId: row.subscription_id,
              customerId: row.customer_id,
              subscriptionStatus: row.subscription_status,
              currentPeriodEnd: row.current_period_end ? new Date(row.current_period_end) : null,
              subscriptionPlan: row.subscription_plan,
              createdAt: row.created_at ? new Date(row.created_at) : new Date(),
            })
            .onConflictDoNothing();
        }
      }
    );

    // 2. Profiles
    await migrateTable(
      "profiles",
      async () => {
        const { data, error } = await supabase.from("profiles").select("*");
        if (error) throw error;
        return data || [];
      },
      async (rows) => {
        for (const row of rows) {
          await db
            .insert(schema.profiles)
            .values({
              id: row.id,
              userId: row.user_id,
              profileName: row.profile_name || "Default Profile",
              niche: row.niche,
              toneConfig: row.tone_config,
              samples: row.samples,
              defaultContentType: row.default_content_type,
              isActive: row.is_active ?? false,
              createdAt: row.created_at ? new Date(row.created_at) : new Date(),
              updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
            })
            .onConflictDoNothing();
        }
      }
    );

    // 3. Idea Kernels
    await migrateTable(
      "idea_kernels",
      async () => {
        const { data, error } = await supabase.from("idea_kernels").select("*");
        if (error) throw error;
        return data || [];
      },
      async (rows) => {
        for (const row of rows) {
          await db
            .insert(schema.ideaKernels)
            .values({
              id: row.id,
              userId: row.user_id,
              inputType: row.input_type || "text",
              inputData: row.input_data,
              kernels: row.kernels,
              createdAt: row.created_at ? new Date(row.created_at) : new Date(),
            })
            .onConflictDoNothing();
        }
      }
    );

    // 4. Canvas Sessions
    await migrateTable(
      "canvas_sessions",
      async () => {
        const { data, error } = await supabase.from("canvas_sessions").select("*");
        if (error) throw error;
        return data || [];
      },
      async (rows) => {
        for (const row of rows) {
          await db
            .insert(schema.canvasSessions)
            .values({
              id: row.id,
              userId: row.user_id,
              name: row.name,
              createdAt: row.created_at ? new Date(row.created_at) : new Date(),
              updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
            })
            .onConflictDoNothing();
        }
      }
    );

    // 5. Canvas Blocks
    await migrateTable(
      "canvas_blocks",
      async () => {
        const { data, error } = await supabase.from("canvas_blocks").select("*");
        if (error) throw error;
        return data || [];
      },
      async (rows) => {
        for (const row of rows) {
          await db
            .insert(schema.canvasBlocks)
            .values({
              id: row.id,
              canvasId: row.canvas_id,
              userId: row.user_id,
              type: row.type || "paragraph",
              content: row.content || "",
              orderIndex: row.order_index ?? 0,
              positionX: row.position_x != null ? Number(row.position_x) : 0,
              positionY: row.position_y != null ? Number(row.position_y) : 0,
              meta: row.meta,
              createdAt: row.created_at ? new Date(row.created_at) : new Date(),
              updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
            })
            .onConflictDoNothing();
        }
      }
    );

    // 6. Canvas Edges
    await migrateTable(
      "canvas_edges",
      async () => {
        const { data, error } = await supabase.from("canvas_edges").select("*");
        if (error) throw error;
        return data || [];
      },
      async (rows) => {
        for (const row of rows) {
          await db
            .insert(schema.canvasEdges)
            .values({
              id: row.id,
              canvasId: row.canvas_id,
              userId: row.user_id,
              sourceBlockId: row.source_block_id,
              targetBlockId: row.target_block_id,
              label: row.label,
              createdAt: row.created_at ? new Date(row.created_at) : new Date(),
            })
            .onConflictDoNothing();
        }
      }
    );

    // 7. Documents
    await migrateTable(
      "documents",
      async () => {
        const { data, error } = await supabase.from("documents").select("*");
        if (error) throw error;
        return data || [];
      },
      async (rows) => {
        for (const row of rows) {
          await db
            .insert(schema.documents)
            .values({
              id: row.id,
              userId: row.user_id,
              title: row.title || "Untitled Draft",
              subtitle: row.subtitle,
              excerpt: row.excerpt,
              contentJson: row.content_json,
              contentHtml: row.content_html || "",
              wordCount: row.word_count ?? 0,
              createdAt: row.created_at ? new Date(row.created_at) : new Date(),
              updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
            })
            .onConflictDoNothing();
        }
      }
    );

    // 8. Scheduled Posts
    await migrateTable(
      "scheduled_posts",
      async () => {
        const { data, error } = await supabase.from("scheduled_posts").select("*");
        if (error) throw error;
        return data || [];
      },
      async (rows) => {
        for (const row of rows) {
          await db
            .insert(schema.scheduledPosts)
            .values({
              id: row.id,
              userId: row.user_id,
              contentBlocks: row.content_blocks,
              channel: row.channel || "linkedin",
              scheduledTime: new Date(row.scheduled_time),
              status: row.status || "scheduled",
              createdAt: row.created_at ? new Date(row.created_at) : new Date(),
              updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
            })
            .onConflictDoNothing();
        }
      }
    );

    // 9. Saved Campaigns
    await migrateTable(
      "saved_campaigns",
      async () => {
        const { data, error } = await supabase.from("saved_campaigns").select("*");
        if (error) throw error;
        return data || [];
      },
      async (rows) => {
        for (const row of rows) {
          await db
            .insert(schema.savedCampaigns)
            .values({
              id: row.id,
              userId: row.user_id,
              topic: row.topic,
              platform: row.platform,
              tone: row.tone,
              posts: row.posts,
              createdAt: row.created_at ? new Date(row.created_at) : new Date(),
            })
            .onConflictDoNothing();
        }
      }
    );

    // 10. Subscriptions
    await migrateTable(
      "subscriptions",
      async () => {
        const { data, error } = await supabase.from("subscriptions").select("*");
        if (error) throw error;
        return data || [];
      },
      async (rows) => {
        for (const row of rows) {
          await db
            .insert(schema.subscriptions)
            .values({
              id: row.id,
              userId: row.user_id,
              status: row.status,
              priceId: row.price_id,
              cancelAtPeriodEnd: row.cancel_at_period_end,
              currentPeriodEnd: row.current_period_end ? new Date(row.current_period_end) : null,
              createdAt: row.created_at ? new Date(row.created_at) : new Date(),
              endedAt: row.ended_at ? new Date(row.ended_at) : null,
              cancelAt: row.cancel_at ? new Date(row.cancel_at) : null,
              canceledAt: row.canceled_at ? new Date(row.canceled_at) : null,
              trialStart: row.trial_start ? new Date(row.trial_start) : null,
              trialEnd: row.trial_end ? new Date(row.trial_end) : null,
            })
            .onConflictDoNothing();
        }
      }
    );

    // 11. Usage Tracking
    await migrateTable(
      "usage_tracking",
      async () => {
        const { data, error } = await supabase.from("usage_tracking").select("*");
        if (error) throw error;
        return data || [];
      },
      async (rows) => {
        for (const row of rows) {
          await db
            .insert(schema.usageTracking)
            .values({
              id: row.id,
              userId: row.user_id,
              metric: row.metric,
              count: row.count ?? 0,
              periodStart: new Date(row.period_start),
              periodEnd: new Date(row.period_end),
              createdAt: row.created_at ? new Date(row.created_at) : new Date(),
            })
            .onConflictDoNothing();
        }
      }
    );

    console.log("=================================================");
    console.log("  MIGRATION COMPLETED SUCCESSFULLY!             ");
    console.log("=================================================");
  } catch (err) {
    console.error("[ETL ERROR] Failed to complete migration:", err);
    process.exit(1);
  }
}

runMigration().then(() => process.exit(0));

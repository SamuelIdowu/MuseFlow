import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").unique().notNull(),
  clerkId: text("clerk_id").unique().notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  flutterwaveCustomerId: text("flutterwave_customer_id"),
  flutterwaveTransactionRef: text("flutterwave_transaction_ref"),
  flutterwavePlanId: text("flutterwave_plan_id"),
  planTier: text("plan_tier"),
  paymentProvider: text("payment_provider"),
  subscriptionId: text("subscription_id"),
  customerId: text("customer_id"),
  subscriptionStatus: text("subscription_status"),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  subscriptionPlan: text("subscription_plan"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

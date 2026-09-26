import { pgTable, uuid, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

export const ideaKernels = pgTable("idea_kernels", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  inputType: text("input_type").default("text"),
  inputData: text("input_data").notNull(),
  kernels: jsonb("kernels").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type IdeaKernel = typeof ideaKernels.$inferSelect;
export type NewIdeaKernel = typeof ideaKernels.$inferInsert;

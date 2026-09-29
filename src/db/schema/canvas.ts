import { pgTable, uuid, text, integer, doublePrecision, jsonb, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

export const canvasSessions = pgTable("canvas_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const canvasBlocks = pgTable("canvas_blocks", {
  id: uuid("id").defaultRandom().primaryKey(),
  canvasId: uuid("canvas_id").notNull().references(() => canvasSessions.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").default("paragraph"),
  content: text("content").notNull(),
  orderIndex: integer("order_index").default(0).notNull(),
  positionX: doublePrecision("position_x").default(0).notNull(),
  positionY: doublePrecision("position_y").default(0).notNull(),
  meta: jsonb("meta"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const canvasEdges = pgTable("canvas_edges", {
  id: uuid("id").defaultRandom().primaryKey(),
  canvasId: uuid("canvas_id").notNull().references(() => canvasSessions.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sourceBlockId: uuid("source_block_id").notNull().references(() => canvasBlocks.id, { onDelete: "cascade" }),
  targetBlockId: uuid("target_block_id").notNull().references(() => canvasBlocks.id, { onDelete: "cascade" }),
  label: text("label"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  canvasId: uuid("canvas_id").references(() => canvasSessions.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  toolInvocations: jsonb("tool_invocations"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type CanvasSession = typeof canvasSessions.$inferSelect;
export type NewCanvasSession = typeof canvasSessions.$inferInsert;
export type CanvasBlock = typeof canvasBlocks.$inferSelect;
export type NewCanvasBlock = typeof canvasBlocks.$inferInsert;
export type CanvasEdge = typeof canvasEdges.$inferSelect;
export type NewCanvasEdge = typeof canvasEdges.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type NewChatMessage = typeof chatMessages.$inferInsert;

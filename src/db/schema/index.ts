import { relations } from "drizzle-orm";
import { users } from "./users";
import { profiles } from "./profiles";
import { ideaKernels } from "./ideas";
import { canvasSessions, canvasBlocks, canvasEdges, chatMessages } from "./canvas";
import { documents } from "./documents";
import { scheduledPosts } from "./schedule";
import { savedCampaigns, subscriptions, usageTracking } from "./billing";

export * from "./users";
export * from "./profiles";
export * from "./ideas";
export * from "./canvas";
export * from "./documents";
export * from "./schedule";
export * from "./billing";

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  profiles: many(profiles),
  canvasSessions: many(canvasSessions),
  documents: many(documents),
  ideaKernels: many(ideaKernels),
  scheduledPosts: many(scheduledPosts),
  savedCampaigns: many(savedCampaigns),
  subscriptions: many(subscriptions),
  usageTracking: many(usageTracking),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
}));

export const ideaKernelsRelations = relations(ideaKernels, ({ one }) => ({
  user: one(users, {
    fields: [ideaKernels.userId],
    references: [users.id],
  }),
}));

export const canvasSessionsRelations = relations(canvasSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [canvasSessions.userId],
    references: [users.id],
  }),
  blocks: many(canvasBlocks),
  edges: many(canvasEdges),
  chatMessages: many(chatMessages),
}));

export const canvasBlocksRelations = relations(canvasBlocks, ({ one, many }) => ({
  session: one(canvasSessions, {
    fields: [canvasBlocks.canvasId],
    references: [canvasSessions.id],
  }),
  user: one(users, {
    fields: [canvasBlocks.userId],
    references: [users.id],
  }),
  outgoingEdges: many(canvasEdges, { relationName: "sourceBlock" }),
  incomingEdges: many(canvasEdges, { relationName: "targetBlock" }),
}));

export const canvasEdgesRelations = relations(canvasEdges, ({ one }) => ({
  session: one(canvasSessions, {
    fields: [canvasEdges.canvasId],
    references: [canvasSessions.id],
  }),
  sourceBlock: one(canvasBlocks, {
    fields: [canvasEdges.sourceBlockId],
    references: [canvasBlocks.id],
    relationName: "sourceBlock",
  }),
  targetBlock: one(canvasBlocks, {
    fields: [canvasEdges.targetBlockId],
    references: [canvasBlocks.id],
    relationName: "targetBlock",
  }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  session: one(canvasSessions, {
    fields: [chatMessages.canvasId],
    references: [canvasSessions.id],
  }),
  user: one(users, {
    fields: [chatMessages.userId],
    references: [users.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  user: one(users, {
    fields: [documents.userId],
    references: [users.id],
  }),
}));

export const scheduledPostsRelations = relations(scheduledPosts, ({ one }) => ({
  user: one(users, {
    fields: [scheduledPosts.userId],
    references: [users.id],
  }),
}));

export const savedCampaignsRelations = relations(savedCampaigns, ({ one }) => ({
  user: one(users, {
    fields: [savedCampaigns.userId],
    references: [users.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));

export const usageTrackingRelations = relations(usageTracking, ({ one }) => ({
  user: one(users, {
    fields: [usageTracking.userId],
    references: [users.id],
  }),
}));

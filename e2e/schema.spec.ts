import { test, expect } from "@playwright/test";
import * as schema from "../src/db/schema";

test.describe("Drizzle Schema Integrity", () => {
  test("All 12 tables and relations exported correctly", () => {
    expect(schema.users).toBeDefined();
    expect(schema.canvasSessions).toBeDefined();
    expect(schema.canvasBlocks).toBeDefined();
    expect(schema.canvasEdges).toBeDefined();
    expect(schema.chatMessages).toBeDefined();
    expect(schema.documents).toBeDefined();
    expect(schema.ideaKernels).toBeDefined();
    expect(schema.profiles).toBeDefined();
    expect(schema.scheduledPosts).toBeDefined();
    expect(schema.savedCampaigns).toBeDefined();
    expect(schema.subscriptions).toBeDefined();
    expect(schema.usageTracking).toBeDefined();
  });

  test("All query modules export required functions", async () => {
    const userQueries = await import("../src/db/queries/users");
    expect(typeof userQueries.ensureDbUser).toBe("function");

    const canvasQueries = await import("../src/db/queries/canvas");
    expect(typeof canvasQueries.getCanvasDataFromDb).toBe("function");
    expect(typeof canvasQueries.addCanvasBlockToDb).toBe("function");
    expect(typeof canvasQueries.addEdgeToDb).toBe("function");

    const docQueries = await import("../src/db/queries/documents");
    expect(typeof docQueries.saveDocumentInDb).toBe("function");
    expect(typeof docQueries.getUserDocumentsFromDb).toBe("function");

    const ideaQueries = await import("../src/db/queries/ideas");
    expect(typeof ideaQueries.getRecentIdeasFromDb).toBe("function");
    expect(typeof ideaQueries.saveToIdeasInDb).toBe("function");

    const campaignQueries = await import("../src/db/queries/campaigns");
    expect(typeof campaignQueries.saveCampaignInDb).toBe("function");
    expect(typeof campaignQueries.getSavedCampaignsFromDb).toBe("function");

    const profileQueries = await import("../src/db/queries/profiles");
    expect(typeof profileQueries.getActiveProfileFromDb).toBe("function");

    const scheduleQueries = await import("../src/db/queries/schedule");
    expect(typeof scheduleQueries.getScheduledPostsFromDb).toBe("function");
    expect(typeof scheduleQueries.createScheduledPostInDb).toBe("function");

    const billingQueries = await import("../src/db/queries/billing");
    expect(typeof billingQueries.getUsageFromDb).toBe("function");
    expect(typeof billingQueries.incrementUsageInDb).toBe("function");

    const dashboardQueries = await import("../src/db/queries/dashboard");
    expect(typeof dashboardQueries.getDashboardStatsFromDb).toBe("function");
  });
});

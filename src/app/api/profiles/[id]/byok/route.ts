import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { ensureDbUser } from "@/db/queries/users";
import { getProfileByIdFromDb } from "@/db/queries/profiles";
import {
  getProfileBYOKStatus,
  configureProfileBYOK,
  removeProfileBYOK,
  BYOKConfig
} from "@/lib/researchAgentClient";

/**
 * Validates user authentication and verifies ownership of the requested profile.
 */
async function verifyProfileOwnership(profileId: string) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return { error: "Unauthorized", status: 401 };
  }

  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress || '';
  const dbUserId = await ensureDbUser(clerkUserId, email);
  if (!dbUserId) {
    return { error: "User not synchronized", status: 401 };
  }

  const profile = await getProfileByIdFromDb(dbUserId, profileId);
  if (!profile) {
    return { error: "Profile not found or access denied", status: 404 };
  }

  return { dbUserId, clerkUserId };
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: profileId } = await context.params;
    const authCheck = await verifyProfileOwnership(profileId);
    if ("error" in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const status = await getProfileBYOKStatus(profileId);
    return NextResponse.json(status);
  } catch (error: any) {
    console.error("[BYOK Proxy GET Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to retrieve BYOK status" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: profileId } = await context.params;
    const authCheck = await verifyProfileOwnership(profileId);
    if ("error" in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const body = (await req.json()) as BYOKConfig;
    if (!body.llm_provider || !body.llm_model || !body.llm_api_key) {
      return NextResponse.json(
        { error: "llm_provider, llm_model, and llm_api_key are required" },
        { status: 400 }
      );
    }

    const result = await configureProfileBYOK(profileId, body);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[BYOK Proxy POST Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to configure BYOK" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: profileId } = await context.params;
    const authCheck = await verifyProfileOwnership(profileId);
    if ("error" in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    await removeProfileBYOK(profileId);
    return NextResponse.json({ success: true, message: "BYOK removed successfully" });
  } catch (error: any) {
    console.error("[BYOK Proxy DELETE Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reset BYOK" },
      { status: 500 }
    );
  }
}

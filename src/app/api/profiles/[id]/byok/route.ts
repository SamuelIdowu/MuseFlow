import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseUserId, createSupabaseServiceClient } from "@/lib/supabaseServerClient";
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

  const supabaseUserId = await getSupabaseUserId(clerkUserId);
  if (!supabaseUserId) {
    return { error: "User not synchronized", status: 401 };
  }

  const supabase = createSupabaseServiceClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", profileId)
    .eq("user_id", supabaseUserId)
    .single();

  if (error || !profile) {
    return { error: "Profile not found or access denied", status: 404 };
  }

  return { supabaseUserId, clerkUserId };
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

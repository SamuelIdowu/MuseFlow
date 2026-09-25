import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/pricing(.*)",
  "/auth(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
  "/api/cron(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const authObject = await auth();
  const { userId } = authObject;
  const pathname = req.nextUrl.pathname;

  // Check for authorized load testing bypass in dev/staging environments
  const loadTestSecret = process.env.LOAD_TEST_BYPASS_SECRET;
  if (
    loadTestSecret &&
    req.headers.get("x-load-test-secret") === loadTestSecret
  ) {
    const requestHeaders = new Headers(req.headers);
    const testUserId = req.headers.get("x-load-test-user-id") || "test_user_load_test";
    requestHeaders.set("x-load-test-user", testUserId);
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // 1. Redirect authenticated users away from /sign-in & /sign-up → /dashboard
  if (
    userId &&
    (pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up"))
  ) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // 2. Allow public routes
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // 3. Protect protected routes
  if (!userId) {
    // Return 401 for unauthenticated API calls
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Truly unauthenticated page visit - redirect to sign in
    await auth.protect();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|.*\\..*).*)",
    "/(api|trpc)(.*)",
  ],
};

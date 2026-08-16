import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/auth(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const authObject = await auth();
  const { userId } = authObject;
  const pathname = req.nextUrl.pathname;

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
    // Truly unauthenticated - use Clerk's internal protection which handles redirects
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

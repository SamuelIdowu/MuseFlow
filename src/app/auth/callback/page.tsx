"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("Processing authentication...");
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Get the hash fragment from the URL (contains tokens)
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1)
        );
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const error = hashParams.get("error");
        const errorDescription = hashParams.get("error_description");

        // Handle OAuth errors
        if (error) {
          setStatus("error");
          setMessage(errorDescription || error || "Authentication failed");
          setTimeout(() => {
            router.push("/auth/login");
          }, 3000);
          return;
        }

        // If we have tokens in the hash, exchange them for a session
        if (accessToken && refreshToken) {
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            throw sessionError;
          }

          if (data.session) {
            setStatus("success");
            setMessage("Authentication successful! Redirecting...");
            await new Promise((resolve) => setTimeout(resolve, 500));
            router.push("/dashboard");
            router.refresh();
            return;
          }
        }

        // Wait a moment for the auth callback to process
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Get the user details (more secure than session)
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (user) {
          // Check if this is an email confirmation
          const type = searchParams.get("type");
          if (type === "signup") {
            setStatus("success");
            setMessage("Email confirmed! Redirecting to dashboard...");
          } else {
            setStatus("success");
            setMessage("Authentication successful! Redirecting...");
          }
          await new Promise((resolve) => setTimeout(resolve, 500));
          router.push("/dashboard");
          router.refresh();
        } else {
          // No session - might be email confirmation pending
          setStatus("error");
          setMessage(
            "No active session found. Please check your email and click the confirmation link."
          );
          setTimeout(() => {
            router.push("/auth/login");
          }, 3000);
        }
      } catch (error: any) {
        console.error("Auth callback error:", error);
        setStatus("error");
        setMessage(error.message || "Authentication failed. Please try again.");
        setTimeout(() => {
          router.push("/auth/login");
        }, 3000);
      }
    };

    handleAuth();
  }, [router, supabase, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center max-w-md px-4">
        {status === "loading" && (
          <>
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">{message}</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="inline-block rounded-full h-12 w-12 bg-green-500 flex items-center justify-center mb-4">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <p className="text-foreground font-medium">{message}</p>
          </>
        )}
        {status === "error" && (
          <>
            <div className="inline-block rounded-full h-12 w-12 bg-red-500 flex items-center justify-center mb-4">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <p className="text-destructive font-medium mb-4">{message}</p>
            <p className="text-sm text-muted-foreground">
              Redirecting to login...
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}

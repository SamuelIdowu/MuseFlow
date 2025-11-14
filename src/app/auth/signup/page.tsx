/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import toast from "react-hot-toast";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [resending, setResending] = useState(false);
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      console.log("Attempting signup for:", email);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?type=signup`,
        },
      });

      console.log("Signup response:", { data, error });

      if (error) {
        console.error("Signup error:", error);
        toast.error(error.message);
        setLoading(false);
        return;
      }

      // Check if email confirmation is required
      if (data.user && !data.session) {
        // Email confirmation required
        console.log(
          "Email confirmation required. User created but no session."
        );
        console.log("User email confirmed:", data.user.email_confirmed_at);
        setEmailSent(true);
        setLoading(false);
        // Don't redirect - show success message on same page
        return;
      } else if (data.session) {
        // Auto-confirmed (common in development or if email confirmation is disabled)
        console.log("User auto-confirmed (email confirmation disabled)");
        toast.success("Account created successfully!");
        // Wait for cookies to be set
        await new Promise((resolve) => setTimeout(resolve, 100));
        router.push("/dashboard");
        router.refresh();
      } else {
        // Fallback
        console.warn("Unexpected signup response:", data);
        toast.success("Check your email for confirmation!");
        setLoading(false);
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      toast.error(
        error.message || "Failed to create account. Please try again."
      );
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setResending(true);
    try {
      console.log("Resending confirmation email to:", email);
      // Use the resend method with the correct parameters
      const { data, error } = await supabase.auth.resend({
        type: "signup",
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?type=signup`,
        },
      });

      console.log("Resend response:", { data, error });

      if (error) {
        console.error("Resend error:", error);
        toast.error(
          error.message ||
            "Failed to resend email. Please try signing up again."
        );
      } else {
        toast.success(
          "Confirmation email sent! Please check your inbox (and spam folder)."
        );
      }
    } catch (error: any) {
      console.error("Resend error:", error);
      toast.error(
        error.message || "Failed to resend email. Please try signing up again."
      );
    } finally {
      setResending(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        toast.error(error.message);
        setLoading(false);
      }
      // Note: OAuth redirects away, so we don't set loading to false here
    } catch (error: any) {
      toast.error(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between p-6">
        <div className="flex items-center gap-3">
          <span className="text-primary text-2xl">auto_awesome</span>
          <span className="text-foreground text-xl font-bold">ContentAI</span>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center py-10 px-4">
        <div className="w-full max-w-md flex flex-col items-center gap-8">
          <div className="w-full flex flex-col gap-8 bg-card border border-border rounded-xl p-8 shadow-sm">
            {emailSent ? (
              <div className="flex flex-col items-center text-center gap-4">
                <div className="rounded-full h-16 w-16 bg-green-500/10 flex items-center justify-center mb-2">
                  <svg
                    className="h-8 w-8 text-green-500"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight">
                  Check your email
                </h1>
                <p className="text-muted-foreground">
                  We've sent a confirmation link to <strong>{email}</strong>
                </p>
                <p className="text-sm text-muted-foreground">
                  Click the link in the email to activate your account. The link
                  will expire in 24 hours.
                </p>
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mt-4 w-full">
                  <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-2">
                    <strong>Not seeing the email?</strong>
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1 mb-3">
                    <li>• Check your spam/junk folder</li>
                    <li>• Wait a few minutes (emails can take 1-2 minutes)</li>
                    <li>• Verify the email address is correct</li>
                    <li>• Check Supabase logs in your dashboard</li>
                  </ul>
                </div>
                <div className="flex flex-col gap-2 w-full mt-4">
                  <Button
                    variant="outline"
                    onClick={handleResendEmail}
                    disabled={resending}
                  >
                    {resending ? "Sending..." : "Resend confirmation email"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setEmailSent(false);
                      setEmail("");
                      setPassword("");
                      setConfirmPassword("");
                    }}
                  >
                    Use a different email
                  </Button>
                  <Button asChild variant="ghost">
                    <Link href="/auth/login">Back to login</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col items-center text-center gap-3">
                  <h1 className="text-2xl font-bold text-foreground tracking-tight">
                    Create an account
                  </h1>
                  <p className="text-muted-foreground">
                    Enter your details to get started
                  </p>
                </div>

                <form onSubmit={handleSignup} className="flex flex-col gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Creating account..." : "Sign Up"}
                  </Button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleSignup}
                  disabled={loading}
                >
                  <span className="mr-2">google</span> Continue with Google
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  <p>
                    Already have an account?{" "}
                    <Link
                      href="/auth/login"
                      className="font-medium text-primary hover:underline"
                    >
                      Sign in
                    </Link>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Github } from "lucide-react";

export function OAuthButtons() {
  const supabase = createClient();

  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleGithubSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="flex w-full flex-col gap-3">
      <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
          <path
            d="M22.578 12.282c0-.72-.065-1.42-.186-2.103H12v3.978h5.937c-.266 1.286-.96 2.378-2.046 3.132v2.58h3.313c1.933-1.782 3.044-4.385 3.044-7.587z"
            fill="#4285F4"
          />
          <path
            d="M12 23c3.24 0 5.956-1.074 7.94-2.91l-3.313-2.58c-1.074.72-2.44 1.15-4.627 1.15-3.565 0-6.582-2.4-7.66-5.61H1.047v2.662C3.063 20.355 7.15 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M4.34 14.053a8.21 8.21 0 010-5.106V6.285H1.047a11.95 11.95 0 000 10.43L4.34 14.053z"
            fill="#FBBC05"
          />
          <path
            d="M12 3.34c1.75 0 3.334.604 4.586 1.795l2.94-2.94C17.95.996 15.24 0 12 0 7.15 0 3.063 2.645 1.047 6.285l3.293 2.662C5.418 5.74 8.435 3.34 12 3.34z"
            fill="#EA4335"
          />
        </svg>
        Continue with Google
      </Button>
      <Button variant="outline" className="w-full" onClick={handleGithubSignIn}>
        <Github className="h-5 w-5" />
        Continue with GitHub
      </Button>
    </div>
  );
}

export const createClient = () => {
  return createClientComponentClient();
};

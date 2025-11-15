"use client";

import { useState, useEffect, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { UserNav } from "@/components/dashboard/UserNav";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();
  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  useEffect(() => {
    let mounted = true;
    let redirectTimeout: NodeJS.Timeout | null = null;

    // Listen for auth state changes - this is the primary way to detect session
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (session) {
        // Clear any pending redirect
        if (redirectTimeout) {
          clearTimeout(redirectTimeout);
          redirectTimeout = null;
        }
        setSession(session);
        setLoading(false);
      } else if (event === "SIGNED_OUT") {
        // Only redirect on explicit sign out
        router.push("/auth/login");
      }
    });

    // Check initial session after a delay to allow cookies to be set
    const checkInitialSession = async () => {
      // Wait a bit for cookies to be available
      await new Promise((resolve) => setTimeout(resolve, 300));

      if (!mounted) return;

      // Use getUser instead of getSession for security
      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser();

      if (user && !userError && mounted) {
        // Get session for setting state (this is a valid session since user exists)
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setSession(session);
          setLoading(false);
        }
      } else if (!user && mounted) {
        // Only set redirect timeout if we still don't have a session
        // Give it more time for auth state change to fire
        redirectTimeout = setTimeout(() => {
          if (mounted) {
            supabase.auth
              .getUser()
              .then(({ data: { user: finalCheckUser }, error: finalCheckError }) => {
                if (!finalCheckUser && !finalCheckError && mounted) {
                  router.push("/auth/login");
                }
              });
          }
        }, 1000);
      }
    };

    checkInitialSession();

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      mounted = false;
      if (redirectTimeout) {
        clearTimeout(redirectTimeout);
      }
      subscription.unsubscribe();
      window.removeEventListener("resize", handleResize);
    };
  }, [supabase, router]);

  if (loading || !session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full overflow-hidden">
      {/* Desktop sidebar */}
      {!isMobile && <Sidebar />}

      {/* Mobile sidebar */}
      {isMobile && (
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="fixed top-4 left-4 z-50 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <Sidebar />
          </SheetContent>
        </Sheet>
      )}

      <div className="flex flex-col flex-1 overflow-hidden lg:pl-0">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background p-4">
          <div className="block lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <Sidebar />
              </SheetContent>
            </Sheet>
          </div>
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">Dashboard</h1>
          </div>
          <UserNav user={session.user} />
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
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
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Redirecting to sign-in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <div className="flex flex-col flex-1 overflow-hidden lg:pl-0">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background p-4">
          <div className="lg:hidden">
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72">
                <Sidebar onNavClick={() => setIsMobileOpen(false)} />
              </SheetContent>
            </Sheet>
          </div>
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold lg:hidden">Dashboard</h1>
          </div>
          <UserNav />
        </header>
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 w-full max-w-full">{children}</main>
      </div>
    </div>
  );
}

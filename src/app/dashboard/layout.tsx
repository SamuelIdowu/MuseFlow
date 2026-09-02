"use client";

import { useState, useEffect } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { UserNav } from "@/components/dashboard/UserNav";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { HistorySidebar } from "@/components/dashboard/HistorySidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, History as HistoryIcon } from "lucide-react";
import { ReminderProvider } from "@/components/providers/ReminderProvider";
import { WaveLoader } from "@/components/ui/wave-loader";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <WaveLoader message="LOADING" size="lg" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <WaveLoader message="REDIRECTING TO SIGN-IN..." size="lg" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Silent background reminder watcher */}
      <ReminderProvider />

      {/* Desktop sidebar */}
      <div className="hidden lg:flex h-full">
        <Sidebar />
      </div>

      <div className="flex flex-col flex-1 overflow-hidden lg:pl-0">
        <header className="sticky top-0 z-10 flex lg:hidden items-center justify-between border-b bg-background p-3">
          <div className="flex items-center gap-2">
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-60">
                <Sidebar onNavClick={() => setIsMobileOpen(false)} defaultCollapsed={false} />
              </SheetContent>
            </Sheet>
            <h1 className="text-lg font-semibold">Dashboard</h1>
          </div>

          <div className="flex items-center gap-2">
            <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <HistoryIcon className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="p-0 w-72">
                <HistorySidebar onNavClick={() => setIsHistoryOpen(false)} />
              </SheetContent>
            </Sheet>
            <UserNav />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 md:p-4 w-full max-w-full">{children}</main>
      </div>

      {/* Desktop Right Sidebar */}
      <div className="hidden xl:block h-full">
        <HistorySidebar className="h-full" />
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  Home,
  FileText,
  Calendar,
  User,
  Settings,
  SquarePen,
  Megaphone,
  Plus,
  FileEdit,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { UserNav } from '@/components/dashboard/UserNav';

const navItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    title: 'Ideas',
    href: '/dashboard/ideas',
    icon: FileText,
  },
  {
    title: 'Canvas',
    href: '/dashboard/canvas',
    icon: SquarePen,
  },
  {
    title: 'Editor',
    href: '/dashboard/editor',
    icon: FileEdit,
  },
  {
    title: 'Campaigns',
    href: '/dashboard/campaigns',
    icon: Megaphone,
  },
  {
    title: 'Schedule',
    href: '/dashboard/schedule',
    icon: Calendar,
  },
  {
    title: 'Profiles',
    href: '/dashboard/profiles',
    icon: User,
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

export function Sidebar({
  onNavClick,
  defaultCollapsed = true,
}: {
  onNavClick?: () => void;
  defaultCollapsed?: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  useEffect(() => {
    // Only load saved preference if defaultCollapsed wasn't explicitly forced false (e.g. mobile sheet)
    if (defaultCollapsed !== false) {
      const savedState = localStorage.getItem('museflow_sidebar_collapsed');
      if (savedState !== null) {
        setIsCollapsed(savedState === 'true');
      }
    }
  }, [defaultCollapsed]);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('museflow_sidebar_collapsed', String(next));
      return next;
    });
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'flex flex-col h-full border-r border-border bg-card text-muted-foreground flex-shrink-0 transition-all duration-300 ease-in-out select-none',
          isCollapsed ? 'w-14' : 'w-56'
        )}
      >
        <div className="flex flex-col flex-1 h-full overflow-hidden">
          {/* Header: Brand & Collapse Button */}
          <div
            className={cn(
              'flex items-center py-3.5 px-3 flex-shrink-0 border-b border-border/60',
              isCollapsed ? 'justify-center' : 'justify-between'
            )}
          >
            <Link
              href="/dashboard"
              onClick={onNavClick}
              className="flex items-center gap-2.5 group overflow-hidden"
            >
              <Image
                src="/logoo.png"
                alt="MuseFlow Logo"
                width={24}
                height={24}
                className="rounded-lg shadow-sm flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
              />
              {!isCollapsed && (
                <div className="flex flex-col truncate">
                  <span className="font-semibold text-xs text-foreground tracking-tight leading-none truncate">
                    MuseFlow
                  </span>
                  <span className="text-[10px] text-muted-foreground font-medium leading-tight truncate">
                    AI Content Studio
                  </span>
                </div>
              )}
            </Link>

            {!isCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg flex-shrink-0"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="w-[15px] h-[15px]" />
              </Button>
            )}
          </div>

          {/* Quick Action: New Idea */}
          <div className="px-2.5 pt-3 pb-2 flex-shrink-0">
            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex justify-center">
                    <Link href="/dashboard/ideas" onClick={onNavClick}>
                      <Button
                        size="icon"
                        className="h-7 w-7 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-md transition-transform hover:scale-105"
                      >
                        <Plus className="w-[14px] h-[14px]" />
                      </Button>
                    </Link>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-semibold text-xs">
                  New Idea
                </TooltipContent>
              </Tooltip>
            ) : (
              <Link href="/dashboard/ideas" onClick={onNavClick}>
                <Button
                  size="sm"
                  className="w-full h-8 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm text-xs font-medium flex items-center justify-center gap-2"
                >
                  <Plus className="w-[14px] h-[14px]" />
                  <span>New Idea</span>
                </Button>
              </Link>
            )}
          </div>

          {/* Nav Items */}
          <div className="flex flex-col gap-1 w-full px-2 pt-1 flex-shrink-0">
            {navItems.map((item) => {
              const isActive = pathname === item.href && !searchParams.get('chatId');
              const Icon = item.icon;

              if (isCollapsed) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        onClick={onNavClick}
                        className={cn(
                          'flex items-center justify-center h-8.5 w-8.5 mx-auto rounded-xl transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-muted/80 group relative',
                          isActive &&
                            'bg-primary/10 text-primary font-semibold before:absolute before:left-[-6px] before:top-1/2 before:-translate-y-1/2 before:h-4 before:w-1 before:rounded-r-full before:bg-primary'
                        )}
                      >
                        <Icon
                          className="w-[17px] h-[17px]"
                          strokeWidth={isActive ? 2.3 : 1.8}
                        />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="font-semibold text-xs">
                      {item.title}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavClick}
                  className={cn(
                    'flex items-center gap-3 px-3 h-8.5 rounded-lg text-xs font-medium transition-all duration-150 text-muted-foreground hover:text-foreground hover:bg-muted/80 group relative',
                    isActive &&
                      'bg-primary/10 text-primary font-semibold border-l-2 border-primary rounded-l-none pl-2.5'
                  )}
                >
                  <Icon
                    className="w-[17px] h-[17px] flex-shrink-0"
                    strokeWidth={isActive ? 2.3 : 1.8}
                  />
                  <span className="truncate">{item.title}</span>
                </Link>
              );
            })}
          </div>

          <div className="flex-1" />

          {/* Footer Controls */}
          <div className="p-2 border-t border-border/60 flex flex-col gap-1.5">
            {isCollapsed ? (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleSidebar}
                      className="h-8.5 w-8.5 mx-auto text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl"
                    >
                      <PanelLeftOpen className="w-[15px] h-[15px]" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-semibold text-xs">
                    Expand sidebar
                  </TooltipContent>
                </Tooltip>

                <div className="flex justify-center my-0.5">
                  <ModeToggle />
                </div>
                <div className="flex justify-center">
                  <UserNav />
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between px-1 py-1">
                <div className="flex items-center gap-2 overflow-hidden">
                  <UserNav />
                </div>
                <div className="flex items-center gap-1">
                  <ModeToggle />
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
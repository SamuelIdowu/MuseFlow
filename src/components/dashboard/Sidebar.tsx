'use client';

import { cn } from '@/lib/utils';
import { Home, FileText, Calendar, User, Settings, SquarePen, Megaphone, Plus, FileEdit } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

export function Sidebar({ onNavClick }: { onNavClick?: () => void, defaultCollapsed?: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-col h-full w-14 border-r border-zinc-900 bg-zinc-950 text-zinc-400 flex-shrink-0">
        <div className="flex flex-col flex-1 h-full overflow-hidden items-center">
          <div className="flex items-center justify-center py-4 flex-shrink-0">
            <Link href="/dashboard" onClick={onNavClick}>
              <Image src="/logoo.png" alt="MuseFlow Logo" width={28} height={28} className="rounded-lg shadow-sm" />
            </Link>
          </div>

          <div className="mb-4 flex-shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/dashboard?action=new" onClick={onNavClick}>
                  <Button size="icon" className="h-8 w-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-md">
                    <Plus className="h-4 w-4" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-semibold">
                New Chat
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="flex flex-col gap-2 w-full px-2 flex-shrink-0">
            {navItems.map((item) => {
              const isActive = pathname === item.href && !searchParams.get('chatId');
              const Icon = item.icon;

              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      onClick={onNavClick}
                      className={cn(
                        'flex items-center justify-center h-10 w-10 rounded-xl transition-all duration-200 text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800/50 group relative',
                        isActive && 'bg-zinc-800 text-zinc-50 before:absolute before:left-[-8px] before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-1 before:rounded-r-full before:bg-primary'
                      )}
                    >
                      <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-semibold">
                    {item.title}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>

          <div className="flex-1" />

          <div className="pb-4 w-full px-2">
            <div className="flex justify-center mb-2">
              <ModeToggle />
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
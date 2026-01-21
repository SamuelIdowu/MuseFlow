'use client';

import { cn } from '@/lib/utils';

import { Home, FileText, Calendar, User, Settings, SquarePen, Megaphone, Plus } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';
import { Separator } from '@/components/ui/separator';
import { UpgradeCard } from './UpgradeCard';

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

export function Sidebar({ onNavClick }: { onNavClick?: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <div className="flex flex-col h-full w-72 border-r border-sidebar-border bg-sidebar">
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-6 flex-shrink-0">
          <Image src="/logo.jpg" alt="MuseFlow Logo" width={40} height={40} className="rounded-lg" />
          <span className="text-xl font-bold text-sidebar-foreground">MuseFlow</span>
        </div>

        <div className="px-4 mb-4 flex-shrink-0">
          <Link href="/dashboard" onClick={onNavClick}>
            <Button className="w-full justify-start gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200">
              <Plus className="h-4 w-4" />
              New Chat
            </Button>
          </Link>
        </div>

        <div className="px-4 space-y-1 flex-shrink-0">
          {navItems.map((item) => {
            const isActive = pathname === item.href && !searchParams.get('chatId');
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavClick}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground/80 transition-all duration-200 hover:text-sidebar-foreground hover:bg-sidebar-accent relative',
                  isActive && 'bg-sidebar-accent text-sidebar-foreground before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-1 before:rounded-r before:bg-primary'
                )}
              >
                <Icon className="h-5 w-5" />
                {item.title}
              </Link>
            );
          })}
        </div>

        <Separator className="my-4 bg-sidebar-border" />

        <div className="flex-1" />

        <UpgradeCard />
      </div>
      <div className="p-4 border-t border-sidebar-border flex items-center justify-between">
        <span className="text-xs text-sidebar-foreground/60">© {new Date().getFullYear()} ContentAI</span>
        <ModeToggle />
      </div>
    </div>
  );
}
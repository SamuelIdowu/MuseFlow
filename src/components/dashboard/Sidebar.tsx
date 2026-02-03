'use client';

import { cn } from '@/lib/utils';
import { useState } from 'react';

import { Home, FileText, Calendar, User, Settings, SquarePen, Megaphone, Plus, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
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

export function Sidebar({ onNavClick, defaultCollapsed = true }: { onNavClick?: () => void, defaultCollapsed?: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [isHovered, setIsHovered] = useState(false);

  // Sidebar is expanded if it's NOT collapsed (pinned open) OR if it is hovered
  const isExpanded = !isCollapsed || isHovered;

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div
      className={cn("flex flex-col h-full border-r border-sidebar-border bg-sidebar transition-all duration-300", isExpanded ? "w-72" : "w-20")}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        <div className={cn("flex items-center gap-2 py-6 flex-shrink-0 relative", isCollapsed ? "justify-center px-0" : "px-6")}>
          <Link href="/dashboard" className="flex items-center gap-2" onClick={onNavClick}>
            <Image src="/logoo.png" alt="MuseFlow Logo" width={40} height={40} className="rounded-lg" />
            {!isCollapsed && <span className="text-xl font-bold text-sidebar-foreground animate-in fade-in duration-300">MuseFlow</span>}
          </Link>

          <Button
            variant="ghost"
            size="icon"
            className={cn("absolute -right-3 top-7 h-6 w-6 rounded-full border bg-background shadow-sm hover:bg-accent z-20 hidden lg:flex", !isExpanded && "-right-3")}
            onClick={toggleSidebar}
          >
            {isCollapsed ? <PanelLeftOpen className="h-3 w-3" /> : <PanelLeftClose className="h-3 w-3" />}
          </Button>
        </div>

        <div className="px-4 mb-4 flex-shrink-0">
          <Link href="/dashboard?action=new" onClick={onNavClick}>
            <Button className={cn("w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200", isExpanded ? "justify-start" : "justify-center px-0")}>
              <Plus className="h-4 w-4" />
              {isExpanded && <span>New Chat</span>}
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
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground/80 transition-all duration-200 hover:text-sidebar-foreground hover:bg-sidebar-accent relative group',
                  isActive && 'bg-sidebar-accent text-sidebar-foreground before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-1 before:rounded-r before:bg-primary',
                  !isExpanded ? "justify-center" : ""
                )}
                title={!isExpanded ? item.title : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {isExpanded && <span className="whitespace-nowrap overflow-hidden text-ellipsis">{item.title}</span>}
              </Link>
            );
          })}
        </div>

        <Separator className="my-4 bg-sidebar-border" />

        <div className="flex-1" />

        {isExpanded && <UpgradeCard />}
      </div>
      <div className="p-4 border-t border-sidebar-border flex items-center justify-between">
        {isExpanded && <span className="text-xs text-sidebar-foreground/60">© {new Date().getFullYear()} ContentAI</span>}
        <ModeToggle />
      </div>
    </div>
  );
}
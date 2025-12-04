'use client';

import { cn } from '@/lib/utils';
import { Home, FileText, Calendar, User, Settings, SquarePen } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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

  return (
    <div className="flex flex-col h-full w-72 border-r bg-card">
      <div className="flex flex-col gap-2 flex-1">
        <div className="flex items-center gap-2 px-6 py-6">
          <div className="bg-primary text-primary-foreground rounded-lg p-2">
            <span className="text-xl font-bold">MF</span>
          </div>
          <span className="text-xl font-bold">MuseFlow</span>
        </div>
        <div className="px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavClick}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/50',
                  isActive && 'bg-muted text-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                {item.title}
              </Link>
            );
          })}
        </div>
      </div>
      <div className="p-6 text-xs text-muted-foreground border-t">
        © {new Date().getFullYear()} ContentAI. All rights reserved.
      </div>
    </div>
  );
}
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

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden border-r h-screen w-70 flex-col justify-between p-4 flex lg:flex">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 px-2 py-4">
          <div className="bg-primary text-primary-foreground rounded-lg p-2">
            <span className="text-xl">MF</span>
          </div>
          <span className="text-xl font-bold">MuseFlow</span>
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:text-foreground',
                isActive && 'bg-muted text-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.title}
            </Link>
          );
        })}
      </div>
      <div className="mt-auto text-xs text-muted-foreground p-4">
        © {new Date().getFullYear()} ContentAI. All rights reserved.
      </div>
    </div>
  );
}
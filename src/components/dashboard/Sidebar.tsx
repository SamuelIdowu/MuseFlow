'use client';

import { cn } from '@/lib/utils';

import { Home, FileText, Calendar, User, Settings, SquarePen, MessageSquare, Plus, Trash2, Megaphone } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getRecentChats, deleteIdeaAction, deleteAllChatsAction } from '@/lib/dashboardServerActions';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'react-hot-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  const currentChatId = searchParams.get('chatId');
  const [recentChats, setRecentChats] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    const fetchChats = async () => {
      const chats = await getRecentChats();
      setRecentChats(chats);
    };
    fetchChats();
  }, [currentChatId]); // Refresh when chat changes (e.g. new chat created)

  const handleDeleteChat = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();

    // Optimistic update
    setRecentChats(prev => prev.filter(c => c.id !== id));

    try {
      await deleteIdeaAction(id);
      toast.success("Chat deleted");
      if (currentChatId === id) {
        window.location.href = '/dashboard';
      }
    } catch (error) {
      console.error("Failed to delete chat", error);
      toast.error("Failed to delete chat");
      const chats = await getRecentChats();
      setRecentChats(chats);
    }
  };

  const handleClearAllChats = async () => {
    try {
      await deleteAllChatsAction();
      setRecentChats([]);
      toast.success("All chats cleared");
      window.location.href = '/dashboard';
    } catch (error) {
      console.error("Failed to clear chats", error);
      toast.error("Failed to clear chats");
    }
  };

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
            const isActive = pathname === item.href && !currentChatId; // Only active if no chat ID (for Dashboard home)
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

        <div className="px-4 pb-2 text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider flex-shrink-0 flex justify-between items-center group">
          <span>Recent Chats</span>
          {recentChats.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="text-[10px] hover:text-destructive transition-colors duration-200">
                  Clear All
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your entire chat history.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearAllChats} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Clear All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        <ScrollArea className="flex-1 px-4">
          <div className="space-y-1 pb-4">
            {recentChats.map((chat) => (
              <div key={chat.id} className="group relative">
                <Link
                  href={`/dashboard?chatId=${chat.id}`}
                  onClick={onNavClick}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 transition-all duration-200 hover:text-sidebar-foreground hover:bg-sidebar-accent pr-8 relative', // Add padding right for button
                    currentChatId === chat.id && 'bg-sidebar-accent text-sidebar-foreground before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-4 before:w-0.5 before:rounded-r before:bg-primary'
                  )}
                >
                  <MessageSquare className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{chat.title}</span>
                </Link>
                <button
                  onClick={(e) => handleDeleteChat(e, chat.id)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-sidebar-foreground/60 hover:text-destructive transition-all duration-200 rounded-md hover:bg-sidebar-accent"
                  title="Delete Chat"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
      <div className="p-4 border-t border-sidebar-border flex items-center justify-between">
        <span className="text-xs text-sidebar-foreground/60">© {new Date().getFullYear()} ContentAI</span>
        <ModeToggle />
      </div>
    </div>
  );
}
import { useState, useEffect, useCallback } from 'react';
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
  MessageSquare,
  Trash2,
  History,
  Clock,
  Sparkles,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { UserNav } from '@/components/dashboard/UserNav';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getRecentChats, deleteIdeaAction } from '@/features/ideas/actions/ideaActions';
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

interface RecentChatItem {
  id: string;
  title: string;
  createdAt?: string;
}

export function Sidebar({
  onNavClick,
  defaultCollapsed = true,
}: {
  onNavClick?: () => void;
  defaultCollapsed?: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentChatId = searchParams.get('chatId');

  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [recentChats, setRecentChats] = useState<RecentChatItem[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);

  const fetchChats = useCallback(async () => {
    try {
      setIsLoadingChats(true);
      const chats = await getRecentChats(20);
      setRecentChats(chats || []);
    } catch (err) {
      console.error('Failed to load recent chats for sidebar:', err);
    } finally {
      setIsLoadingChats(false);
    }
  }, []);

  useEffect(() => {
    fetchChats();

    const handleChatUpdated = () => {
      fetchChats();
    };

    window.addEventListener('museflow:chat_updated', handleChatUpdated);
    return () => window.removeEventListener('museflow:chat_updated', handleChatUpdated);
  }, [fetchChats, currentChatId]);

  useEffect(() => {
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

  const handleDeleteChat = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();

    setRecentChats((prev) => prev.filter((c) => c.id !== id));

    try {
      await deleteIdeaAction(id);
      toast.success('Chat deleted');
      if (currentChatId === id) {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Failed to delete chat:', error);
      toast.error('Failed to delete chat');
      fetchChats();
    }
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'flex flex-col h-full border-r border-border bg-card text-muted-foreground flex-shrink-0 transition-all duration-300 ease-in-out select-none',
          isCollapsed ? 'w-14' : 'w-60'
        )}
      >
        <div className="flex flex-col flex-1 h-full overflow-hidden">
          {/* Header: Brand & Collapse Button */}
          <div
            className={cn(
              'flex items-center py-3 px-3 flex-shrink-0 border-b border-border/60',
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
                  <span className="text-[10px] text-muted-foreground font-medium leading-tight truncate mt-0.5">
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
          <div className="px-2.5 pt-2.5 pb-2 flex-shrink-0">
            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex justify-center">
                    <Link href="/dashboard" onClick={onNavClick}>
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
                  New Idea / Chat
                </TooltipContent>
              </Tooltip>
            ) : (
              <Link href="/dashboard" onClick={onNavClick}>
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
          <div className="flex flex-col gap-0.5 w-full px-2 pt-0.5 flex-shrink-0">
            {navItems.map((item) => {
              const isActive = pathname === item.href && !currentChatId;
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
                    'flex items-center gap-3 px-2.5 h-8 rounded-lg text-xs font-medium transition-all duration-150 text-muted-foreground hover:text-foreground hover:bg-muted/80 group relative',
                    isActive &&
                      'bg-primary/10 text-primary font-semibold border-l-2 border-primary rounded-l-none pl-2'
                  )}
                >
                  <Icon
                    className="w-[16px] h-[16px] flex-shrink-0"
                    strokeWidth={isActive ? 2.3 : 1.8}
                  />
                  <span className="truncate">{item.title}</span>
                </Link>
              );
            })}
          </div>

          {/* Chat History Section */}
          {isCollapsed ? (
            <div className="pt-2 px-2 border-t border-border/40 mt-2 flex justify-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsCollapsed(false)}
                    className="h-8.5 w-8.5 mx-auto text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl"
                  >
                    <History className="w-[17px] h-[17px]" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-semibold text-xs">
                  Chat History ({recentChats.length})
                </TooltipContent>
              </Tooltip>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0 pt-3 px-2 mt-2 border-t border-border/50 overflow-hidden">
              <div className="flex items-center justify-between px-2 mb-1.5 flex-shrink-0">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <History className="w-3.5 h-3.5 text-primary" />
                  <span>Recent Chats</span>
                </div>
                {recentChats.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted font-medium text-muted-foreground">
                    {recentChats.length}
                  </span>
                )}
              </div>

              <ScrollArea className="flex-1 -mr-1 pr-1">
                <div className="flex flex-col gap-0.5 pb-2">
                  {isLoadingChats ? (
                    <div className="space-y-1.5 px-2 py-2">
                      <div className="h-6 bg-muted/60 rounded animate-pulse" />
                      <div className="h-6 bg-muted/60 rounded animate-pulse" />
                      <div className="h-6 bg-muted/60 rounded animate-pulse" />
                    </div>
                  ) : recentChats.length === 0 ? (
                    <div className="text-center py-6 px-3">
                      <MessageSquare className="w-6 h-6 mx-auto mb-1 text-muted-foreground/30" />
                      <p className="text-[11px] text-muted-foreground/70">No recent chats</p>
                    </div>
                  ) : (
                    recentChats.map((chat) => {
                      const isChatActive = currentChatId === chat.id;

                      return (
                        <div
                          key={chat.id}
                          className={cn(
                            'group relative flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-all duration-150 hover:bg-muted/80',
                            isChatActive
                              ? 'bg-primary/10 text-primary font-medium border-l-2 border-primary rounded-l-none pl-1.5'
                              : 'text-muted-foreground hover:text-foreground'
                          )}
                        >
                          <Link
                            href={`/dashboard?chatId=${chat.id}`}
                            onClick={onNavClick}
                            className="flex items-center gap-2 flex-1 min-w-0 pr-1"
                            title={chat.title}
                          >
                            <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 opacity-70 group-hover:opacity-100" />
                            <span className="truncate text-[11.5px] leading-tight">
                              {chat.title || 'Untitled Chat'}
                            </span>
                          </Link>

                          <button
                            type="button"
                            onClick={(e) => handleDeleteChat(e, chat.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10 hover:text-destructive text-muted-foreground flex-shrink-0"
                            title="Delete chat"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Footer Controls */}
          <div className="p-2 border-t border-border/60 flex flex-col gap-1.5 flex-shrink-0 bg-card">
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
              <div className="flex items-center justify-between px-1 py-0.5">
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
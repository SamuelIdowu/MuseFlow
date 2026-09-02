import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getRecentChats, deleteIdeaAction, deleteAllChatsAction } from '@/features/ideas/actions/ideaActions';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'react-hot-toast';
import { MessageSquare, Trash2, Plus, PanelRightClose, PanelRightOpen, History } from 'lucide-react';
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
import { format, isToday, isYesterday, subDays, isAfter } from 'date-fns';

export function HistorySidebar({ onNavClick, className }: { onNavClick?: () => void, className?: string }) {
    const searchParams = useSearchParams();
    const currentChatId = searchParams.get('chatId');
    const [recentChats, setRecentChats] = useState<{ id: string; title: string, created_at?: string }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCollapsed, setIsCollapsed] = useState(true);

    const isExpanded = !isCollapsed;

    const toggleSidebar = () => setIsCollapsed(!isCollapsed);

    useEffect(() => {
        const fetchChats = async () => {
            setIsLoading(true);
            try {
                const chats = await getRecentChats();
                setRecentChats(chats);
            } finally {
                setIsLoading(false);
            }
        };
        fetchChats();
    }, [currentChatId]);

    const handleDeleteChat = async (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();

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

    // Group chats by date
    const groupedChats = recentChats.reduce((acc, chat) => {
        // Mock created_at if missing (since we didn't see it in original type, but assuming meaningful date logic requires it)
        // For now, let's just assume simple listing if no date is present, or mock generic grouping
        const date = chat.created_at ? new Date(chat.created_at) : new Date(); // Fallback to now if missing

        let key = 'Older';
        if (isToday(date)) key = 'Today';
        else if (isYesterday(date)) key = 'Yesterday';
        else if (isAfter(date, subDays(new Date(), 7))) key = 'Previous 7 Days';
        else key = 'Older';

        if (!acc[key]) acc[key] = [];
        acc[key].push(chat);
        return acc;
    }, {} as Record<string, typeof recentChats>);

    const groupOrder = ['Today', 'Yesterday', 'Previous 7 Days', 'Older'];

    return (
        <div
            className={cn("flex flex-col h-full bg-card border-l border-border transition-all duration-300 relative shadow-2xs", isExpanded ? "w-72" : "w-12 items-center", className)}
        >

            {/* Toggle Button */}
            <div className={cn("flex items-center p-3 border-b border-border", isCollapsed ? "justify-center p-2" : "justify-between")}>
                {!isCollapsed && <h2 className="font-bold text-sm text-foreground">Idea History</h2>}

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSidebar}
                    className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                    {isCollapsed ? <PanelRightOpen className="h-4 w-4" /> : <PanelRightClose className="h-4 w-4" />}
                </Button>

                {!isCollapsed && (
                    <Link href="/dashboard/ideas" onClick={onNavClick}>
                        <Button size="sm" variant="secondary" className="rounded-lg h-7 bg-primary text-primary-foreground hover:bg-primary/90 text-[11px] font-semibold px-2.5 shadow-2xs">
                            <Plus className="h-3 w-3 mr-1" /> New Idea
                        </Button>
                    </Link>
                )}
            </div>

            {/* Collapsed State Content (Optional: Show Icon) */}
            {!isExpanded && (
                <div className="flex-1 flex flex-col items-center pt-3 gap-3">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" title="History">
                        <History className="h-4 w-4" />
                    </Button>
                    <Link href="/dashboard/ideas" onClick={onNavClick} title="New Idea">
                        <Button size="icon" variant="secondary" className="rounded-full h-7 w-7 bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs">
                            <Plus className="h-3.5 w-3.5" />
                        </Button>
                    </Link>
                </div>
            )}

            {/* Expanded State Content */}
            {isExpanded && (
                <>
                    <ScrollArea className="flex-1 px-3 py-3">
                        {isLoading ? (
                            <div className="space-y-4">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="flex items-center gap-2.5 px-3 py-2">
                                        <Skeleton className="h-3.5 w-3.5 rounded-full" />
                                        <Skeleton className="h-3.5 flex-1" />
                                    </div>
                                ))}
                            </div>
                        ) : recentChats.length === 0 ? (
                            <div className="text-center text-muted-foreground text-[13px] font-medium py-8">No recent chats</div>
                        ) : (
                            <div className="space-y-4">
                                {groupOrder.map(group => {
                                    const chats = groupedChats[group];
                                    if (!chats || chats.length === 0) return null;

                                    return (
                                        <div key={group} className="space-y-1.5">
                                            <h3 className="text-[11px] font-bold text-muted-foreground pl-2 uppercase tracking-wider">{group}</h3>
                                            <div className="space-y-0.5">
                                                {chats.map(chat => (
                                                    <div key={chat.id} className="group relative">
                                                        <Link
                                                             href={`/dashboard/ideas?chatId=${chat.id}`}
                                                            onClick={onNavClick}
                                                            className={cn(
                                                                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200 border',
                                                                currentChatId === chat.id
                                                                    ? 'bg-primary/10 border-primary/30 text-primary font-semibold shadow-2xs'
                                                                    : 'border-transparent text-foreground/80 hover:bg-muted/80 hover:text-foreground'
                                                            )}
                                                        >
                                                            <MessageSquare className="h-3.5 w-3.5 flex-shrink-0 opacity-80" />
                                                            <span className="truncate flex-1">{chat.title}</span>
                                                        </Link>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </ScrollArea>

                    {recentChats.length > 0 && (
                        <div className="p-3 border-t border-border/40 text-center">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-7 text-[11px] text-muted-foreground hover:text-destructive w-full">
                                        <Trash2 className="h-3 w-3 mr-2" /> Clear History
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Clear History?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will permanently delete all your conversation history.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleClearAllChats} className="bg-destructive text-destructive-foreground">
                                            Clear All
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

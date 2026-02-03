import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getRecentChats, deleteIdeaAction, deleteAllChatsAction } from '@/lib/dashboardServerActions';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
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
    const [isCollapsed, setIsCollapsed] = useState(true);
    const [isHovered, setIsHovered] = useState(false);

    const isExpanded = !isCollapsed || isHovered;

    const toggleSidebar = () => setIsCollapsed(!isCollapsed);

    useEffect(() => {
        const fetchChats = async () => {
            const chats = await getRecentChats();
            setRecentChats(chats);
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
            className={cn("flex flex-col h-full bg-background/95 backdrop-blur-sm border-l border-border transition-all duration-300 relative", isExpanded ? "w-80" : "w-14 items-center", className)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >

            {/* Toggle Button */}
            <div className={cn("flex items-center p-4 border-b border-border/40", isCollapsed ? "justify-center p-2" : "justify-between")}>
                {!isCollapsed && <h2 className="font-semibold text-lg">History Chat</h2>}

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSidebar}
                    className={cn("h-8 w-8", isCollapsed ? "" : "")}
                >
                    {isCollapsed ? <PanelRightOpen className="h-4 w-4" /> : <PanelRightClose className="h-4 w-4" />}
                </Button>

                {!isCollapsed && (
                    <Link href="/dashboard" onClick={onNavClick}>
                        <Button size="sm" variant="secondary" className="rounded-lg h-8 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium">
                            <Plus className="h-3 w-3 mr-1.5" /> New Chat
                        </Button>
                    </Link>
                )}
            </div>

            {/* Collapsed State Content (Optional: Show Icon) */}
            {!isExpanded && (
                <div className="flex-1 flex flex-col items-center pt-4 gap-4">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" title="History">
                        <History className="h-5 w-5" />
                    </Button>
                    <Link href="/dashboard" onClick={onNavClick} title="New Chat">
                        <Button size="icon" variant="secondary" className="rounded-full h-8 w-8 bg-primary text-primary-foreground hover:bg-primary/90">
                            <Plus className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            )}

            {/* Expanded State Content */}
            {isExpanded && (
                <>
                    <ScrollArea className="flex-1 px-4 py-4">
                        {recentChats.length === 0 ? (
                            <div className="text-center text-muted-foreground text-sm py-10">No recent chats</div>
                        ) : (
                            <div className="space-y-6">
                                {groupOrder.map(group => {
                                    const chats = groupedChats[group];
                                    if (!chats || chats.length === 0) return null;

                                    return (
                                        <div key={group} className="space-y-2">
                                            <h3 className="text-xs font-medium text-muted-foreground pl-2">{group}</h3>
                                            <div className="space-y-1">
                                                {chats.map(chat => (
                                                    <div key={chat.id} className="group relative">
                                                        <Link
                                                            href={`/dashboard?chatId=${chat.id}`}
                                                            onClick={onNavClick}
                                                            className={cn(
                                                                'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-all duration-200 border border-transparent',
                                                                currentChatId === chat.id
                                                                    ? 'bg-muted/40 border-primary/20 text-foreground shadow-sm'
                                                                    : 'hover:bg-muted/30 hover:border-white/5 text-muted-foreground hover:text-foreground'
                                                            )}
                                                        >
                                                            <MessageSquare className="h-4 w-4 flex-shrink-0 opacity-70" />
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
                        <div className="p-4 border-t border-border/40 text-center">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-destructive w-full">
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

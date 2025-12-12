import { getDashboardStats, getActiveProfile, getChatById } from '@/lib/dashboardServerActions';
import { DashboardClient } from './DashboardClient';
import { format } from 'date-fns';

// Force dynamic rendering because this route uses auth() which requires headers
export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function DashboardPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const chatId = searchParams.chatId as string | undefined;

  let stats;
  let activeProfile;
  let chatSession = null;
  let error = null;

  try {
    const promises: Promise<any>[] = [
      getDashboardStats(),
      getActiveProfile()
    ];

    if (chatId) {
      promises.push(getChatById(chatId));
    }

    const results = await Promise.all(promises);
    stats = results[0];
    activeProfile = results[1];
    if (chatId) {
      chatSession = results[2];
    }

  } catch (e) {
    console.error('Error loading dashboard data:', e);
    error = 'Failed to load dashboard data';
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Height calculation assumes header is approx 4rem. Adjust if needed to fit window exactly without scrolling the page body if we want internal scrolling */}
      <DashboardClient
        activeProfile={activeProfile ?? null}
        initialStats={stats}
        initialChatSession={chatSession}
        error={error}
      />
    </div>
  );
}

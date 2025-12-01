import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getDashboardStats, getRecentIdeas, getActiveProfile } from '@/lib/dashboardServerActions';
import { format } from 'date-fns';
import { DashboardClient } from './DashboardClient';
import { ExpandableIdea } from '@/components/ExpandableIdea';

// Force dynamic rendering because this route uses auth() which requires headers
export const dynamic = 'force-dynamic';

async function DashboardContent() {
  let stats;
  let recentIdeas;
  let activeProfile;

  try {
    [stats, recentIdeas, activeProfile] = await Promise.all([
      getDashboardStats(),
      getRecentIdeas(3),
      getActiveProfile()
    ]);

  } catch (error) {
    // Handle all other errors (e.g., database connection issues)
    console.error('Error loading dashboard data:', error);
    return (
      <div className="text-center py-10">
        <h3 className="text-lg font-medium">Error Loading Dashboard</h3>
        <p className="text-muted-foreground">
          There was an issue loading your dashboard data. Please try again later.
        </p>
      </div>
    );
  }

  // This JSX will only be rendered if the try block succeeds
  return (
    <>
      <div className="grid gap-6 md:grid-cols-2">
        <DashboardClient activeProfile={activeProfile} />
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>
              Your content creation metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted rounded-lg p-4 text-center">
                <p className="text-2xl font-bold">{stats.ideasCount}</p>
                <p className="text-sm text-muted-foreground">Ideas Generated</p>
              </div>
              <div className="bg-muted rounded-lg p-4 text-center">
                <p className="text-2xl font-bold">{stats.contentCount}</p>
                <p className="text-sm text-muted-foreground">Content Pieces</p>
              </div>
              <div className="bg-muted rounded-lg p-4 text-center">
                <p className="text-2xl font-bold">{stats.scheduledCount}</p>
                <p className="text-sm text-muted-foreground">Scheduled Posts</p>
              </div>
              <div className="bg-muted rounded-lg p-4 text-center">
                <p className="text-2xl font-bold">{stats.profileCount}</p>
                <p className="text-sm text-muted-foreground">Profiles</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Ideas</CardTitle>
          <CardDescription>
            Your recently generated content ideas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentIdeas.length > 0 ? (
              recentIdeas.map((idea) => (
                <ExpandableIdea key={idea.id} idea={idea} />
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No recent ideas yet. Generate your first idea to get started!
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

export default async function DashboardPage() {
  const activeProfile = await getActiveProfile();

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold tracking-tight">Content Ideation Dashboard</h2>
            {activeProfile ? (
              <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                Active: {activeProfile.profile_name}
              </span>
            ) : (
              <span className="inline-flex items-center rounded-md bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 text-xs font-medium text-yellow-800 dark:text-yellow-500 ring-1 ring-inset ring-yellow-600/20">
                No Active Profile
              </span>
            )}
          </div>
          <p className="text-muted-foreground">
            Generate content ideas from your input and start creating
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/canvas">Create New Content</Link>
        </Button>
      </div>

      <DashboardContent />
    </div>
  );
}

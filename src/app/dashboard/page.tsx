import Link from 'next/link';
// Import redirect from next/navigation
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getDashboardStats, getRecentIdeas } from '@/lib/dashboardServerActions';
import { format } from 'date-fns';
import { DashboardClient } from './DashboardClient';

async function DashboardContent() {
  let stats;
  let recentIdeas;

  try {
    [stats, recentIdeas] = await Promise.all([
      getDashboardStats(),
      getRecentIdeas(3)
    ]);

  } catch (error) {
    if (error instanceof Error && error.message === 'User not authenticated') {
      
     console.warn('User not authenticated, redirecting to login page.');
     redirect('/auth/login');
    }

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
        <DashboardClient />
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
                <div
                  key={idea.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <h3 className="font-medium">{idea.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Generated on {format(new Date(idea.createdAt), 'MMM d, yyyY')}
                  </p>
                </div>
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
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Content Ideation Dashboard</h2>
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
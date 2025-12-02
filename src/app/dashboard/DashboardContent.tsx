'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { DashboardClient } from './DashboardClient';
import { DashboardStatsCard } from '@/components/dashboard/DashboardStatsCard';
import { ExpandableIdea } from '@/components/ExpandableIdea';
import { Profile } from '@/types/profile';

interface Idea {
  id: string;
  title: string;
  createdAt: string;
  inputData: string;
  inputType: string;
}

interface DashboardContentProps {
  activeProfile: Profile | null;
}

export default function DashboardContent({ activeProfile }: DashboardContentProps) {
  const [recentIdeas, setRecentIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecentIdeas = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/dashboard/recent-ideas?limit=3');

        if (!response.ok) {
          throw new Error('Failed to fetch recent ideas');
        }

        const data = await response.json();
        setRecentIdeas(data);
      } catch (err) {
        console.error('Error fetching recent ideas:', err);
        setError('Failed to load recent ideas');
      } finally {
        setLoading(false);
      }
    };

    fetchRecentIdeas();
  }, []);

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-destructive">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2">
        <DashboardClient activeProfile={activeProfile} />
        <DashboardStatsCard />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Ideas</CardTitle>
          <CardDescription>
            Your recently generated content ideas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-4 border rounded-lg animate-pulse">
                  <div className="h-5 bg-muted-foreground/20 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-muted-foreground/10 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : recentIdeas.length > 0 ? (
            <div className="space-y-4">
              {recentIdeas.map((idea) => (
                <ExpandableIdea key={idea.id} idea={idea} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No recent ideas yet. Generate your first idea to get started!</p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
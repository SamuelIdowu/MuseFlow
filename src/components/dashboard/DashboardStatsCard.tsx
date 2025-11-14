'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RotateCw } from 'lucide-react';
import { getDashboardStats } from '@/lib/dashboardServerActions';

interface DashboardStats {
  ideasCount: number;
  contentCount: number;
  scheduledCount: number;
  profileCount: number;
}

export function DashboardStatsCard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Since we can't call server actions directly from a client component,
      // we'll need to make an API call
      const response = await fetch('/api/dashboard/stats');
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }
      
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Quick Stats</CardTitle>
          <CardDescription>
            Your content creation metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-destructive py-4">{error}</p>
          <Button onClick={fetchStats} variant="outline" className="w-full">
            <RotateCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Quick Stats</CardTitle>
          <CardDescription>
            Your content creation metrics
          </CardDescription>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={fetchStats}
          disabled={loading}
        >
          <RotateCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-muted rounded-lg p-4 text-center">
                <div className="h-8 bg-muted-foreground/20 rounded mb-2 animate-pulse"></div>
                <div className="h-4 bg-muted-foreground/10 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        ) : stats ? (
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
        ) : (
          <p className="text-center text-muted-foreground py-4">No stats available</p>
        )}
      </CardContent>
    </Card>
  );
}
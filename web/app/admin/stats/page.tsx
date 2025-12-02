'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { PlatformStats } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Calendar, Ticket, DollarSign, TrendingUp, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { useCurrency } from '@/lib/currency';

export default function AdminStatsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { formatAmount } = useCurrency();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'admin') {
        router.push('/');
      } else {
        loadStats();
      }
    }
  }, [user, authLoading, router]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getPlatformStats();
      setStats(data);
    } catch (error) {
      toast.error('Failed to load platform statistics');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Remove the old formatAmount function since we're using the hook

  const calculateGrowthMetrics = () => {
    if (!stats) return null;

    // These would typically come from historical data
    // For now, we'll show the current metrics
    return {
      userGrowth: 0, // Placeholder
      revenueGrowth: 0, // Placeholder
      eventGrowth: 0, // Placeholder
      ticketGrowth: 0, // Placeholder
    };
  };

  const growth = calculateGrowthMetrics();

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-8">
          <BarChart3 className="h-8 w-8" />
          <h1 className="text-4xl font-bold">Platform Statistics</h1>
        </div>

        {stats && (
          <>
            {/* Main Stats Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total_users.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.total_organizers} organizers
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total_events.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    Events created
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tickets Sold</CardTitle>
                  <Ticket className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total_tickets_sold.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    Total tickets
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatAmount(stats.total_revenue)}</div>
                  <p className="text-xs text-muted-foreground">
                    Gross revenue
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatAmount(stats.platform_revenue)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Platform earnings
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average per Event</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.total_events > 0 
                      ? formatAmount(stats.total_revenue / stats.total_events)
                      : formatAmount(0)
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Revenue per event
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Analytics */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>User Breakdown</CardTitle>
                  <CardDescription>
                    Distribution of users by role
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm">Organizers</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{stats.total_organizers.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">
                          {((stats.total_organizers / stats.total_users) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm">Attendees</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {(stats.total_users - stats.total_organizers).toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {(((stats.total_users - stats.total_organizers) / stats.total_users) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Revenue Breakdown</CardTitle>
                  <CardDescription>
                    Platform vs organizer revenue
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm">Platform Revenue</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatAmount(stats.platform_revenue)}</div>
                        <div className="text-xs text-muted-foreground">
                          {stats.total_revenue > 0 
                            ? ((stats.platform_revenue / stats.total_revenue) * 100).toFixed(1)
                            : 0
                          }%
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm">Organizer Revenue</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {formatAmount(stats.total_revenue - stats.platform_revenue)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {stats.total_revenue > 0 
                            ? (((stats.total_revenue - stats.platform_revenue) / stats.total_revenue) * 100).toFixed(1)
                            : 0
                          }%
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Key Metrics */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Average Ticket Price</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {stats.total_tickets_sold > 0 
                      ? formatAmount(stats.total_revenue / stats.total_tickets_sold)
                      : formatAmount(0)
                    }
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Average price per ticket
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tickets per Event</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {stats.total_events > 0 
                      ? Math.round(stats.total_tickets_sold / stats.total_events)
                      : 0
                    }
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Average tickets sold per event
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Platform Fee Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {stats.total_revenue > 0 
                      ? ((stats.platform_revenue / stats.total_revenue) * 100).toFixed(1)
                      : 0
                    }%
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Effective platform fee rate
                  </p>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

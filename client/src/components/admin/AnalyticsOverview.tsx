import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BookOpen, TrendingUp, DollarSign, Star, Eye } from 'lucide-react';

interface AnalyticsData {
  totalUsers: number;
  activeSubscriptions: number;
  totalBooks: number;
  totalRevenue: number;
  monthlySignups: number;
  popularBooks: Array<{
    id: string;
    title: string;
    views: number;
    rating: number;
  }>;
  revenueByTier: {
    basic: number;
    premium: number;
  };
}

interface AnalyticsOverviewProps {
  isAdmin: boolean;
}

export function AnalyticsOverview({ isAdmin }: AnalyticsOverviewProps) {
  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/admin/analytics"],
    enabled: isAdmin,
  });

  if (!isAdmin) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted animate-pulse rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{analytics?.monthlySignups || 0} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.activeSubscriptions || 0}</div>
            <p className="text-xs text-muted-foreground">
              Premium & Basic subscribers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Books</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalBooks || 0}</div>
            <p className="text-xs text-muted-foreground">
              Available in library
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{analytics?.totalRevenue || 0}</div>
            <p className="text-xs text-muted-foreground">
              From active subscriptions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown */}
      {analytics?.revenueByTier && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Tier</CardTitle>
              <CardDescription>Monthly subscription revenue breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Basic (£5.99/month)</span>
                  <span className="text-sm font-bold">£{analytics.revenueByTier.basic}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Premium (£9.99/month)</span>
                  <span className="text-sm font-bold">£{analytics.revenueByTier.premium}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex items-center justify-between font-medium">
                    <span>Total</span>
                    <span>£{analytics.revenueByTier.basic + analytics.revenueByTier.premium}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Popular Books</CardTitle>
              <CardDescription>Most viewed books this month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics?.popularBooks?.slice(0, 5).map((book, index) => (
                  <div key={book.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        #{index + 1}
                      </span>
                      <span className="text-sm font-medium truncate">{book.title}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        <span>{book.views}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500" />
                        <span>{book.rating}</span>
                      </div>
                    </div>
                  </div>
                )) || (
                  <p className="text-sm text-muted-foreground">No popular books data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
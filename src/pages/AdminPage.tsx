import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { 
  AlertCircle, 
  BarChart3, 
  Users, 
  KanbanSquare, 
  Bell,
  TrendingUp,
  FileWarning
} from 'lucide-react';

const AdminPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    recentErrors: 0,
    totalTracks: 0,
    totalLabels: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuickStats();
  }, []);

  const loadQuickStats = async () => {
    try {
      const [usersRes, errorsRes, tracksRes, labelsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('upload_errors').select('id', { count: 'exact', head: true })
          .eq('resolved', false)
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('audio_tracks').select('id', { count: 'exact', head: true }),
        supabase.from('audio_labels').select('id', { count: 'exact', head: true })
      ]);

      setStats({
        totalUsers: usersRes.count || 0,
        recentErrors: errorsRes.count || 0,
        totalTracks: tracksRes.count || 0,
        totalLabels: labelsRes.count || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const adminTools = [
    {
      title: 'Error Dashboard',
      description: 'Monitor and resolve upload errors in real-time',
      icon: AlertCircle,
      path: '/app/admin/errors',
      stats: `${stats.recentErrors} recent errors`,
      color: 'text-red-500'
    },
    {
      title: 'Analytics',
      description: 'Track user growth, uploads, and engagement metrics',
      icon: BarChart3,
      path: '/app/admin/analytics',
      stats: `${stats.totalUsers} total users`,
      color: 'text-blue-500'
    },
    {
      title: 'Referrals',
      description: 'View referral data and top referrers',
      icon: Users,
      path: '/app/admin/referrals',
      stats: 'Track referral sources',
      color: 'text-green-500'
    },
    {
      title: 'Feature Tracker',
      description: 'Manage feature development with kanban board',
      icon: KanbanSquare,
      path: '/app/admin/features',
      stats: 'Kanban workflow',
      color: 'text-purple-500'
    },
    {
      title: 'Notifications',
      description: 'Send announcements and updates to users',
      icon: Bell,
      path: '/app/admin/notifications',
      stats: 'User communications',
      color: 'text-orange-500'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage your application and monitor key metrics</p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Errors</CardTitle>
            <FileWarning className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.recentErrors}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tracks</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.totalTracks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Labels</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.totalLabels}</div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Tools Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {adminTools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Card key={tool.path} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(tool.path)}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-muted ${tool.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{tool.title}</CardTitle>
                  </div>
                </div>
                <CardDescription className="mt-2">{tool.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{tool.stats}</span>
                  <Button variant="ghost" size="sm">
                    Open →
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AdminPage;

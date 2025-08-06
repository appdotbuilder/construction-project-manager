
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import type { ProjectDashboard as ProjectDashboardType } from '../../../server/src/handlers/get_project_dashboard';
import {
  Activity,
  FileCheck,
  Users,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Clock,
  CheckCircle
} from 'lucide-react';

interface ProjectDashboardProps {
  projectId: number;
}

export function ProjectDashboard({ projectId }: ProjectDashboardProps) {
  const [dashboardData, setDashboardData] = useState<ProjectDashboardType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getProjectDashboard.query({ projectId });
      setDashboardData(result);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-gray-500">Unable to load dashboard data</p>
        </CardContent>
      </Card>
    );
  }

  const dashboardCards = [
    {
      title: 'Total Activities',
      value: dashboardData.total_activities.toString(),
      description: 'Total logged activities',
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Recent Activities',
      value: dashboardData.recent_activities.toString(),
      description: 'Activities this week',
      icon: Clock,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Pending Approvals',
      value: dashboardData.pending_approvals.toString(),
      description: 'Documents awaiting approval',
      icon: FileCheck,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Active Meetings',
      value: dashboardData.active_meetings.toString(),
      description: 'Scheduled meetings',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Overall Progress',
      value: `${dashboardData.overall_progress}%`,
      description: 'Project completion',
      icon: TrendingUp,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      showProgress: true,
      progressValue: dashboardData.overall_progress
    },
    {
      title: 'Budget Utilization',
      value: `${dashboardData.budget_utilization}%`,
      description: 'Budget used',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      showProgress: true,
      progressValue: dashboardData.budget_utilization
    },
    {
      title: 'Active Contractors',
      value: dashboardData.active_contractors.toString(),
      description: 'Working contractors',
      icon: CheckCircle,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50'
    },
    {
      title: 'K3 Incidents',
      value: dashboardData.k3_incidents.toString(),
      description: 'Safety incidents',
      icon: AlertTriangle,
      color: dashboardData.k3_incidents > 0 ? 'text-red-600' : 'text-gray-600',
      bgColor: dashboardData.k3_incidents > 0 ? 'bg-red-50' : 'bg-gray-50'
    }
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {dashboardCards.map((card) => {
          const IconComponent = card.icon;
          
          return (
            <Card key={card.title} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <IconComponent className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {card.value}
                </div>
                <p className="text-xs text-gray-500 mb-2">
                  {card.description}
                </p>
                {card.showProgress && (
                  <Progress 
                    value={card.progressValue} 
                    className="h-2"
                  />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            🚀 Quick Actions
          </CardTitle>
          <CardDescription>
            Common project management tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center transition-colors">
              <Activity className="h-6 w-6 mx-auto mb-2 text-blue-600" />
              <span className="text-sm font-medium">Log Activity</span>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center transition-colors">
              <FileCheck className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <span className="text-sm font-medium">Upload Document</span>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center transition-colors">
              <Users className="h-6 w-6 mx-auto mb-2 text-purple-600" />
              <span className="text-sm font-medium">Schedule Meeting</span>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center transition-colors">
              <DollarSign className="h-6 w-6 mx-auto mb-2 text-orange-600" />
              <span className="text-sm font-medium">Payment Request</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Project Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              📈 Progress Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Overall Progress</span>
                  <span className="text-sm font-medium">{dashboardData.overall_progress}%</span>
                </div>
                <Progress value={dashboardData.overall_progress} className="h-3" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Budget Utilization</span>
                  <span className="text-sm font-medium">{dashboardData.budget_utilization}%</span>
                </div>
                <Progress value={dashboardData.budget_utilization} className="h-3" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              ⚠️ Safety & Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">K3 Incidents</span>
                <Badge variant={dashboardData.k3_incidents === 0 ? 'default' : 'destructive'}>
                  {dashboardData.k3_incidents} incidents
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pending Approvals</span>
                <Badge variant={dashboardData.pending_approvals === 0 ? 'default' : 'secondary'}>
                  {dashboardData.pending_approvals} pending
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Contractors</span>
                <Badge variant="outline">
                  {dashboardData.active_contractors} contractors
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

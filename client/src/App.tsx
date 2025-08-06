
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CreateProject } from '@/components/CreateProject';
import { ProjectDashboard } from '@/components/ProjectDashboard';
import { DailyActivities } from '@/components/DailyActivities';
import { DocumentManagement } from '@/components/DocumentManagement';
import { PaymentApplications } from '@/components/PaymentApplications';
import { MeetingManagement } from '@/components/MeetingManagement';
import { trpc } from '@/utils/trpc';
import type { Project } from '../../server/src/schema';
import { 
  Building2, 
  Activity, 
  FileText, 
  CreditCard, 
  Users, 
  PlusCircle, 
  Home,
  BarChart3
} from 'lucide-react';

function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateProject, setShowCreateProject] = useState(false);

  const loadProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getProjects.query();
      setProjects(result);
      
      // Select first project by default if none selected
      if (result.length > 0 && !selectedProject) {
        setSelectedProject(result[0]);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedProject]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleProjectCreated = (newProject: Project) => {
    setProjects((prev: Project[]) => [...prev, newProject]);
    setSelectedProject(newProject);
    setShowCreateProject(false);
    setActiveTab('dashboard');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-yellow-100 text-yellow-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'on_hold': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-lg text-gray-600">Loading Construction Projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  🏗️ Construction Management
                </h1>
                <p className="text-gray-600">
                  Professional construction project management system
                </p>
              </div>
            </div>
            
            <Dialog open={showCreateProject} onOpenChange={setShowCreateProject}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Construction Project</DialogTitle>
                </DialogHeader>
                <CreateProject onProjectCreated={handleProjectCreated} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {projects.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Building2 className="h-24 w-24 text-gray-300 mx-auto mb-6" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                No Projects Yet
              </h2>
              <p className="text-gray-600 mb-6">
                Create your first construction project to get started with project management.
              </p>
              <Button 
                onClick={() => setShowCreateProject(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Your First Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Project Sidebar */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Projects</CardTitle>
                  <CardDescription>
                    Select a project to manage
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-2">
                    {projects.map((project: Project) => (
                      <button
                        key={project.id}
                        onClick={() => {
                          setSelectedProject(project);
                          setActiveTab('dashboard');
                        }}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          selectedProject?.id === project.id
                            ? 'bg-blue-50 border-l-4 border-blue-600'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium text-gray-900 line-clamp-1">
                            {project.name}
                          </h3>
                          <Badge className={getStatusColor(project.status)}>
                            {project.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          📍 {project.location}
                        </p>
                        <div className="text-xs text-gray-500">
                          Started: {project.start_date.toLocaleDateString('id-ID')}
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {selectedProject ? (
                <div>
                  {/* Project Header */}
                  <Card className="mb-6">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl">{selectedProject.name}</CardTitle>
                          <CardDescription className="text-base mt-1">
                            📍 {selectedProject.location}
                          </CardDescription>
                          {selectedProject.description && (
                            <p className="text-gray-600 mt-2">{selectedProject.description}</p>
                          )}
                        </div>
                        <Badge className={getStatusColor(selectedProject.status)}>
                          {selectedProject.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 text-sm">
                        <div>
                          <span className="text-gray-600">Start Date:</span>
                          <p className="font-medium">
                            {selectedProject.start_date.toLocaleDateString('id-ID')}
                          </p>
                        </div>
                        {selectedProject.end_date && (
                          <div>
                            <span className="text-gray-600">End Date:</span>
                            <p className="font-medium">
                              {selectedProject.end_date.toLocaleDateString('id-ID')}
                            </p>
                          </div>
                        )}
                        {selectedProject.budget && (
                          <div>
                            <span className="text-gray-600">Budget:</span>
                            <p className="font-medium">
                              Rp {selectedProject.budget.toLocaleString('id-ID')}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                  </Card>

                  {/* Navigation Tabs */}
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 mb-6">
                      <TabsTrigger value="dashboard" className="flex items-center gap-2">
                        <Home className="h-4 w-4" />
                        <span className="hidden sm:inline">Dashboard</span>
                      </TabsTrigger>
                      <TabsTrigger value="activities" className="flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        <span className="hidden sm:inline">Activities</span>
                      </TabsTrigger>
                      <TabsTrigger value="documents" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="hidden sm:inline">Documents</span>
                      </TabsTrigger>
                      <TabsTrigger value="payments" className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        <span className="hidden sm:inline">Payments</span>
                      </TabsTrigger>
                      <TabsTrigger value="meetings" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span className="hidden sm:inline">Meetings</span>
                      </TabsTrigger>
                      <TabsTrigger value="reports" className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        <span className="hidden sm:inline">Reports</span>
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="dashboard">
                      <ProjectDashboard projectId={selectedProject.id} />
                    </TabsContent>

                    <TabsContent value="activities">
                      <DailyActivities projectId={selectedProject.id} />
                    </TabsContent>

                    <TabsContent value="documents">
                      <DocumentManagement projectId={selectedProject.id} />
                    </TabsContent>

                    <TabsContent value="payments">
                      <PaymentApplications projectId={selectedProject.id} />
                    </TabsContent>

                    <TabsContent value="meetings">
                      <MeetingManagement projectId={selectedProject.id} />
                    </TabsContent>

                    <TabsContent value="reports">
                      <Card>
                        <CardHeader>
                          <CardTitle>📊 Reports & Analytics</CardTitle>
                          <CardDescription>
                            Generate daily, weekly, and monthly reports
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Button variant="outline" className="h-20 flex-col gap-2">
                              <FileText className="h-6 w-6" />
                              Daily Report
                            </Button>
                            <Button variant="outline" className="h-20 flex-col gap-2">
                              <FileText className="h-6 w-6" />
                              Weekly Report
                            </Button>
                            <Button variant="outline" className="h-20 flex-col gap-2">
                              <FileText className="h-6 w-6" />
                              Monthly Report
                            </Button>
                          </div>
                          <p className="text-sm text-gray-500 mt-4">
                            📝 Generate comprehensive reports with activity logs, progress updates, and K3 information
                          </p>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              ) : (
                <Card className="text-center py-12">
                  <CardContent>
                    <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">Select a project to view details</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

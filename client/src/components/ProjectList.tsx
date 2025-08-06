
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Project } from '../../../server/src/schema';

interface ProjectListProps {
  projects: Project[];
  selectedProject: Project | null;
  onSelectProject: (project: Project) => void;
}

export function ProjectList({ projects, selectedProject, onSelectProject }: ProjectListProps) {
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

  return (
    <div className="space-y-4">
      {projects.map((project: Project) => (
        <Card
          key={project.id}
          className={`cursor-pointer transition-all hover:shadow-md ${
            selectedProject?.id === project.id ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={() => onSelectProject(project)}
        >
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">{project.name}</CardTitle>
                <CardDescription className="mt-1">
                  📍 {project.location}
                </CardDescription>
              </div>
              <Badge className={getStatusColor(project.status)}>
                {project.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent>
            {project.description && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {project.description}
              </p>
            )}
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Start Date:</span>
                <span>{project.start_date.toLocaleDateString('id-ID')}</span>
              </div>
              {project.end_date && (
                <div className="flex justify-between">
                  <span className="text-gray-600">End Date:</span>
                  <span>{project.end_date.toLocaleDateString('id-ID')}</span>
                </div>
              )}
              {project.budget && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Budget:</span>
                  <span>Rp {project.budget.toLocaleString('id-ID')}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

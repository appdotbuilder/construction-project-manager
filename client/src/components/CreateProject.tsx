
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { trpc } from '@/utils/trpc';
import type { CreateProjectInput, Project, ProjectStatus } from '../../../server/src/schema';

interface CreateProjectProps {
  onProjectCreated: (project: Project) => void;
}

export function CreateProject({ onProjectCreated }: CreateProjectProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  
  const [formData, setFormData] = useState<CreateProjectInput>({
    name: '',
    description: null,
    location: '',
    start_date: new Date(),
    end_date: null,
    status: 'planning' as ProjectStatus,
    budget: null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate) return;

    setIsLoading(true);
    try {
      const projectData: CreateProjectInput = {
        ...formData,
        start_date: startDate,
        end_date: endDate || null,
        budget: formData.budget || null
      };

      const response = await trpc.createProject.mutate(projectData);
      onProjectCreated(response);
      
      // Reset form
      setFormData({
        name: '',
        description: null,
        location: '',
        start_date: new Date(),
        end_date: null,
        status: 'planning' as ProjectStatus,
        budget: null
      });
      setStartDate(new Date());
      setEndDate(undefined);
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Project Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreateProjectInput) => ({ ...prev, name: e.target.value }))
          }
          placeholder="e.g., Pembangunan Gedung Perkantoran ABC"
          required
        />
      </div>

      <div>
        <Label htmlFor="location">Location *</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreateProjectInput) => ({ ...prev, location: e.target.value }))
          }
          placeholder="e.g., Jakarta Selatan, DKI Jakarta"
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description || ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData((prev: CreateProjectInput) => ({
              ...prev,
              description: e.target.value || null
            }))
          }
          placeholder="Project description and specifications..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Start Date *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, 'dd/MM/yyyy') : 'Select date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <Label>End Date (Optional)</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, 'dd/MM/yyyy') : 'Select date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                initialFocus
                disabled={(date) => startDate ? date <= startDate : false}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Project Status</Label>
          <Select
            value={formData.status || 'planning'}
            onValueChange={(value: ProjectStatus) =>
              setFormData((prev: CreateProjectInput) => ({ ...prev, status: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="planning">📋 Planning</SelectItem>
              <SelectItem value="active">🚧 Active</SelectItem>
              <SelectItem value="on_hold">⏸️ On Hold</SelectItem>
              <SelectItem value="completed">✅ Completed</SelectItem>
              <SelectItem value="cancelled">❌ Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="budget">Budget (IDR)</Label>
          <Input
            id="budget"
            type="number"
            value={formData.budget || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateProjectInput) => ({
                ...prev,
                budget: e.target.value ? parseFloat(e.target.value) : null
              }))
            }
            placeholder="e.g., 5000000000"
            min="0"
            step="1000000"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
          {isLoading ? '⏳ Creating...' : '🏗️ Create Project'}
        </Button>
      </div>
    </form>
  );
}

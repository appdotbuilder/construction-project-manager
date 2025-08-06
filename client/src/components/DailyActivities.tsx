
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Camera, Plus, Activity, Users, Package, Cloud } from 'lucide-react';
import { format } from 'date-fns';
import { trpc } from '@/utils/trpc';
import type { CreateDailyActivityInput, DailyActivity } from '../../../server/src/schema';

interface DailyActivitiesProps {
  projectId: number;
}

export function DailyActivities({ projectId }: DailyActivitiesProps) {
  const [activities, setActivities] = useState<DailyActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [formData, setFormData] = useState<CreateDailyActivityInput>({
    project_id: projectId,
    date: new Date(),
    work_description: '',
    worker_count: 0,
    materials_used: null,
    progress_percentage: 0,
    weather: null,
    k3_notes: null,
    photo_urls: []
  });

  const loadActivities = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getDailyActivities.query({ projectId });
      setActivities(result);
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;

    setIsSubmitting(true);
    try {
      const activityData: CreateDailyActivityInput = {
        ...formData,
        date: selectedDate,
        project_id: projectId
      };

      const response = await trpc.createDailyActivity.mutate(activityData);
      setActivities((prev: DailyActivity[]) => [response, ...prev]);
      
      // Reset form
      setFormData({
        project_id: projectId,
        date: new Date(),
        work_description: '',
        worker_count: 0,
        materials_used: null,
        progress_percentage: 0,
        weather: null,
        k3_notes: null,
        photo_urls: []
      });
      setSelectedDate(new Date());
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Failed to create activity:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getWeatherIcon = (weather: string | null) => {
    if (!weather) return '☀️';
    const w = weather.toLowerCase();
    if (w.includes('rain') || w.includes('hujan')) return '🌧️';
    if (w.includes('cloud') || w.includes('mendung')) return '☁️';
    if (w.includes('sun') || w.includes('cerah')) return '☀️';
    return '☀️';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">📋 Daily Activities</h2>
          <p className="text-gray-600">Log and track daily construction activities</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Log Activity
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>📝 Log Daily Activity</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Activity Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, 'dd/MM/yyyy') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                      disabled={(date) => date > new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="work_description">Work Description *</Label>
                <Textarea
                  id="work_description"
                  value={formData.work_description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreateDailyActivityInput) => ({
                      ...prev,
                      work_description: e.target.value
                    }))
                  }
                  placeholder="Detail pekerjaan yang dilakukan hari ini..."
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="worker_count">Number of Workers *</Label>
                  <Input
                    id="worker_count"
                    type="number"
                    value={formData.worker_count}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateDailyActivityInput) => ({
                        ...prev,
                        worker_count: parseInt(e.target.value) || 0
                      }))
                    }
                    min="0"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="progress_percentage">Progress Percentage *</Label>
                  <div className="space-y-2">
                    <Input
                      id="progress_percentage"
                      type="number"
                      value={formData.progress_percentage}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateDailyActivityInput) => ({
                          ...prev,
                          progress_percentage: parseFloat(e.target.value) || 0
                        }))
                      }
                      min="0"
                      max="100"
                      step="0.1"
                      required
                    />
                    <Progress value={formData.progress_percentage} className="h-2" />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="materials_used">Materials Used</Label>
                <Textarea
                  id="materials_used"
                  value={formData.materials_used || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreateDailyActivityInput) => ({
                      ...prev,
                      materials_used: e.target.value || null
                    }))
                  }
                  placeholder="Bahan-bahan yang digunakan (opsional)"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Weather Conditions</Label>
                  <Select
                    value={formData.weather || ''}
                    onValueChange={(value: string) =>
                      setFormData((prev: CreateDailyActivityInput) => ({
                        ...prev,
                        weather: value || null
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select weather" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sunny">☀️ Cerah</SelectItem>
                      <SelectItem value="cloudy">☁️ Mendung</SelectItem>
                      <SelectItem value="rainy">🌧️ Hujan</SelectItem>
                      <SelectItem value="stormy">⛈️ Badai</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>📸 Photo Upload</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      Click to uploa or take photo
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="k3_notes">K3 Notes (Safety)</Label>
                <Textarea
                  id="k3_notes"
                  value={formData.k3_notes || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreateDailyActivityInput) => ({
                      ...prev,
                      k3_notes: e.target.value || null
                    }))
                  }
                  placeholder="Catatan keselamatan kerja (opsional)"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                  {isSubmitting ? '⏳ Logging...' : '📝 Log Activity'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Activities List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Activity className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Activities Logged
            </h3>
            <p className="text-gray-600 mb-4">
              Start logging daily construction activities to track project progress.
            </p>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Log First Activity
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {activities.map((activity: DailyActivity) => (
            <Card key={activity.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      📋 Activity - {activity.date.toLocaleDateString('id-ID')}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {activity.worker_count} workers
                      </span>
                      {activity.weather && (
                        <span className="flex items-center gap-1">
                          <Cloud className="h-4 w-4" />
                          {getWeatherIcon(activity.weather)} {activity.weather}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {activity.progress_percentage}%
                    </div>
                    <div className="text-xs text-gray-500">Progress</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Work Description:</h4>
                  <p className="text-gray-700">{activity.work_description}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Progress</span>
                      <span className="text-sm font-medium">{activity.progress_percentage}%</span>
                    </div>
                    <Progress value={activity.progress_percentage} className="h-2" />
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span>{activity.worker_count} workers</span>
                    </div>
                    {activity.materials_used && (
                      <div className="flex items-center gap-1">
                        <Package className="h-4 w-4 text-green-600" />
                        <span>Materials used</span>
                      </div>
                    )}
                  </div>
                </div>

                {activity.materials_used && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Materials Used:</h4>
                    <p className="text-gray-700 text-sm">{activity.materials_used}</p>
                  </div>
                )}

                {activity.k3_notes && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      ⚠️ K3 Safety Notes:
                    </h4>
                    <p className="text-gray-700 text-sm bg-yellow-50 p-3 rounded-lg">
                      {activity.k3_notes}
                    </p>
                  </div>
                )}

                <div className="text-xs text-gray-500 border-t pt-3">
                  Logged on: {activity.created_at.toLocaleDateString('id-ID')} at {activity.created_at.toLocaleTimeString('id-ID')}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}


import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon, Users, Clock, MapPin, Plus, Video, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { trpc } from '@/utils/trpc';
import type { CreateMeetingInput, Meeting, MeetingStatus } from '../../../server/src/schema';

interface MeetingManagementProps {
  projectId: number;
}

// Project member interface for attendee management
interface ProjectMember {
  id: number;
  name: string;
  role: string;
}

export function MeetingManagement({ projectId }: MeetingManagementProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [formData, setFormData] = useState<CreateMeetingInput>({
    project_id: projectId,
    title: '',
    description: null,
    scheduled_at: new Date(),
    location: null,
    attendee_ids: []
  });

  const loadMeetings = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getMeetings.query({ projectId });
      setMeetings(result);
    } catch (error) {
      console.error('Failed to load meetings:', error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadMeetings();
  }, [loadMeetings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;

    setIsSubmitting(true);
    try {
      // Combine date and time
      const [hours, minutes] = selectedTime.split(':');
      const scheduledAt = new Date(selectedDate);
      scheduledAt.setHours(parseInt(hours), parseInt(minutes));

      const meetingData: CreateMeetingInput = {
        ...formData,
        scheduled_at: scheduledAt,
        project_id: projectId
      };

      const response = await trpc.createMeeting.mutate(meetingData);
      setMeetings((prev: Meeting[]) => [response, ...prev]);
      
      // Reset form
      setFormData({
        project_id: projectId,
        title: '',
        description: null,
        scheduled_at: new Date(),
        location: null,
        attendee_ids: []
      });
      setSelectedDate(undefined);
      setSelectedTime('09:00');
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Failed to create meeting:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: MeetingStatus) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'ongoing': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMeetingTypeIcon = (location: string | null) => {
    if (!location) return <Users className="h-4 w-4" />;
    const loc = location.toLowerCase();
    if (loc.includes('zoom') || loc.includes('teams') || loc.includes('meet')) {
      return <Video className="h-4 w-4" />;
    }
    if (loc.includes('phone') || loc.includes('call')) {
      return <Phone className="h-4 w-4" />;
    }
    return <MapPin className="h-4 w-4" />;
  };

  // Sample project members - in real app this would come from project member API
  const availableAttendees: ProjectMember[] = [
    { id: 1, name: 'John Doe', role: 'Project Manager' },
    { id: 2, name: 'Jane Smith', role: 'Architect' },
    { id: 3, name: 'Bob Wilson', role: 'Contractor' },
    { id: 4, name: 'Alice Brown', role: 'QS' },
    { id: 5, name: 'Charlie Davis', role: 'MK' }
  ];

  const toggleAttendee = (attendeeId: number) => {
    setFormData((prev: CreateMeetingInput) => ({
      ...prev,
      attendee_ids: prev.attendee_ids.includes(attendeeId)
        ? prev.attendee_ids.filter((id: number) => id !== attendeeId)
        : [...prev.attendee_ids, attendeeId]
    }));
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 7; hour <= 18; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < 18) {
        slots.push(`${hour.toString().padStart(2, '0')}:30`);
      }
    }
    return slots;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">👥 Meeting Management</h2>
          <p className="text-gray-600">Schedule and manage project meetings</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Schedule Meeting
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>📅 Schedule New Meeting</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Meeting Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateMeetingInput) => ({
                      ...prev,
                      title: e.target.value
                    }))
                  }
                  placeholder="e.g., Weekly Progress Meeting"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreateMeetingInput) => ({
                      ...prev,
                      description: e.target.value || null
                    }))
                  }
                  placeholder="Meeting agenda and topics..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Meeting Date *</Label>
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
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>Meeting Time *</Label>
                  <Select value={selectedTime} onValueChange={setSelectedTime}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {generateTimeSlots().map((time) => (
                        <SelectItem key={time} value={time}>
                          <Clock className="h-4 w-4 mr-2 inline" />
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="location">Location/Platform</Label>
                <Input
                  id="location"
                  value={formData.location || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateMeetingInput) => ({
                      ...prev,
                      location: e.target.value || null
                    }))
                  }
                  placeholder="e.g., Site Office, Zoom Meeting Room, Teams"
                />
              </div>

              <div>
                <Label className="text-base font-medium">Meeting Attendees</Label>
                <p className="text-sm text-gray-600 mb-3">
                  Select project members to invite to this meeting
                </p>
                <div className="space-y-2 max-h-32 overflow-y-auto border rounded-lg p-3">
                  {availableAttendees.map((attendee: ProjectMember) => (
                    <div key={attendee.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`attendee-${attendee.id}`}
                        checked={formData.attendee_ids.includes(attendee.id)}
                        onCheckedChange={() => toggleAttendee(attendee.id)}
                      />
                      <Label
                        htmlFor={`attendee-${attendee.id}`}
                        className="text-sm flex-1 cursor-pointer"
                      >
                        <span className="font-medium">{attendee.name}</span>
                        <span className="text-gray-500 ml-2">({attendee.role})</span>
                      </Label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {formData.attendee_ids.length} attendees selected
                </p>
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
                  {isSubmitting ? '⏳ Scheduling...' : '📅 Schedule Meeting'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Meetings List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-16 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : meetings.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Meetings Scheduled
            </h3>
            <p className="text-gray-600 mb-4">
              Schedule your first project meeting to coordinate with your team.
            </p>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Schedule First Meeting
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {meetings.map((meeting: Meeting) => (
            <Card key={meeting.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {getMeetingTypeIcon(meeting.location)}
                      {meeting.title}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="h-4 w-4" />
                        {meeting.scheduled_at.toLocaleDateString('id-ID')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {meeting.scheduled_at.toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {meeting.location && (
                        <span className="flex items-center gap-1">
                          {getMeetingTypeIcon(meeting.location)}
                          {meeting.location}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  
                  <Badge className={getStatusColor(meeting.status)}>
                    {meeting.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {meeting.description && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Agenda:</h4>
                    <p className="text-gray-700 text-sm">{meeting.description}</p>
                  </div>
                )}

                {meeting.meeting_notes && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Meeting Notes:</h4>
                    <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg">
                      {meeting.meeting_notes}
                    </p>
                  </div>
                )}

                <div className="flex justify-between items-center text-sm border-t pt-3">
                  <div className="text-gray-600">
                    Created: {meeting.created_at.toLocaleDateString('id-ID')}
                  </div>
                  
                  <div className="flex gap-2">
                    {meeting.status === 'scheduled' && (
                      <>
                        <Button size="sm" variant="outline">
                          ✏️ Edit
                        </Button>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          🚀 Start Meeting
                        </Button>
                      </>
                    )}
                    
                    {meeting.status === 'ongoing' && (
                      <Button size="sm" className="bg-red-600 hover:bg-red-700">
                        ✅ End Meeting
                      </Button>
                    )}

                    {meeting.status === 'completed' && (
                      <Button size="sm" variant="outline">
                        📋 View Minutes
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

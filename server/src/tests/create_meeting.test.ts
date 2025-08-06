
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  projectsTable, 
  usersTable, 
  meetingsTable, 
  meetingAttendeesTable 
} from '../db/schema';
import { type CreateMeetingInput } from '../schema';
import { createMeeting } from '../handlers/create_meeting';
import { eq } from 'drizzle-orm';

describe('createMeeting', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a meeting', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();

    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        location: 'Test Location',
        start_date: new Date(),
        status: 'active'
      })
      .returning()
      .execute();

    const attendeeResult = await db.insert(usersTable)
      .values({
        email: 'attendee@example.com',
        name: 'Attendee User'
      })
      .returning()
      .execute();

    const testInput: CreateMeetingInput = {
      project_id: projectResult[0].id,
      title: 'Project Kickoff Meeting',
      description: 'Initial project meeting',
      scheduled_at: new Date('2024-01-15T10:00:00Z'),
      location: 'Conference Room A',
      attendee_ids: [attendeeResult[0].id]
    };

    const result = await createMeeting(testInput, userResult[0].id);

    // Basic field validation
    expect(result.project_id).toEqual(projectResult[0].id);
    expect(result.title).toEqual('Project Kickoff Meeting');
    expect(result.description).toEqual('Initial project meeting');
    expect(result.scheduled_at).toEqual(new Date('2024-01-15T10:00:00Z'));
    expect(result.location).toEqual('Conference Room A');
    expect(result.status).toEqual('scheduled');
    expect(result.meeting_notes).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_by).toEqual(userResult[0].id);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save meeting to database', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        email: 'creator@example.com',
        name: 'Creator User'
      })
      .returning()
      .execute();

    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        location: 'Test Location',
        start_date: new Date(),
        status: 'active'
      })
      .returning()
      .execute();

    const testInput: CreateMeetingInput = {
      project_id: projectResult[0].id,
      title: 'Test Meeting',
      description: 'A test meeting',
      scheduled_at: new Date('2024-01-15T14:00:00Z'),
      location: 'Meeting Room B',
      attendee_ids: []
    };

    const result = await createMeeting(testInput, userResult[0].id);

    // Verify meeting was saved
    const meetings = await db.select()
      .from(meetingsTable)
      .where(eq(meetingsTable.id, result.id))
      .execute();

    expect(meetings).toHaveLength(1);
    expect(meetings[0].project_id).toEqual(projectResult[0].id);
    expect(meetings[0].title).toEqual('Test Meeting');
    expect(meetings[0].description).toEqual('A test meeting');
    expect(meetings[0].scheduled_at).toEqual(new Date('2024-01-15T14:00:00Z'));
    expect(meetings[0].location).toEqual('Meeting Room B');
    expect(meetings[0].status).toEqual('scheduled');
    expect(meetings[0].created_by).toEqual(userResult[0].id);
    expect(meetings[0].created_at).toBeInstanceOf(Date);
  });

  it('should create meeting attendees', async () => {
    // Create prerequisite data
    const creatorResult = await db.insert(usersTable)
      .values({
        email: 'creator@example.com',
        name: 'Creator User'
      })
      .returning()
      .execute();

    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        location: 'Test Location',
        start_date: new Date(),
        status: 'active'
      })
      .returning()
      .execute();

    const attendeeResults = await db.insert(usersTable)
      .values([
        { email: 'attendee1@example.com', name: 'Attendee 1' },
        { email: 'attendee2@example.com', name: 'Attendee 2' }
      ])
      .returning()
      .execute();

    const testInput: CreateMeetingInput = {
      project_id: projectResult[0].id,
      title: 'Team Meeting',
      description: null,
      scheduled_at: new Date('2024-01-20T09:00:00Z'),
      location: null,
      attendee_ids: [attendeeResults[0].id, attendeeResults[1].id]
    };

    const result = await createMeeting(testInput, creatorResult[0].id);

    // Verify attendees were created
    const attendees = await db.select()
      .from(meetingAttendeesTable)
      .where(eq(meetingAttendeesTable.meeting_id, result.id))
      .execute();

    expect(attendees).toHaveLength(2);
    expect(attendees.map(a => a.user_id).sort()).toEqual([attendeeResults[0].id, attendeeResults[1].id].sort());
    expect(attendees[0].attended).toBe(false);
    expect(attendees[1].attended).toBe(false);
    expect(attendees[0].created_at).toBeInstanceOf(Date);
    expect(attendees[1].created_at).toBeInstanceOf(Date);
  });

  it('should handle empty attendee list', async () => {
    // Create prerequisite data
    const creatorResult = await db.insert(usersTable)
      .values({
        email: 'creator@example.com',
        name: 'Creator User'
      })
      .returning()
      .execute();

    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        location: 'Test Location',
        start_date: new Date(),
        status: 'active'
      })
      .returning()
      .execute();

    const testInput: CreateMeetingInput = {
      project_id: projectResult[0].id,
      title: 'Solo Meeting',
      description: 'Meeting with no attendees',
      scheduled_at: new Date('2024-01-25T16:00:00Z'),
      location: 'Private Office',
      attendee_ids: []
    };

    const result = await createMeeting(testInput, creatorResult[0].id);

    // Verify no attendees were created
    const attendees = await db.select()
      .from(meetingAttendeesTable)
      .where(eq(meetingAttendeesTable.meeting_id, result.id))
      .execute();

    expect(attendees).toHaveLength(0);
    expect(result.title).toEqual('Solo Meeting');
    expect(result.description).toEqual('Meeting with no attendees');
  });

  it('should handle nullable fields correctly', async () => {
    // Create prerequisite data
    const creatorResult = await db.insert(usersTable)
      .values({
        email: 'creator@example.com',
        name: 'Creator User'
      })
      .returning()
      .execute();

    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        location: 'Test Location',
        start_date: new Date(),
        status: 'active'
      })
      .returning()
      .execute();

    const testInput: CreateMeetingInput = {
      project_id: projectResult[0].id,
      title: 'Minimal Meeting',
      description: null,
      scheduled_at: new Date('2024-02-01T11:00:00Z'),
      location: null,
      attendee_ids: []
    };

    const result = await createMeeting(testInput, creatorResult[0].id);

    expect(result.description).toBeNull();
    expect(result.location).toBeNull();
    expect(result.meeting_notes).toBeNull();
    expect(result.title).toEqual('Minimal Meeting');
    expect(result.status).toEqual('scheduled');
  });
});

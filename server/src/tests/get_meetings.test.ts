
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, projectsTable, meetingsTable } from '../db/schema';
import { getMeetings } from '../handlers/get_meetings';

describe('getMeetings', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should fetch all meetings for a project', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test project
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        location: 'Test Location',
        start_date: new Date(),
        status: 'planning'
      })
      .returning()
      .execute();
    const projectId = projectResult[0].id;

    // Create test meetings
    const meeting1 = {
      project_id: projectId,
      title: 'Kickoff Meeting',
      description: 'Project kickoff discussion',
      scheduled_at: new Date('2024-01-15T10:00:00Z'),
      location: 'Conference Room A',
      status: 'scheduled' as const,
      created_by: userId
    };

    const meeting2 = {
      project_id: projectId,
      title: 'Progress Review',
      description: null,
      scheduled_at: new Date('2024-01-20T14:00:00Z'),
      location: null,
      status: 'completed' as const,
      meeting_notes: 'All tasks on track',
      created_by: userId
    };

    await db.insert(meetingsTable)
      .values([meeting1, meeting2])
      .execute();

    // Test the handler
    const result = await getMeetings(projectId);

    expect(result).toHaveLength(2);
    
    // Verify first meeting
    const kickoffMeeting = result.find(m => m.title === 'Kickoff Meeting');
    expect(kickoffMeeting).toBeDefined();
    expect(kickoffMeeting!.description).toEqual('Project kickoff discussion');
    expect(kickoffMeeting!.scheduled_at).toBeInstanceOf(Date);
    expect(kickoffMeeting!.location).toEqual('Conference Room A');
    expect(kickoffMeeting!.status).toEqual('scheduled');
    expect(kickoffMeeting!.created_by).toEqual(userId);
    expect(kickoffMeeting!.created_at).toBeInstanceOf(Date);

    // Verify second meeting
    const reviewMeeting = result.find(m => m.title === 'Progress Review');
    expect(reviewMeeting).toBeDefined();
    expect(reviewMeeting!.description).toBeNull();
    expect(reviewMeeting!.location).toBeNull();
    expect(reviewMeeting!.status).toEqual('completed');
    expect(reviewMeeting!.meeting_notes).toEqual('All tasks on track');
  });

  it('should return empty array for project with no meetings', async () => {
    // Create test project without meetings
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Empty Project',
        location: 'Test Location',
        start_date: new Date(),
        status: 'planning'
      })
      .returning()
      .execute();
    const projectId = projectResult[0].id;

    const result = await getMeetings(projectId);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should only return meetings for specified project', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create two test projects
    const projectResults = await db.insert(projectsTable)
      .values([
        {
          name: 'Project 1',
          location: 'Location 1',
          start_date: new Date(),
          status: 'planning'
        },
        {
          name: 'Project 2',
          location: 'Location 2',
          start_date: new Date(),
          status: 'active'
        }
      ])
      .returning()
      .execute();

    const project1Id = projectResults[0].id;
    const project2Id = projectResults[1].id;

    // Create meetings for both projects
    await db.insert(meetingsTable)
      .values([
        {
          project_id: project1Id,
          title: 'Project 1 Meeting',
          scheduled_at: new Date(),
          status: 'scheduled',
          created_by: userId
        },
        {
          project_id: project1Id,
          title: 'Another Project 1 Meeting',
          scheduled_at: new Date(),
          status: 'completed',
          created_by: userId
        },
        {
          project_id: project2Id,
          title: 'Project 2 Meeting',
          scheduled_at: new Date(),
          status: 'scheduled',
          created_by: userId
        }
      ])
      .execute();

    // Test filtering for project 1
    const project1Meetings = await getMeetings(project1Id);
    expect(project1Meetings).toHaveLength(2);
    expect(project1Meetings.every(m => m.project_id === project1Id)).toBe(true);
    expect(project1Meetings.map(m => m.title)).toContain('Project 1 Meeting');
    expect(project1Meetings.map(m => m.title)).toContain('Another Project 1 Meeting');

    // Test filtering for project 2
    const project2Meetings = await getMeetings(project2Id);
    expect(project2Meetings).toHaveLength(1);
    expect(project2Meetings[0].project_id).toEqual(project2Id);
    expect(project2Meetings[0].title).toEqual('Project 2 Meeting');
  });

  it('should handle meetings with all status types', async () => {
    // Create test user and project
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        location: 'Test Location',
        start_date: new Date(),
        status: 'planning'
      })
      .returning()
      .execute();
    const projectId = projectResult[0].id;

    // Create meetings with different statuses
    await db.insert(meetingsTable)
      .values([
        {
          project_id: projectId,
          title: 'Scheduled Meeting',
          scheduled_at: new Date(),
          status: 'scheduled',
          created_by: userId
        },
        {
          project_id: projectId,
          title: 'Ongoing Meeting',
          scheduled_at: new Date(),
          status: 'ongoing',
          created_by: userId
        },
        {
          project_id: projectId,
          title: 'Completed Meeting',
          scheduled_at: new Date(),
          status: 'completed',
          created_by: userId
        },
        {
          project_id: projectId,
          title: 'Cancelled Meeting',
          scheduled_at: new Date(),
          status: 'cancelled',
          created_by: userId
        }
      ])
      .execute();

    const result = await getMeetings(projectId);

    expect(result).toHaveLength(4);
    
    const statuses = result.map(m => m.status).sort();
    expect(statuses).toEqual(['cancelled', 'completed', 'ongoing', 'scheduled']);
  });

  it('should return meetings with correct data types', async () => {
    // Create test user and project
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        location: 'Test Location',
        start_date: new Date(),
        status: 'planning'
      })
      .returning()
      .execute();
    const projectId = projectResult[0].id;

    await db.insert(meetingsTable)
      .values({
        project_id: projectId,
        title: 'Type Test Meeting',
        scheduled_at: new Date('2024-01-15T10:00:00Z'),
        status: 'scheduled',
        created_by: userId
      })
      .execute();

    const result = await getMeetings(projectId);
    const meeting = result[0];

    // Verify data types
    expect(typeof meeting.id).toBe('number');
    expect(typeof meeting.project_id).toBe('number');
    expect(typeof meeting.title).toBe('string');
    expect(meeting.scheduled_at).toBeInstanceOf(Date);
    expect(typeof meeting.status).toBe('string');
    expect(typeof meeting.created_by).toBe('number');
    expect(meeting.created_at).toBeInstanceOf(Date);
  });
});

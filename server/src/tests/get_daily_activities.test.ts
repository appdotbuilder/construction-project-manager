
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, projectsTable, dailyActivitiesTable } from '../db/schema';
import { getDailyActivities } from '../handlers/get_daily_activities';

// Test data
const testUser = {
  email: 'test@example.com',
  name: 'Test User',
  phone: '+1234567890',
  avatar_url: null
};

const testProject = {
  name: 'Test Project',
  description: 'A test project',
  location: 'Test Location',
  start_date: new Date('2024-01-01'),
  end_date: new Date('2024-12-31'),
  status: 'active' as const,
  budget: '100000.00'
};

const testActivity = {
  date: new Date('2024-01-15'),
  work_description: 'Foundation work',
  worker_count: 10,
  materials_used: 'Concrete, Steel bars',
  progress_percentage: '15.50',
  weather: 'Sunny',
  k3_notes: 'All safety protocols followed'
};

describe('getDailyActivities', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no activities exist', async () => {
    // Create user and project first
    const [user] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const [project] = await db.insert(projectsTable)
      .values(testProject)
      .returning()
      .execute();

    const result = await getDailyActivities(project.id);

    expect(result).toEqual([]);
  });

  it('should return daily activities for a project', async () => {
    // Create user and project first
    const [user] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const [project] = await db.insert(projectsTable)
      .values(testProject)
      .returning()
      .execute();

    // Create activity
    const [activity] = await db.insert(dailyActivitiesTable)
      .values({
        ...testActivity,
        project_id: project.id,
        user_id: user.id
      })
      .returning()
      .execute();

    const result = await getDailyActivities(project.id);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(activity.id);
    expect(result[0].project_id).toBe(project.id);
    expect(result[0].user_id).toBe(user.id);
    expect(result[0].work_description).toBe('Foundation work');
    expect(result[0].worker_count).toBe(10);
    expect(result[0].materials_used).toBe('Concrete, Steel bars');
    expect(result[0].progress_percentage).toBe(15.5);
    expect(typeof result[0].progress_percentage).toBe('number');
    expect(result[0].weather).toBe('Sunny');
    expect(result[0].k3_notes).toBe('All safety protocols followed');
    expect(result[0].date).toBeInstanceOf(Date);
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should return multiple activities for a project', async () => {
    // Create user and project first
    const [user] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const [project] = await db.insert(projectsTable)
      .values(testProject)
      .returning()
      .execute();

    // Create multiple activities
    const activities = [
      {
        ...testActivity,
        project_id: project.id,
        user_id: user.id,
        date: new Date('2024-01-15'),
        work_description: 'Foundation work',
        progress_percentage: '15.50'
      },
      {
        ...testActivity,
        project_id: project.id,
        user_id: user.id,
        date: new Date('2024-01-16'),
        work_description: 'Column work',
        progress_percentage: '25.75'
      }
    ];

    await db.insert(dailyActivitiesTable)
      .values(activities)
      .execute();

    const result = await getDailyActivities(project.id);

    expect(result).toHaveLength(2);
    
    // Verify numeric conversion
    expect(typeof result[0].progress_percentage).toBe('number');
    expect(typeof result[1].progress_percentage).toBe('number');
    
    // Check specific values
    const foundationWork = result.find(a => a.work_description === 'Foundation work');
    const columnWork = result.find(a => a.work_description === 'Column work');
    
    expect(foundationWork?.progress_percentage).toBe(15.5);
    expect(columnWork?.progress_percentage).toBe(25.75);
  });

  it('should only return activities for the specified project', async () => {
    // Create user first
    const [user] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Create two projects
    const [project1] = await db.insert(projectsTable)
      .values(testProject)
      .returning()
      .execute();

    const [project2] = await db.insert(projectsTable)
      .values({
        ...testProject,
        name: 'Another Project'
      })
      .returning()
      .execute();

    // Create activities for both projects
    await db.insert(dailyActivitiesTable)
      .values([
        {
          ...testActivity,
          project_id: project1.id,
          user_id: user.id,
          work_description: 'Project 1 activity'
        },
        {
          ...testActivity,
          project_id: project2.id,
          user_id: user.id,
          work_description: 'Project 2 activity'
        }
      ])
      .execute();

    const result = await getDailyActivities(project1.id);

    expect(result).toHaveLength(1);
    expect(result[0].project_id).toBe(project1.id);
    expect(result[0].work_description).toBe('Project 1 activity');
  });
});

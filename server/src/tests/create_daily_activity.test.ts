
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { dailyActivitiesTable, activityPhotosTable, projectsTable, usersTable } from '../db/schema';
import { type CreateDailyActivityInput } from '../schema';
import { createDailyActivity } from '../handlers/create_daily_activity';
import { eq } from 'drizzle-orm';

describe('createDailyActivity', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testProjectId: number;
  let testUserId: number;

  const createTestData = async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        phone: '123456789',
        avatar_url: null
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create test project
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: 'A test construction project',
        location: 'Jakarta',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        status: 'active',
        budget: '1000000.00'
      })
      .returning()
      .execute();
    testProjectId = projectResult[0].id;
  };

  const testInput: CreateDailyActivityInput = {
    project_id: 0, // Will be set in tests
    date: new Date('2024-01-15'),
    work_description: 'Foundation excavation and concrete pouring',
    worker_count: 12,
    materials_used: 'Concrete mix, steel rebar, formwork',
    progress_percentage: 25.5,
    weather: 'Sunny, 28°C',
    k3_notes: 'All workers wearing safety helmets and boots'
  };

  it('should create a daily activity without photos', async () => {
    await createTestData();
    const input = { ...testInput, project_id: testProjectId };

    const result = await createDailyActivity(input, testUserId);

    // Basic field validation
    expect(result.project_id).toEqual(testProjectId);
    expect(result.user_id).toEqual(testUserId);
    expect(result.date).toEqual(input.date);
    expect(result.work_description).toEqual('Foundation excavation and concrete pouring');
    expect(result.worker_count).toEqual(12);
    expect(result.materials_used).toEqual(input.materials_used);
    expect(result.progress_percentage).toEqual(25.5);
    expect(typeof result.progress_percentage).toBe('number');
    expect(result.weather).toEqual('Sunny, 28°C');
    expect(result.k3_notes).toEqual(input.k3_notes);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save daily activity to database', async () => {
    await createTestData();
    const input = { ...testInput, project_id: testProjectId };

    const result = await createDailyActivity(input, testUserId);

    // Query using proper drizzle syntax
    const activities = await db.select()
      .from(dailyActivitiesTable)
      .where(eq(dailyActivitiesTable.id, result.id))
      .execute();

    expect(activities).toHaveLength(1);
    expect(activities[0].work_description).toEqual('Foundation excavation and concrete pouring');
    expect(activities[0].worker_count).toEqual(12);
    expect(parseFloat(activities[0].progress_percentage)).toEqual(25.5);
    expect(activities[0].created_at).toBeInstanceOf(Date);
  });

  it('should create activity with photos', async () => {
    await createTestData();
    const input = {
      ...testInput,
      project_id: testProjectId,
      photo_urls: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg']
    };

    const result = await createDailyActivity(input, testUserId);

    // Check photos were created
    const photos = await db.select()
      .from(activityPhotosTable)
      .where(eq(activityPhotosTable.activity_id, result.id))
      .execute();

    expect(photos).toHaveLength(2);
    expect(photos[0].photo_url).toEqual('https://example.com/photo1.jpg');
    expect(photos[1].photo_url).toEqual('https://example.com/photo2.jpg');
    expect(photos[0].caption).toBeNull();
    expect(photos[1].caption).toBeNull();
  });

  it('should handle nullable fields correctly', async () => {
    await createTestData();
    const input = {
      project_id: testProjectId,
      date: new Date('2024-01-15'),
      work_description: 'Basic work description',
      worker_count: 5,
      materials_used: null,
      progress_percentage: 10.0,
      weather: null,
      k3_notes: null
    };

    const result = await createDailyActivity(input, testUserId);

    expect(result.materials_used).toBeNull();
    expect(result.weather).toBeNull();
    expect(result.k3_notes).toBeNull();
    expect(result.progress_percentage).toEqual(10.0);
  });

  it('should throw error for non-existent project', async () => {
    await createTestData();
    const input = { ...testInput, project_id: 99999 };

    expect(createDailyActivity(input, testUserId)).rejects.toThrow(/project.*not found/i);
  });

  it('should throw error for non-existent user', async () => {
    await createTestData();
    const input = { ...testInput, project_id: testProjectId };

    expect(createDailyActivity(input, 99999)).rejects.toThrow(/user.*not found/i);
  });

  it('should handle progress percentage boundaries', async () => {
    await createTestData();
    
    // Test minimum boundary
    const minInput = { ...testInput, project_id: testProjectId, progress_percentage: 0.0 };
    const minResult = await createDailyActivity(minInput, testUserId);
    expect(minResult.progress_percentage).toEqual(0.0);

    // Test maximum boundary
    const maxInput = { ...testInput, project_id: testProjectId, progress_percentage: 100.0 };
    const maxResult = await createDailyActivity(maxInput, testUserId);
    expect(maxResult.progress_percentage).toEqual(100.0);
  });
});

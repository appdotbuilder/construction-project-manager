
import { db } from '../db';
import { dailyActivitiesTable, activityPhotosTable, projectsTable, usersTable } from '../db/schema';
import { type CreateDailyActivityInput, type DailyActivity } from '../schema';
import { eq } from 'drizzle-orm';

export const createDailyActivity = async (input: CreateDailyActivityInput, userId: number): Promise<DailyActivity> => {
  try {
    // Verify project exists
    const projects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, input.project_id))
      .execute();
    
    if (projects.length === 0) {
      throw new Error(`Project with id ${input.project_id} not found`);
    }

    // Verify user exists
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();
    
    if (users.length === 0) {
      throw new Error(`User with id ${userId} not found`);
    }

    // Insert daily activity record
    const result = await db.insert(dailyActivitiesTable)
      .values({
        project_id: input.project_id,
        user_id: userId,
        date: input.date,
        work_description: input.work_description,
        worker_count: input.worker_count,
        materials_used: input.materials_used,
        progress_percentage: input.progress_percentage.toString(), // Convert number to string for numeric column
        weather: input.weather,
        k3_notes: input.k3_notes
      })
      .returning()
      .execute();

    const activity = result[0];

    // Handle photo uploads if provided
    if (input.photo_urls && input.photo_urls.length > 0) {
      const photoValues = input.photo_urls.map(url => ({
        activity_id: activity.id,
        photo_url: url,
        caption: null
      }));

      await db.insert(activityPhotosTable)
        .values(photoValues)
        .execute();
    }

    // Convert numeric fields back to numbers before returning
    return {
      ...activity,
      progress_percentage: parseFloat(activity.progress_percentage) // Convert string back to number
    };
  } catch (error) {
    console.error('Daily activity creation failed:', error);
    throw error;
  }
};

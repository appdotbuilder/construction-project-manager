
import { db } from '../db';
import { dailyActivitiesTable } from '../db/schema';
import { type DailyActivity } from '../schema';
import { eq } from 'drizzle-orm';

export const getDailyActivities = async (projectId: number): Promise<DailyActivity[]> => {
  try {
    const results = await db.select()
      .from(dailyActivitiesTable)
      .where(eq(dailyActivitiesTable.project_id, projectId))
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(activity => ({
      ...activity,
      progress_percentage: parseFloat(activity.progress_percentage)
    }));
  } catch (error) {
    console.error('Failed to fetch daily activities:', error);
    throw error;
  }
};

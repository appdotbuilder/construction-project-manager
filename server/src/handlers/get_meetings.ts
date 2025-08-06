
import { db } from '../db';
import { meetingsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Meeting } from '../schema';

export const getMeetings = async (projectId: number): Promise<Meeting[]> => {
  try {
    const results = await db.select()
      .from(meetingsTable)
      .where(eq(meetingsTable.project_id, projectId))
      .execute();

    // Convert any numeric fields if needed (none in meetings table currently)
    return results.map(meeting => ({
      ...meeting,
      // All fields are already properly typed - no numeric conversions needed
    }));
  } catch (error) {
    console.error('Failed to fetch meetings:', error);
    throw error;
  }
};

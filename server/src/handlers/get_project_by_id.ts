
import { db } from '../db';
import { projectsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Project } from '../schema';

export const getProjectById = async (id: number): Promise<Project | null> => {
  try {
    const result = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, id))
      .execute();

    if (result.length === 0) {
      return null;
    }

    const project = result[0];
    return {
      ...project,
      budget: project.budget ? parseFloat(project.budget) : null
    };
  } catch (error) {
    console.error('Failed to get project by id:', error);
    throw error;
  }
};


import { db } from '../db';
import { projectsTable } from '../db/schema';
import { type Project } from '../schema';

export const getProjects = async (): Promise<Project[]> => {
  try {
    const results = await db.select()
      .from(projectsTable)
      .execute();

    // Convert numeric fields back to numbers
    return results.map(project => ({
      ...project,
      budget: project.budget ? parseFloat(project.budget) : null
    }));
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    throw error;
  }
};

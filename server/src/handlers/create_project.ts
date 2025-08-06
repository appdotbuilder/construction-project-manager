
import { db } from '../db';
import { projectsTable } from '../db/schema';
import { type CreateProjectInput, type Project } from '../schema';

export const createProject = async (input: CreateProjectInput): Promise<Project> => {
  try {
    // Insert project record
    const result = await db.insert(projectsTable)
      .values({
        name: input.name,
        description: input.description,
        location: input.location,
        start_date: input.start_date,
        end_date: input.end_date,
        status: input.status,
        budget: input.budget ? input.budget.toString() : null // Convert number to string for numeric column
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const project = result[0];
    return {
      ...project,
      budget: project.budget ? parseFloat(project.budget) : null // Convert string back to number
    };
  } catch (error) {
    console.error('Project creation failed:', error);
    throw error;
  }
};

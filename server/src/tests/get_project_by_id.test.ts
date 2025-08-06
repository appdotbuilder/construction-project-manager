
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { projectsTable } from '../db/schema';
import { getProjectById } from '../handlers/get_project_by_id';
import { type CreateProjectInput } from '../schema';

const testProject: CreateProjectInput = {
  name: 'Test Project',
  description: 'A test project description',
  location: 'Test Location',
  start_date: new Date('2024-01-01'),
  end_date: new Date('2024-12-31'),
  status: 'planning',
  budget: 150000.50
};

describe('getProjectById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return project by id', async () => {
    // Create test project
    const insertResult = await db.insert(projectsTable)
      .values({
        name: testProject.name,
        description: testProject.description,
        location: testProject.location,
        start_date: testProject.start_date,
        end_date: testProject.end_date,
        status: testProject.status,
        budget: testProject.budget?.toString()
      })
      .returning()
      .execute();

    const createdProject = insertResult[0];

    // Get project by id
    const result = await getProjectById(createdProject.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdProject.id);
    expect(result!.name).toEqual('Test Project');
    expect(result!.description).toEqual(testProject.description);
    expect(result!.location).toEqual('Test Location');
    expect(result!.start_date).toEqual(testProject.start_date);
    expect(result!.end_date).toEqual(testProject.end_date);
    expect(result!.status).toEqual('planning');
    expect(result!.budget).toEqual(150000.50);
    expect(typeof result!.budget).toEqual('number');
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent project', async () => {
    const result = await getProjectById(999);

    expect(result).toBeNull();
  });

  it('should handle project with null budget', async () => {
    // Create project with null budget
    const projectWithNullBudget = {
      ...testProject,
      budget: null
    };

    const insertResult = await db.insert(projectsTable)
      .values({
        name: projectWithNullBudget.name,
        description: projectWithNullBudget.description,
        location: projectWithNullBudget.location,
        start_date: projectWithNullBudget.start_date,
        end_date: projectWithNullBudget.end_date,
        status: projectWithNullBudget.status,
        budget: projectWithNullBudget.budget
      })
      .returning()
      .execute();

    const createdProject = insertResult[0];

    const result = await getProjectById(createdProject.id);

    expect(result).not.toBeNull();
    expect(result!.budget).toBeNull();
  });

  it('should handle project with null end_date', async () => {
    // Create project with null end_date
    const projectWithNullEndDate = {
      ...testProject,
      end_date: null
    };

    const insertResult = await db.insert(projectsTable)
      .values({
        name: projectWithNullEndDate.name,
        description: projectWithNullEndDate.description,
        location: projectWithNullEndDate.location,
        start_date: projectWithNullEndDate.start_date,
        end_date: projectWithNullEndDate.end_date,
        status: projectWithNullEndDate.status,
        budget: projectWithNullEndDate.budget?.toString()
      })
      .returning()
      .execute();

    const createdProject = insertResult[0];

    const result = await getProjectById(createdProject.id);

    expect(result).not.toBeNull();
    expect(result!.end_date).toBeNull();
  });
});

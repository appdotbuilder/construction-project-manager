
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { projectsTable } from '../db/schema';
import { type CreateProjectInput } from '../schema';
import { createProject } from '../handlers/create_project';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateProjectInput = {
  name: 'Test Construction Project',
  description: 'A comprehensive test project for construction management',
  location: 'Jakarta, Indonesia',
  start_date: new Date('2024-01-15'),
  end_date: new Date('2024-12-31'),
  status: 'planning',
  budget: 150000000.50
};

// Test input without optional fields
const minimalInput: CreateProjectInput = {
  name: 'Minimal Project',
  description: null,
  location: 'Bandung, Indonesia',
  start_date: new Date('2024-02-01'),
  end_date: null,
  status: 'active',
  budget: null
};

describe('createProject', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a project with all fields', async () => {
    const result = await createProject(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Construction Project');
    expect(result.description).toEqual(testInput.description);
    expect(result.location).toEqual('Jakarta, Indonesia');
    expect(result.start_date).toEqual(testInput.start_date);
    expect(result.end_date).toEqual(testInput.end_date);
    expect(result.status).toEqual('planning');
    expect(result.budget).toEqual(150000000.50);
    expect(typeof result.budget).toBe('number');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a project with minimal required fields', async () => {
    const result = await createProject(minimalInput);

    expect(result.name).toEqual('Minimal Project');
    expect(result.description).toBeNull();
    expect(result.location).toEqual('Bandung, Indonesia');
    expect(result.start_date).toEqual(minimalInput.start_date);
    expect(result.end_date).toBeNull();
    expect(result.status).toEqual('active');
    expect(result.budget).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save project to database', async () => {
    const result = await createProject(testInput);

    // Query using proper drizzle syntax
    const projects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, result.id))
      .execute();

    expect(projects).toHaveLength(1);
    expect(projects[0].name).toEqual('Test Construction Project');
    expect(projects[0].description).toEqual(testInput.description);
    expect(projects[0].location).toEqual('Jakarta, Indonesia');
    expect(projects[0].status).toEqual('planning');
    expect(parseFloat(projects[0].budget!)).toEqual(150000000.50);
    expect(projects[0].created_at).toBeInstanceOf(Date);
  });

  it('should save project with null budget correctly', async () => {
    const result = await createProject(minimalInput);

    const projects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, result.id))
      .execute();

    expect(projects).toHaveLength(1);
    expect(projects[0].budget).toBeNull();
    expect(result.budget).toBeNull();
  });

  it('should handle different project statuses', async () => {
    const statusInput: CreateProjectInput = {
      ...testInput,
      status: 'completed'
    };

    const result = await createProject(statusInput);

    expect(result.status).toEqual('completed');

    const projects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, result.id))
      .execute();

    expect(projects[0].status).toEqual('completed');
  });

  it('should handle date fields correctly', async () => {
    const result = await createProject(testInput);

    expect(result.start_date).toEqual(testInput.start_date);
    expect(result.end_date).toEqual(testInput.end_date);

    const projects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, result.id))
      .execute();

    expect(projects[0].start_date).toEqual(testInput.start_date);
    expect(projects[0].end_date).toEqual(testInput.end_date);
  });
});

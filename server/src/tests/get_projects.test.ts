
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { projectsTable } from '../db/schema';
import { getProjects } from '../handlers/get_projects';

describe('getProjects', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no projects exist', async () => {
    const result = await getProjects();

    expect(result).toEqual([]);
  });

  it('should return all projects', async () => {
    // Create test projects
    await db.insert(projectsTable).values([
      {
        name: 'Project Alpha',
        description: 'First test project',
        location: 'Jakarta',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-06-01'),
        status: 'active',
        budget: '100000.50'
      },
      {
        name: 'Project Beta',
        description: null,
        location: 'Surabaya',
        start_date: new Date('2024-02-01'),
        end_date: null,
        status: 'planning',
        budget: null
      }
    ]).execute();

    const result = await getProjects();

    expect(result).toHaveLength(2);
    
    // Check first project
    const project1 = result.find(p => p.name === 'Project Alpha');
    expect(project1).toBeDefined();
    expect(project1!.name).toEqual('Project Alpha');
    expect(project1!.description).toEqual('First test project');
    expect(project1!.location).toEqual('Jakarta');
    expect(project1!.status).toEqual('active');
    expect(project1!.budget).toEqual(100000.50);
    expect(typeof project1!.budget).toBe('number');
    expect(project1!.id).toBeDefined();
    expect(project1!.created_at).toBeInstanceOf(Date);

    // Check second project
    const project2 = result.find(p => p.name === 'Project Beta');
    expect(project2).toBeDefined();
    expect(project2!.name).toEqual('Project Beta');
    expect(project2!.description).toBeNull();
    expect(project2!.location).toEqual('Surabaya');
    expect(project2!.status).toEqual('planning');
    expect(project2!.budget).toBeNull();
    expect(project2!.end_date).toBeNull();
  });

  it('should handle projects with different statuses', async () => {
    // Create projects with all possible statuses
    await db.insert(projectsTable).values([
      {
        name: 'Planning Project',
        location: 'Jakarta',
        start_date: new Date('2024-01-01'),
        status: 'planning',
        budget: '50000.00'
      },
      {
        name: 'Active Project',
        location: 'Bandung',
        start_date: new Date('2024-01-01'),
        status: 'active',
        budget: '75000.25'
      },
      {
        name: 'Completed Project',
        location: 'Medan',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-03-01'),
        status: 'completed',
        budget: '120000.75'
      },
      {
        name: 'On Hold Project',
        location: 'Yogyakarta',
        start_date: new Date('2024-01-01'),
        status: 'on_hold',
        budget: '90000.00'
      },
      {
        name: 'Cancelled Project',
        location: 'Semarang',
        start_date: new Date('2024-01-01'),
        status: 'cancelled',
        budget: null
      }
    ]).execute();

    const result = await getProjects();

    expect(result).toHaveLength(5);

    // Verify all statuses are present
    const statuses = result.map(p => p.status).sort();
    expect(statuses).toEqual(['active', 'cancelled', 'completed', 'on_hold', 'planning']);

    // Verify budget conversions
    const projectsWithBudget = result.filter(p => p.budget !== null);
    projectsWithBudget.forEach(project => {
      expect(typeof project.budget).toBe('number');
    });

    const cancelledProject = result.find(p => p.status === 'cancelled');
    expect(cancelledProject!.budget).toBeNull();
  });

  it('should preserve date fields correctly', async () => {
    const startDate = new Date('2024-03-15T10:30:00Z');
    const endDate = new Date('2024-09-15T16:45:00Z');

    await db.insert(projectsTable).values({
      name: 'Date Test Project',
      location: 'Denpasar',
      start_date: startDate,
      end_date: endDate,
      status: 'active',
      budget: '250000.99'
    }).execute();

    const result = await getProjects();

    expect(result).toHaveLength(1);
    expect(result[0].start_date).toBeInstanceOf(Date);
    expect(result[0].end_date).toBeInstanceOf(Date);
    expect(result[0].created_at).toBeInstanceOf(Date);
    
    // Verify dates are preserved (accounting for timezone differences)
    expect(result[0].start_date.getTime()).toEqual(startDate.getTime());
    expect(result[0].end_date!.getTime()).toEqual(endDate.getTime());
  });
});

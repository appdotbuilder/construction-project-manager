
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, companiesTable, projectsTable, paymentApplicationsTable } from '../db/schema';
import { getPaymentApplications } from '../handlers/get_payment_applications';

describe('getPaymentApplications', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return payment applications for a project', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    const user = userResult[0];

    // Create test company
    const companyResult = await db.insert(companiesTable)
      .values({
        name: 'Test Company'
      })
      .returning()
      .execute();
    const company = companyResult[0];

    // Create test project
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        location: 'Test Location',
        start_date: new Date(),
        status: 'active'
      })
      .returning()
      .execute();
    const project = projectResult[0];

    // Create test payment application
    await db.insert(paymentApplicationsTable)
      .values({
        project_id: project.id,
        contractor_id: company.id,
        term_number: 1,
        amount: '15000.50',
        work_progress: '75.25',
        status: 'submitted',
        submitted_by: user.id,
        submitted_at: new Date()
      })
      .execute();

    const result = await getPaymentApplications(project.id);

    expect(result).toHaveLength(1);
    expect(result[0].project_id).toEqual(project.id);
    expect(result[0].contractor_id).toEqual(company.id);
    expect(result[0].term_number).toEqual(1);
    expect(result[0].amount).toEqual(15000.50);
    expect(typeof result[0].amount).toBe('number');
    expect(result[0].work_progress).toEqual(75.25);
    expect(typeof result[0].work_progress).toBe('number');
    expect(result[0].status).toEqual('submitted');
    expect(result[0].submitted_by).toEqual(user.id);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].submitted_at).toBeInstanceOf(Date);
  });

  it('should return empty array for project with no payment applications', async () => {
    // Create test project without payment applications
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Empty Project',
        location: 'Test Location',
        start_date: new Date(),
        status: 'active'
      })
      .returning()
      .execute();
    const project = projectResult[0];

    const result = await getPaymentApplications(project.id);

    expect(result).toHaveLength(0);
  });

  it('should return multiple payment applications for same project', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    const user = userResult[0];

    // Create test company
    const companyResult = await db.insert(companiesTable)
      .values({
        name: 'Test Company'
      })
      .returning()
      .execute();
    const company = companyResult[0];

    // Create test project
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        location: 'Test Location',
        start_date: new Date(),
        status: 'active'
      })
      .returning()
      .execute();
    const project = projectResult[0];

    // Create multiple payment applications
    await db.insert(paymentApplicationsTable)
      .values([
        {
          project_id: project.id,
          contractor_id: company.id,
          term_number: 1,
          amount: '10000.00',
          work_progress: '50.00',
          status: 'approved',
          submitted_by: user.id,
          submitted_at: new Date()
        },
        {
          project_id: project.id,
          contractor_id: company.id,
          term_number: 2,
          amount: '20000.75',
          work_progress: '85.50',
          status: 'draft',
          submitted_by: user.id
        }
      ])
      .execute();

    const result = await getPaymentApplications(project.id);

    expect(result).toHaveLength(2);
    expect(result[0].term_number).toEqual(1);
    expect(result[0].amount).toEqual(10000.00);
    expect(result[0].work_progress).toEqual(50.00);
    expect(result[0].status).toEqual('approved');
    expect(result[1].term_number).toEqual(2);
    expect(result[1].amount).toEqual(20000.75);
    expect(result[1].work_progress).toEqual(85.50);
    expect(result[1].status).toEqual('draft');
  });

  it('should only return payment applications for specified project', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    const user = userResult[0];

    // Create test company
    const companyResult = await db.insert(companiesTable)
      .values({
        name: 'Test Company'
      })
      .returning()
      .execute();
    const company = companyResult[0];

    // Create two test projects
    const projectResults = await db.insert(projectsTable)
      .values([
        {
          name: 'Project 1',
          location: 'Location 1',
          start_date: new Date(),
          status: 'active'
        },
        {
          name: 'Project 2',
          location: 'Location 2',
          start_date: new Date(),
          status: 'active'
        }
      ])
      .returning()
      .execute();
    const [project1, project2] = projectResults;

    // Create payment applications for both projects
    await db.insert(paymentApplicationsTable)
      .values([
        {
          project_id: project1.id,
          contractor_id: company.id,
          term_number: 1,
          amount: '5000.00',
          work_progress: '30.00',
          status: 'submitted',
          submitted_by: user.id
        },
        {
          project_id: project2.id,
          contractor_id: company.id,
          term_number: 1,
          amount: '7500.00',
          work_progress: '45.00',
          status: 'approved',
          submitted_by: user.id
        }
      ])
      .execute();

    const result = await getPaymentApplications(project1.id);

    expect(result).toHaveLength(1);
    expect(result[0].project_id).toEqual(project1.id);
    expect(result[0].amount).toEqual(5000.00);
    expect(result[0].status).toEqual('submitted');
  });
});

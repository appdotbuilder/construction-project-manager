
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  projectsTable, 
  usersTable, 
  companiesTable,
  dailyActivitiesTable,
  documentsTable,
  meetingsTable,
  projectMembersTable,
  paymentApplicationsTable
} from '../db/schema';
import { getProjectDashboard } from '../handlers/get_project_dashboard';

describe('getProjectDashboard', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty dashboard for non-existent project', async () => {
    const result = await getProjectDashboard(999);

    expect(result).toEqual({
      project_id: 999,
      total_activities: 0,
      recent_activities: 0,
      pending_approvals: 0,
      active_meetings: 0,
      overall_progress: 0,
      budget_utilization: 0,
      active_contractors: 0,
      k3_incidents: 0
    });
  });

  it('should return correct dashboard data for project with activities', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test company
    const companyResult = await db.insert(companiesTable)
      .values({
        name: 'Test Company'
      })
      .returning()
      .execute();
    const companyId = companyResult[0].id;

    // Create test project with budget
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        location: 'Test Location',
        start_date: new Date(),
        status: 'active',
        budget: '100000.00' // String for numeric column
      })
      .returning()
      .execute();
    const projectId = projectResult[0].id;

    // Create project member (contractor)
    await db.insert(projectMembersTable)
      .values({
        project_id: projectId,
        user_id: userId,
        company_id: companyId,
        role: 'main_contractor'
      })
      .execute();

    // Create daily activities
    const today = new Date();
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 10); // 10 days ago

    await db.insert(dailyActivitiesTable)
      .values([
        {
          project_id: projectId,
          user_id: userId,
          date: today,
          work_description: 'Recent work',
          worker_count: 5,
          progress_percentage: '50.00', // String for numeric column
          k3_notes: 'Safety incident noted'
        },
        {
          project_id: projectId,
          user_id: userId,
          date: oldDate,
          work_description: 'Old work',
          worker_count: 3,
          progress_percentage: '30.00' // String for numeric column
        }
      ])
      .execute();

    // Create pending document
    await db.insert(documentsTable)
      .values({
        project_id: projectId,
        title: 'Test Document',
        type: 'drawing',
        file_url: 'http://example.com/doc.pdf',
        version: '1.0',
        uploaded_by: userId,
        approval_status: 'pending'
      })
      .execute();

    // Create scheduled meeting
    await db.insert(meetingsTable)
      .values({
        project_id: projectId,
        title: 'Test Meeting',
        scheduled_at: new Date(),
        status: 'scheduled',
        created_by: userId
      })
      .execute();

    // Create approved payment application
    await db.insert(paymentApplicationsTable)
      .values({
        project_id: projectId,
        contractor_id: companyId,
        term_number: 1,
        amount: '25000.00', // String for numeric column
        work_progress: '25.00', // String for numeric column
        status: 'approved',
        submitted_by: userId
      })
      .execute();

    const result = await getProjectDashboard(projectId);

    expect(result.project_id).toBe(projectId);
    expect(result.total_activities).toBe(2);
    expect(result.recent_activities).toBe(1); // Only one activity within last 7 days
    expect(result.pending_approvals).toBe(1);
    expect(result.active_meetings).toBe(1);
    expect(result.overall_progress).toBe(40); // Average of 50% and 30%
    expect(result.budget_utilization).toBe(25); // 25000/100000 * 100
    expect(result.active_contractors).toBe(1);
    expect(result.k3_incidents).toBe(1); // One activity has k3_notes
  });

  it('should handle project with no budget correctly', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test company
    const companyResult = await db.insert(companiesTable)
      .values({
        name: 'Test Company'
      })
      .returning()
      .execute();
    const companyId = companyResult[0].id;

    // Create project without budget
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        location: 'Test Location',
        start_date: new Date(),
        status: 'active'
        // No budget field
      })
      .returning()
      .execute();
    const projectId = projectResult[0].id;

    // Create payment application
    await db.insert(paymentApplicationsTable)
      .values({
        project_id: projectId,
        contractor_id: companyId,
        term_number: 1,
        amount: '10000.00', // String for numeric column
        work_progress: '50.00', // String for numeric column
        status: 'approved',
        submitted_by: userId
      })
      .execute();

    const result = await getProjectDashboard(projectId);

    expect(result.budget_utilization).toBe(0); // No budget means 0% utilization
  });

  it('should count only scheduled meetings as active', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

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
    const projectId = projectResult[0].id;

    // Create meetings with different statuses
    await db.insert(meetingsTable)
      .values([
        {
          project_id: projectId,
          title: 'Scheduled Meeting',
          scheduled_at: new Date(),
          status: 'scheduled',
          created_by: userId
        },
        {
          project_id: projectId,
          title: 'Completed Meeting',
          scheduled_at: new Date(),
          status: 'completed',
          created_by: userId
        },
        {
          project_id: projectId,
          title: 'Cancelled Meeting',
          scheduled_at: new Date(),
          status: 'cancelled',
          created_by: userId
        }
      ])
      .execute();

    const result = await getProjectDashboard(projectId);

    expect(result.active_meetings).toBe(1); // Only scheduled meeting counts as active
  });
});


import { z } from 'zod';
import { db } from '../db';
import { 
  dailyActivitiesTable, 
  documentsTable, 
  meetingsTable, 
  projectMembersTable,
  paymentApplicationsTable,
  projectsTable
} from '../db/schema';
import { eq, and, gte, count, sum, avg, isNotNull } from 'drizzle-orm';

// Dashboard data schema
export const projectDashboardSchema = z.object({
  project_id: z.number(),
  total_activities: z.number(),
  recent_activities: z.number(),
  pending_approvals: z.number(),
  active_meetings: z.number(),
  overall_progress: z.number(),
  budget_utilization: z.number(),
  active_contractors: z.number(),
  k3_incidents: z.number()
});

export type ProjectDashboard = z.infer<typeof projectDashboardSchema>;

export const getProjectDashboard = async (projectId: number): Promise<ProjectDashboard> => {
  try {
    // Get total activities count
    const totalActivitiesResult = await db.select({ count: count() })
      .from(dailyActivitiesTable)
      .where(eq(dailyActivitiesTable.project_id, projectId))
      .execute();

    // Get recent activities (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentActivitiesResult = await db.select({ count: count() })
      .from(dailyActivitiesTable)
      .where(and(
        eq(dailyActivitiesTable.project_id, projectId),
        gte(dailyActivitiesTable.date, sevenDaysAgo)
      ))
      .execute();

    // Get pending approvals count
    const pendingApprovalsResult = await db.select({ count: count() })
      .from(documentsTable)
      .where(and(
        eq(documentsTable.project_id, projectId),
        eq(documentsTable.approval_status, 'pending')
      ))
      .execute();

    // Get active meetings count (scheduled or ongoing)
    const activeMeetingsResult = await db.select({ count: count() })
      .from(meetingsTable)
      .where(and(
        eq(meetingsTable.project_id, projectId),
        eq(meetingsTable.status, 'scheduled')
      ))
      .execute();

    // Get overall progress (average of all daily activities progress)
    const progressResult = await db.select({ 
      avgProgress: avg(dailyActivitiesTable.progress_percentage) 
    })
      .from(dailyActivitiesTable)
      .where(eq(dailyActivitiesTable.project_id, projectId))
      .execute();

    // Get budget utilization (sum of payment applications vs project budget)
    const paymentSumResult = await db.select({ 
      totalPayments: sum(paymentApplicationsTable.amount) 
    })
      .from(paymentApplicationsTable)
      .where(and(
        eq(paymentApplicationsTable.project_id, projectId),
        eq(paymentApplicationsTable.status, 'approved')
      ))
      .execute();

    const projectBudgetResult = await db.select({ budget: projectsTable.budget })
      .from(projectsTable)
      .where(eq(projectsTable.id, projectId))
      .execute();

    // Get active contractors count
    const activeContractorsResult = await db.select({ count: count() })
      .from(projectMembersTable)
      .where(and(
        eq(projectMembersTable.project_id, projectId),
        eq(projectMembersTable.role, 'main_contractor')
      ))
      .execute();

    // Get K3 incidents count (activities with K3 notes)
    const k3IncidentsResult = await db.select({ count: count() })
      .from(dailyActivitiesTable)
      .where(and(
        eq(dailyActivitiesTable.project_id, projectId),
        isNotNull(dailyActivitiesTable.k3_notes)
      ))
      .execute();

    // Calculate budget utilization percentage
    const projectBudget = projectBudgetResult[0]?.budget;
    const totalPayments = paymentSumResult[0]?.totalPayments;
    let budgetUtilization = 0;
    
    if (projectBudget && totalPayments) {
      const budgetNum = parseFloat(projectBudget);
      const paymentsNum = parseFloat(totalPayments);
      if (budgetNum > 0) {
        budgetUtilization = Math.round((paymentsNum / budgetNum) * 100);
      }
    }

    // Calculate overall progress
    const avgProgressValue = progressResult[0]?.avgProgress;
    const overallProgress = avgProgressValue ? Math.round(parseFloat(avgProgressValue)) : 0;

    return {
      project_id: projectId,
      total_activities: totalActivitiesResult[0]?.count || 0,
      recent_activities: recentActivitiesResult[0]?.count || 0,
      pending_approvals: pendingApprovalsResult[0]?.count || 0,
      active_meetings: activeMeetingsResult[0]?.count || 0,
      overall_progress: overallProgress,
      budget_utilization: budgetUtilization,
      active_contractors: activeContractorsResult[0]?.count || 0,
      k3_incidents: k3IncidentsResult[0]?.count || 0
    };
  } catch (error) {
    console.error('Failed to get project dashboard:', error);
    throw error;
  }
};

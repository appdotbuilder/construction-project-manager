
import { db } from '../db';
import { paymentApplicationsTable } from '../db/schema';
import { type PaymentApplication } from '../schema';
import { eq } from 'drizzle-orm';

export const getPaymentApplications = async (projectId: number): Promise<PaymentApplication[]> => {
  try {
    const results = await db.select()
      .from(paymentApplicationsTable)
      .where(eq(paymentApplicationsTable.project_id, projectId))
      .execute();

    return results.map(result => ({
      ...result,
      amount: parseFloat(result.amount),
      work_progress: parseFloat(result.work_progress)
    }));
  } catch (error) {
    console.error('Failed to get payment applications:', error);
    throw error;
  }
};

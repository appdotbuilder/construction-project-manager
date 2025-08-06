
import { db } from '../db';
import { paymentApplicationsTable } from '../db/schema';
import { type CreatePaymentApplicationInput, type PaymentApplication } from '../schema';

export const createPaymentApplication = async (input: CreatePaymentApplicationInput): Promise<PaymentApplication> => {
  try {
    // Insert payment application record
    const result = await db.insert(paymentApplicationsTable)
      .values({
        project_id: input.project_id,
        contractor_id: input.contractor_id,
        term_number: input.term_number,
        amount: input.amount.toString(), // Convert number to string for numeric column
        work_progress: input.work_progress.toString(), // Convert number to string for numeric column
        submitted_by: 1 // This should come from auth context in real implementation
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const paymentApplication = result[0];
    return {
      ...paymentApplication,
      amount: parseFloat(paymentApplication.amount), // Convert string back to number
      work_progress: parseFloat(paymentApplication.work_progress) // Convert string back to number
    };
  } catch (error) {
    console.error('Payment application creation failed:', error);
    throw error;
  }
};

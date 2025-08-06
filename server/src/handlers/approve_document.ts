
import { db } from '../db';
import { documentsTable, documentApprovalsTable } from '../db/schema';
import { type ApproveDocumentInput, type DocumentApproval } from '../schema';
import { eq } from 'drizzle-orm';

export const approveDocument = async (input: ApproveDocumentInput, approver_id: number): Promise<DocumentApproval> => {
  try {
    // Verify document exists first
    const document = await db.select()
      .from(documentsTable)
      .where(eq(documentsTable.id, input.document_id))
      .execute();

    if (document.length === 0) {
      throw new Error(`Document with ID ${input.document_id} not found`);
    }

    // Create approval record
    const approvalResult = await db.insert(documentApprovalsTable)
      .values({
        document_id: input.document_id,
        approver_id: approver_id,
        status: input.status,
        comments: input.comments,
        approved_at: input.status === 'approved' ? new Date() : null
      })
      .returning()
      .execute();

    // Update document approval status
    await db.update(documentsTable)
      .set({
        approval_status: input.status
      })
      .where(eq(documentsTable.id, input.document_id))
      .execute();

    return approvalResult[0];
  } catch (error) {
    console.error('Document approval failed:', error);
    throw error;
  }
};

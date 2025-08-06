
import { db } from '../db';
import { documentsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Document } from '../schema';

export const getDocuments = async (projectId: number): Promise<Document[]> => {
  try {
    const results = await db.select()
      .from(documentsTable)
      .where(eq(documentsTable.project_id, projectId))
      .execute();

    // Convert numeric fields back to numbers
    return results.map(document => ({
      ...document,
      id: document.id,
      project_id: document.project_id,
      title: document.title,
      type: document.type,
      file_url: document.file_url,
      version: document.version,
      uploaded_by: document.uploaded_by,
      approval_status: document.approval_status,
      created_at: document.created_at
    }));
  } catch (error) {
    console.error('Failed to fetch documents:', error);
    throw error;
  }
};


import { db } from '../db';
import { documentsTable } from '../db/schema';
import { type CreateDocumentInput, type Document } from '../schema';

export const createDocument = async (input: CreateDocumentInput, uploadedBy: number): Promise<Document> => {
  try {
    // Insert document record
    const result = await db.insert(documentsTable)
      .values({
        project_id: input.project_id,
        title: input.title,
        type: input.type,
        file_url: input.file_url,
        version: input.version,
        uploaded_by: uploadedBy,
        approval_status: 'pending'
      })
      .returning()
      .execute();

    const document = result[0];
    return {
      ...document,
      created_at: document.created_at
    };
  } catch (error) {
    console.error('Document creation failed:', error);
    throw error;
  }
};

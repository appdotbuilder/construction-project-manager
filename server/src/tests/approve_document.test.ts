
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, projectsTable, documentsTable, documentApprovalsTable } from '../db/schema';
import { type ApproveDocumentInput } from '../schema';
import { approveDocument } from '../handlers/approve_document';
import { eq } from 'drizzle-orm';

describe('approveDocument', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Test data setup
  const setupTestData = async () => {
    // Create user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'approver@example.com',
        name: 'Test Approver'
      })
      .returning()
      .execute();

    // Create uploader user
    const uploaderResult = await db.insert(usersTable)
      .values({
        email: 'uploader@example.com',
        name: 'Test Uploader'
      })
      .returning()
      .execute();

    // Create project
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        location: 'Test Location',
        start_date: new Date(),
        status: 'active'
      })
      .returning()
      .execute();

    // Create document
    const documentResult = await db.insert(documentsTable)
      .values({
        project_id: projectResult[0].id,
        title: 'Test Document',
        type: 'drawing',
        file_url: 'https://example.com/doc.pdf',
        version: '1.0',
        uploaded_by: uploaderResult[0].id,
        approval_status: 'pending'
      })
      .returning()
      .execute();

    return {
      approver: userResult[0],
      uploader: uploaderResult[0],
      project: projectResult[0],
      document: documentResult[0]
    };
  };

  it('should create approval record and update document status to approved', async () => {
    const testData = await setupTestData();

    const input: ApproveDocumentInput = {
      document_id: testData.document.id,
      status: 'approved',
      comments: 'Looks good!'
    };

    const result = await approveDocument(input, testData.approver.id);

    // Verify approval record
    expect(result.document_id).toEqual(testData.document.id);
    expect(result.approver_id).toEqual(testData.approver.id);
    expect(result.status).toEqual('approved');
    expect(result.comments).toEqual('Looks good!');
    expect(result.approved_at).toBeInstanceOf(Date);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save approval to database and update document status', async () => {
    const testData = await setupTestData();

    const input: ApproveDocumentInput = {
      document_id: testData.document.id,
      status: 'approved',
      comments: 'Approved with comments'
    };

    const result = await approveDocument(input, testData.approver.id);

    // Verify approval was saved
    const approvals = await db.select()
      .from(documentApprovalsTable)
      .where(eq(documentApprovalsTable.id, result.id))
      .execute();

    expect(approvals).toHaveLength(1);
    expect(approvals[0].document_id).toEqual(testData.document.id);
    expect(approvals[0].approver_id).toEqual(testData.approver.id);
    expect(approvals[0].status).toEqual('approved');
    expect(approvals[0].comments).toEqual('Approved with comments');

    // Verify document status was updated
    const documents = await db.select()
      .from(documentsTable)
      .where(eq(documentsTable.id, testData.document.id))
      .execute();

    expect(documents[0].approval_status).toEqual('approved');
  });

  it('should handle rejection status with no approved_at date', async () => {
    const testData = await setupTestData();

    const input: ApproveDocumentInput = {
      document_id: testData.document.id,
      status: 'rejected',
      comments: 'Needs revision'
    };

    const result = await approveDocument(input, testData.approver.id);

    expect(result.status).toEqual('rejected');
    expect(result.comments).toEqual('Needs revision');
    expect(result.approved_at).toBeNull();

    // Verify document status was updated to rejected
    const documents = await db.select()
      .from(documentsTable)
      .where(eq(documentsTable.id, testData.document.id))
      .execute();

    expect(documents[0].approval_status).toEqual('rejected');
  });

  it('should handle revision_required status', async () => {
    const testData = await setupTestData();

    const input: ApproveDocumentInput = {
      document_id: testData.document.id,
      status: 'revision_required',
      comments: 'Please update section 3'
    };

    const result = await approveDocument(input, testData.approver.id);

    expect(result.status).toEqual('revision_required');
    expect(result.comments).toEqual('Please update section 3');
    expect(result.approved_at).toBeNull();
  });

  it('should handle null comments', async () => {
    const testData = await setupTestData();

    const input: ApproveDocumentInput = {
      document_id: testData.document.id,
      status: 'approved',
      comments: null
    };

    const result = await approveDocument(input, testData.approver.id);

    expect(result.comments).toBeNull();
    expect(result.status).toEqual('approved');
    expect(result.approved_at).toBeInstanceOf(Date);
  });

  it('should throw error when document does not exist', async () => {
    const testData = await setupTestData();

    const input: ApproveDocumentInput = {
      document_id: 99999, // Non-existent ID
      status: 'approved',
      comments: 'This should fail'
    };

    expect(approveDocument(input, testData.approver.id)).rejects.toThrow(/Document with ID 99999 not found/i);
  });
});

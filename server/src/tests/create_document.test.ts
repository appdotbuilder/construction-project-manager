
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { documentsTable, projectsTable, usersTable } from '../db/schema';
import { type CreateDocumentInput } from '../schema';
import { createDocument } from '../handlers/create_document';
import { eq } from 'drizzle-orm';

// Test input
const testInput: CreateDocumentInput = {
  project_id: 1,
  title: 'Test Drawing',
  type: 'drawing',
  file_url: 'https://example.com/drawing.pdf',
  version: 'v1.0'
};

describe('createDocument', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a document', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable).values({
      email: 'test@example.com',
      name: 'Test User'
    }).returning().execute();

    const project = await db.insert(projectsTable).values({
      name: 'Test Project',
      location: 'Test Location',
      start_date: new Date(),
      status: 'planning'
    }).returning().execute();

    const result = await createDocument({
      ...testInput,
      project_id: project[0].id
    }, user[0].id);

    // Basic field validation
    expect(result.title).toEqual('Test Drawing');
    expect(result.type).toEqual('drawing');
    expect(result.file_url).toEqual('https://example.com/drawing.pdf');
    expect(result.version).toEqual('v1.0');
    expect(result.project_id).toEqual(project[0].id);
    expect(result.uploaded_by).toEqual(user[0].id);
    expect(result.approval_status).toEqual('pending');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save document to database', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable).values({
      email: 'test@example.com',
      name: 'Test User'
    }).returning().execute();

    const project = await db.insert(projectsTable).values({
      name: 'Test Project',
      location: 'Test Location',
      start_date: new Date(),
      status: 'planning'
    }).returning().execute();

    const result = await createDocument({
      ...testInput,
      project_id: project[0].id
    }, user[0].id);

    // Query using proper drizzle syntax
    const documents = await db.select()
      .from(documentsTable)
      .where(eq(documentsTable.id, result.id))
      .execute();

    expect(documents).toHaveLength(1);
    expect(documents[0].title).toEqual('Test Drawing');
    expect(documents[0].type).toEqual('drawing');
    expect(documents[0].file_url).toEqual('https://example.com/drawing.pdf');
    expect(documents[0].version).toEqual('v1.0');
    expect(documents[0].approval_status).toEqual('pending');
    expect(documents[0].created_at).toBeInstanceOf(Date);
  });

  it('should create different document types', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable).values({
      email: 'test@example.com',
      name: 'Test User'
    }).returning().execute();

    const project = await db.insert(projectsTable).values({
      name: 'Test Project',
      location: 'Test Location',
      start_date: new Date(),
      status: 'planning'
    }).returning().execute();

    const workMethodDoc = await createDocument({
      project_id: project[0].id,
      title: 'Work Method Statement',
      type: 'work_method',
      file_url: 'https://example.com/method.pdf',
      version: '1.0'
    }, user[0].id);

    const materialSpecDoc = await createDocument({
      project_id: project[0].id,
      title: 'Material Specification',
      type: 'material_spec',
      file_url: 'https://example.com/spec.pdf',
      version: '2.1'
    }, user[0].id);

    expect(workMethodDoc.type).toEqual('work_method');
    expect(workMethodDoc.title).toEqual('Work Method Statement');
    expect(materialSpecDoc.type).toEqual('material_spec');
    expect(materialSpecDoc.title).toEqual('Material Specification');
  });

  it('should handle foreign key constraint violation', async () => {
    // Try to create document with non-existent project_id
    expect(createDocument(testInput, 999)).rejects.toThrow(/violates foreign key constraint/i);
  });
});

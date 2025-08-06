
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { projectsTable, documentsTable, usersTable } from '../db/schema';
import { getDocuments } from '../handlers/get_documents';

describe('getDocuments', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no documents exist for project', async () => {
    // Create test project
    const [project] = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        location: 'Test Location',
        start_date: new Date(),
        status: 'planning'
      })
      .returning()
      .execute();

    const result = await getDocuments(project.id);

    expect(result).toEqual([]);
  });

  it('should return documents for a specific project', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();

    // Create test project
    const [project] = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        location: 'Test Location',
        start_date: new Date(),
        status: 'planning'
      })
      .returning()
      .execute();

    // Create test documents
    await db.insert(documentsTable)
      .values([
        {
          project_id: project.id,
          title: 'Test Drawing',
          type: 'drawing',
          file_url: 'https://example.com/drawing.pdf',
          version: '1.0',
          uploaded_by: user.id,
          approval_status: 'pending'
        },
        {
          project_id: project.id,
          title: 'Test Report',
          type: 'report',
          file_url: 'https://example.com/report.pdf',
          version: '1.1',
          uploaded_by: user.id,
          approval_status: 'approved'
        }
      ])
      .execute();

    const result = await getDocuments(project.id);

    expect(result).toHaveLength(2);
    
    // Check first document
    const drawing = result.find(doc => doc.title === 'Test Drawing');
    expect(drawing).toBeDefined();
    expect(drawing!.type).toBe('drawing');
    expect(drawing!.file_url).toBe('https://example.com/drawing.pdf');
    expect(drawing!.version).toBe('1.0');
    expect(drawing!.approval_status).toBe('pending');
    expect(drawing!.project_id).toBe(project.id);
    expect(drawing!.uploaded_by).toBe(user.id);
    expect(drawing!.created_at).toBeInstanceOf(Date);

    // Check second document
    const report = result.find(doc => doc.title === 'Test Report');
    expect(report).toBeDefined();
    expect(report!.type).toBe('report');
    expect(report!.file_url).toBe('https://example.com/report.pdf');
    expect(report!.version).toBe('1.1');
    expect(report!.approval_status).toBe('approved');
  });

  it('should only return documents for the specified project', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();

    // Create two test projects
    const [project1, project2] = await db.insert(projectsTable)
      .values([
        {
          name: 'Project 1',
          location: 'Location 1',
          start_date: new Date(),
          status: 'planning'
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

    // Create documents for both projects
    await db.insert(documentsTable)
      .values([
        {
          project_id: project1.id,
          title: 'Project 1 Document',
          type: 'drawing',
          file_url: 'https://example.com/p1-doc.pdf',
          version: '1.0',
          uploaded_by: user.id,
          approval_status: 'pending'
        },
        {
          project_id: project2.id,
          title: 'Project 2 Document',
          type: 'report',
          file_url: 'https://example.com/p2-doc.pdf',
          version: '1.0',
          uploaded_by: user.id,
          approval_status: 'approved'
        }
      ])
      .execute();

    const result = await getDocuments(project1.id);

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Project 1 Document');
    expect(result[0].project_id).toBe(project1.id);
  });

  it('should return documents with all required fields', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();

    // Create test project
    const [project] = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        location: 'Test Location',
        start_date: new Date(),
        status: 'planning'
      })
      .returning()
      .execute();

    // Create test document
    await db.insert(documentsTable)
      .values({
        project_id: project.id,
        title: 'Complete Document',
        type: 'work_method',
        file_url: 'https://example.com/method.pdf',
        version: '2.0',
        uploaded_by: user.id,
        approval_status: 'revision_required'
      })
      .execute();

    const result = await getDocuments(project.id);

    expect(result).toHaveLength(1);
    const document = result[0];

    // Verify all required fields are present and have correct types
    expect(typeof document.id).toBe('number');
    expect(typeof document.project_id).toBe('number');
    expect(typeof document.title).toBe('string');
    expect(typeof document.type).toBe('string');
    expect(typeof document.file_url).toBe('string');
    expect(typeof document.version).toBe('string');
    expect(typeof document.uploaded_by).toBe('number');
    expect(typeof document.approval_status).toBe('string');
    expect(document.created_at).toBeInstanceOf(Date);

    // Verify specific values
    expect(document.title).toBe('Complete Document');
    expect(document.type).toBe('work_method');
    expect(document.approval_status).toBe('revision_required');
    expect(document.version).toBe('2.0');
  });
});

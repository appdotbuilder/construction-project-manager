
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { paymentApplicationsTable, projectsTable, companiesTable, usersTable } from '../db/schema';
import { type CreatePaymentApplicationInput } from '../schema';
import { createPaymentApplication } from '../handlers/create_payment_application';
import { eq } from 'drizzle-orm';

describe('createPaymentApplication', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a payment application', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        phone: '123456789'
      })
      .returning()
      .execute();
    
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        location: 'Test Location',
        start_date: new Date(),
        status: 'active'
      })
      .returning()
      .execute();

    const companyResult = await db.insert(companiesTable)
      .values({
        name: 'Test Company',
        address: 'Test Address',
        email: 'company@test.com'
      })
      .returning()
      .execute();

    const testInput: CreatePaymentApplicationInput = {
      project_id: projectResult[0].id,
      contractor_id: companyResult[0].id,
      term_number: 1,
      amount: 50000.75,
      work_progress: 25.5
    };

    const result = await createPaymentApplication(testInput);

    // Basic field validation
    expect(result.project_id).toEqual(testInput.project_id);
    expect(result.contractor_id).toEqual(testInput.contractor_id);
    expect(result.term_number).toEqual(1);
    expect(result.amount).toEqual(50000.75);
    expect(typeof result.amount).toBe('number');
    expect(result.work_progress).toEqual(25.5);
    expect(typeof result.work_progress).toBe('number');
    expect(result.status).toEqual('draft');
    expect(result.submitted_by).toEqual(1);
    expect(result.submitted_at).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save payment application to database', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();

    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        location: 'Test Location',
        start_date: new Date(),
        status: 'planning'
      })
      .returning()
      .execute();

    const companyResult = await db.insert(companiesTable)
      .values({
        name: 'Contractor Inc',
        registration_number: 'REG123'
      })
      .returning()
      .execute();

    const testInput: CreatePaymentApplicationInput = {
      project_id: projectResult[0].id,
      contractor_id: companyResult[0].id,
      term_number: 2,
      amount: 75000.25,
      work_progress: 50.0
    };

    const result = await createPaymentApplication(testInput);

    // Query database to verify data was saved correctly
    const paymentApplications = await db.select()
      .from(paymentApplicationsTable)
      .where(eq(paymentApplicationsTable.id, result.id))
      .execute();

    expect(paymentApplications).toHaveLength(1);
    const savedApplication = paymentApplications[0];
    expect(savedApplication.project_id).toEqual(testInput.project_id);
    expect(savedApplication.contractor_id).toEqual(testInput.contractor_id);
    expect(savedApplication.term_number).toEqual(2);
    expect(parseFloat(savedApplication.amount)).toEqual(75000.25);
    expect(parseFloat(savedApplication.work_progress)).toEqual(50.0);
    expect(savedApplication.status).toEqual('draft');
    expect(savedApplication.submitted_by).toEqual(1);
    expect(savedApplication.submitted_at).toBeNull();
    expect(savedApplication.created_at).toBeInstanceOf(Date);
  });

  it('should handle decimal values correctly', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        email: 'decimal@test.com',
        name: 'Decimal User'
      })
      .returning()
      .execute();

    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Decimal Project',
        location: 'Decimal Location',
        start_date: new Date(),
        status: 'active'
      })
      .returning()
      .execute();

    const companyResult = await db.insert(companiesTable)
      .values({
        name: 'Decimal Company'
      })
      .returning()
      .execute();

    const testInput: CreatePaymentApplicationInput = {
      project_id: projectResult[0].id,
      contractor_id: companyResult[0].id,
      term_number: 3,
      amount: 123456.78, // Use 2 decimal places to match database precision
      work_progress: 33.33 // Use 2 decimal places to match database precision
    };

    const result = await createPaymentApplication(testInput);

    // Verify decimal precision is maintained (database rounds to 2 decimal places)
    expect(result.amount).toEqual(123456.78);
    expect(result.work_progress).toEqual(33.33);
    expect(typeof result.amount).toBe('number');
    expect(typeof result.work_progress).toBe('number');
  });
});

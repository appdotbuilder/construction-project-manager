
import { serial, text, pgTable, timestamp, numeric, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const projectRoleEnum = pgEnum('project_role', ['owner', 'mk', 'main_contractor', 'sub_contractor', 'designer', 'qs']);
export const projectStatusEnum = pgEnum('project_status', ['planning', 'active', 'on_hold', 'completed', 'cancelled']);
export const documentTypeEnum = pgEnum('document_type', ['drawing', 'work_method', 'material_spec', 'permit', 'report', 'other']);
export const approvalStatusEnum = pgEnum('approval_status', ['pending', 'approved', 'rejected', 'revision_required']);
export const paymentStatusEnum = pgEnum('payment_status', ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'paid']);
export const meetingStatusEnum = pgEnum('meeting_status', ['scheduled', 'ongoing', 'completed', 'cancelled']);

// Core tables
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  phone: text('phone'),
  avatar_url: text('avatar_url'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const companiesTable = pgTable('companies', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  address: text('address'),
  phone: text('phone'),
  email: text('email'),
  registration_number: text('registration_number'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const projectsTable = pgTable('projects', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  location: text('location').notNull(),
  start_date: timestamp('start_date').notNull(),
  end_date: timestamp('end_date'),
  status: projectStatusEnum('status').notNull(),
  budget: numeric('budget', { precision: 15, scale: 2 }),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const projectMembersTable = pgTable('project_members', {
  id: serial('id').primaryKey(),
  project_id: integer('project_id').notNull().references(() => projectsTable.id),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  company_id: integer('company_id').notNull().references(() => companiesTable.id),
  role: projectRoleEnum('role').notNull(),
  work_package: text('work_package'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// RAB (Budget) tables
export const rabsTable = pgTable('rabs', {
  id: serial('id').primaryKey(),
  project_id: integer('project_id').notNull().references(() => projectsTable.id),
  contractor_id: integer('contractor_id').notNull().references(() => companiesTable.id),
  work_package: text('work_package').notNull(),
  file_url: text('file_url').notNull(),
  total_amount: numeric('total_amount', { precision: 15, scale: 2 }).notNull(),
  uploaded_by: integer('uploaded_by').notNull().references(() => usersTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Daily Activity tables
export const dailyActivitiesTable = pgTable('daily_activities', {
  id: serial('id').primaryKey(),
  project_id: integer('project_id').notNull().references(() => projectsTable.id),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  date: timestamp('date').notNull(),
  work_description: text('work_description').notNull(),
  worker_count: integer('worker_count').notNull(),
  materials_used: text('materials_used'),
  progress_percentage: numeric('progress_percentage', { precision: 5, scale: 2 }).notNull(),
  weather: text('weather'),
  k3_notes: text('k3_notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const activityPhotosTable = pgTable('activity_photos', {
  id: serial('id').primaryKey(),
  activity_id: integer('activity_id').notNull().references(() => dailyActivitiesTable.id),
  photo_url: text('photo_url').notNull(),
  caption: text('caption'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Document and Approval tables
export const documentsTable = pgTable('documents', {
  id: serial('id').primaryKey(),
  project_id: integer('project_id').notNull().references(() => projectsTable.id),
  title: text('title').notNull(),
  type: documentTypeEnum('type').notNull(),
  file_url: text('file_url').notNull(),
  version: text('version').notNull(),
  uploaded_by: integer('uploaded_by').notNull().references(() => usersTable.id),
  approval_status: approvalStatusEnum('approval_status').notNull().default('pending'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const documentApprovalsTable = pgTable('document_approvals', {
  id: serial('id').primaryKey(),
  document_id: integer('document_id').notNull().references(() => documentsTable.id),
  approver_id: integer('approver_id').notNull().references(() => usersTable.id),
  status: approvalStatusEnum('status').notNull(),
  comments: text('comments'),
  approved_at: timestamp('approved_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Payment Application tables
export const paymentApplicationsTable = pgTable('payment_applications', {
  id: serial('id').primaryKey(),
  project_id: integer('project_id').notNull().references(() => projectsTable.id),
  contractor_id: integer('contractor_id').notNull().references(() => companiesTable.id),
  term_number: integer('term_number').notNull(),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  work_progress: numeric('work_progress', { precision: 5, scale: 2 }).notNull(),
  status: paymentStatusEnum('status').notNull().default('draft'),
  submitted_by: integer('submitted_by').notNull().references(() => usersTable.id),
  submitted_at: timestamp('submitted_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Form and Checklist tables
export const formsTable = pgTable('forms', {
  id: serial('id').primaryKey(),
  project_id: integer('project_id').notNull().references(() => projectsTable.id),
  title: text('title').notNull(),
  description: text('description'),
  form_fields: text('form_fields').notNull(), // JSON string
  created_by: integer('created_by').notNull().references(() => usersTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const formSubmissionsTable = pgTable('form_submissions', {
  id: serial('id').primaryKey(),
  form_id: integer('form_id').notNull().references(() => formsTable.id),
  submitted_by: integer('submitted_by').notNull().references(() => usersTable.id),
  responses: text('responses').notNull(), // JSON string
  submitted_at: timestamp('submitted_at').defaultNow().notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Meeting tables
export const meetingsTable = pgTable('meetings', {
  id: serial('id').primaryKey(),
  project_id: integer('project_id').notNull().references(() => projectsTable.id),
  title: text('title').notNull(),
  description: text('description'),
  scheduled_at: timestamp('scheduled_at').notNull(),
  location: text('location'),
  status: meetingStatusEnum('status').notNull().default('scheduled'),
  meeting_notes: text('meeting_notes'),
  created_by: integer('created_by').notNull().references(() => usersTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const meetingAttendeesTable = pgTable('meeting_attendees', {
  id: serial('id').primaryKey(),
  meeting_id: integer('meeting_id').notNull().references(() => meetingsTable.id),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  attended: boolean('attended').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  projectMembers: many(projectMembersTable),
  dailyActivities: many(dailyActivitiesTable),
  documentsUploaded: many(documentsTable),
  documentApprovals: many(documentApprovalsTable),
  paymentApplications: many(paymentApplicationsTable),
  formsCreated: many(formsTable),
  formSubmissions: many(formSubmissionsTable),
  meetingsCreated: many(meetingsTable),
  meetingAttendances: many(meetingAttendeesTable),
  rabsUploaded: many(rabsTable),
}));

export const companiesRelations = relations(companiesTable, ({ many }) => ({
  projectMembers: many(projectMembersTable),
  rabs: many(rabsTable),
  paymentApplications: many(paymentApplicationsTable),
}));

export const projectsRelations = relations(projectsTable, ({ many }) => ({
  members: many(projectMembersTable),
  dailyActivities: many(dailyActivitiesTable),
  documents: many(documentsTable),
  paymentApplications: many(paymentApplicationsTable),
  forms: many(formsTable),
  meetings: many(meetingsTable),
  rabs: many(rabsTable),
}));

export const projectMembersRelations = relations(projectMembersTable, ({ one }) => ({
  project: one(projectsTable, {
    fields: [projectMembersTable.project_id],
    references: [projectsTable.id],
  }),
  user: one(usersTable, {
    fields: [projectMembersTable.user_id],
    references: [usersTable.id],
  }),
  company: one(companiesTable, {
    fields: [projectMembersTable.company_id],
    references: [companiesTable.id],
  }),
}));

export const dailyActivitiesRelations = relations(dailyActivitiesTable, ({ one, many }) => ({
  project: one(projectsTable, {
    fields: [dailyActivitiesTable.project_id],
    references: [projectsTable.id],
  }),
  user: one(usersTable, {
    fields: [dailyActivitiesTable.user_id],
    references: [usersTable.id],
  }),
  photos: many(activityPhotosTable),
}));

export const activityPhotosRelations = relations(activityPhotosTable, ({ one }) => ({
  activity: one(dailyActivitiesTable, {
    fields: [activityPhotosTable.activity_id],
    references: [dailyActivitiesTable.id],
  }),
}));

export const documentsRelations = relations(documentsTable, ({ one, many }) => ({
  project: one(projectsTable, {
    fields: [documentsTable.project_id],
    references: [projectsTable.id],
  }),
  uploadedBy: one(usersTable, {
    fields: [documentsTable.uploaded_by],
    references: [usersTable.id],
  }),
  approvals: many(documentApprovalsTable),
}));

export const documentApprovalsRelations = relations(documentApprovalsTable, ({ one }) => ({
  document: one(documentsTable, {
    fields: [documentApprovalsTable.document_id],
    references: [documentsTable.id],
  }),
  approver: one(usersTable, {
    fields: [documentApprovalsTable.approver_id],
    references: [usersTable.id],
  }),
}));

export const paymentApplicationsRelations = relations(paymentApplicationsTable, ({ one }) => ({
  project: one(projectsTable, {
    fields: [paymentApplicationsTable.project_id],
    references: [projectsTable.id],
  }),
  contractor: one(companiesTable, {
    fields: [paymentApplicationsTable.contractor_id],
    references: [companiesTable.id],
  }),
  submittedBy: one(usersTable, {
    fields: [paymentApplicationsTable.submitted_by],
    references: [usersTable.id],
  }),
}));

export const rabsRelations = relations(rabsTable, ({ one }) => ({
  project: one(projectsTable, {
    fields: [rabsTable.project_id],
    references: [projectsTable.id],
  }),
  contractor: one(companiesTable, {
    fields: [rabsTable.contractor_id],
    references: [companiesTable.id],
  }),
  uploadedBy: one(usersTable, {
    fields: [rabsTable.uploaded_by],
    references: [usersTable.id],
  }),
}));

export const formsRelations = relations(formsTable, ({ one, many }) => ({
  project: one(projectsTable, {
    fields: [formsTable.project_id],
    references: [projectsTable.id],
  }),
  createdBy: one(usersTable, {
    fields: [formsTable.created_by],
    references: [usersTable.id],
  }),
  submissions: many(formSubmissionsTable),
}));

export const formSubmissionsRelations = relations(formSubmissionsTable, ({ one }) => ({
  form: one(formsTable, {
    fields: [formSubmissionsTable.form_id],
    references: [formsTable.id],
  }),
  submittedBy: one(usersTable, {
    fields: [formSubmissionsTable.submitted_by],
    references: [usersTable.id],
  }),
}));

export const meetingsRelations = relations(meetingsTable, ({ one, many }) => ({
  project: one(projectsTable, {
    fields: [meetingsTable.project_id],
    references: [projectsTable.id],
  }),
  createdBy: one(usersTable, {
    fields: [meetingsTable.created_by],
    references: [usersTable.id],
  }),
  attendees: many(meetingAttendeesTable),
}));

export const meetingAttendeesRelations = relations(meetingAttendeesTable, ({ one }) => ({
  meeting: one(meetingsTable, {
    fields: [meetingAttendeesTable.meeting_id],
    references: [meetingsTable.id],
  }),
  user: one(usersTable, {
    fields: [meetingAttendeesTable.user_id],
    references: [usersTable.id],
  }),
}));

// Export all tables
export const tables = {
  users: usersTable,
  companies: companiesTable,
  projects: projectsTable,
  projectMembers: projectMembersTable,
  rabs: rabsTable,
  dailyActivities: dailyActivitiesTable,
  activityPhotos: activityPhotosTable,
  documents: documentsTable,
  documentApprovals: documentApprovalsTable,
  paymentApplications: paymentApplicationsTable,
  forms: formsTable,
  formSubmissions: formSubmissionsTable,
  meetings: meetingsTable,
  meetingAttendees: meetingAttendeesTable,
};

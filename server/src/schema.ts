
import { z } from 'zod';

// User and Company schemas
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string(),
  phone: z.string().nullable(),
  avatar_url: z.string().nullable(),
  created_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

export const companySchema = z.object({
  id: z.number(),
  name: z.string(),
  address: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().email().nullable(),
  registration_number: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Company = z.infer<typeof companySchema>;

// Project and Role schemas
export const projectRoleEnum = z.enum(['owner', 'mk', 'main_contractor', 'sub_contractor', 'designer', 'qs']);
export type ProjectRole = z.infer<typeof projectRoleEnum>;

export const projectStatusEnum = z.enum(['planning', 'active', 'on_hold', 'completed', 'cancelled']);
export type ProjectStatus = z.infer<typeof projectStatusEnum>;

export const projectSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  location: z.string(),
  start_date: z.coerce.date(),
  end_date: z.coerce.date().nullable(),
  status: projectStatusEnum,
  budget: z.number().nullable(),
  created_at: z.coerce.date()
});

export type Project = z.infer<typeof projectSchema>;

export const projectMemberSchema = z.object({
  id: z.number(),
  project_id: z.number(),
  user_id: z.number(),
  company_id: z.number(),
  role: projectRoleEnum,
  work_package: z.string().nullable(),
  created_at: z.coerce.date()
});

export type ProjectMember = z.infer<typeof projectMemberSchema>;

// RAB (Budget) schemas
export const rabSchema = z.object({
  id: z.number(),
  project_id: z.number(),
  contractor_id: z.number(),
  work_package: z.string(),
  file_url: z.string(),
  total_amount: z.number(),
  uploaded_by: z.number(),
  created_at: z.coerce.date()
});

export type Rab = z.infer<typeof rabSchema>;

// Daily Activity schemas
export const dailyActivitySchema = z.object({
  id: z.number(),
  project_id: z.number(),
  user_id: z.number(),
  date: z.coerce.date(),
  work_description: z.string(),
  worker_count: z.number().int(),
  materials_used: z.string().nullable(),
  progress_percentage: z.number().min(0).max(100),
  weather: z.string().nullable(),
  k3_notes: z.string().nullable(),
  created_at: z.coerce.date()
});

export type DailyActivity = z.infer<typeof dailyActivitySchema>;

export const activityPhotoSchema = z.object({
  id: z.number(),
  activity_id: z.number(),
  photo_url: z.string(),
  caption: z.string().nullable(),
  created_at: z.coerce.date()
});

export type ActivityPhoto = z.infer<typeof activityPhotoSchema>;

// Document and Approval schemas
export const documentTypeEnum = z.enum(['drawing', 'work_method', 'material_spec', 'permit', 'report', 'other']);
export type DocumentType = z.infer<typeof documentTypeEnum>;

export const approvalStatusEnum = z.enum(['pending', 'approved', 'rejected', 'revision_required']);
export type ApprovalStatus = z.infer<typeof approvalStatusEnum>;

export const documentSchema = z.object({
  id: z.number(),
  project_id: z.number(),
  title: z.string(),
  type: documentTypeEnum,
  file_url: z.string(),
  version: z.string(),
  uploaded_by: z.number(),
  approval_status: approvalStatusEnum,
  created_at: z.coerce.date()
});

export type Document = z.infer<typeof documentSchema>;

export const documentApprovalSchema = z.object({
  id: z.number(),
  document_id: z.number(),
  approver_id: z.number(),
  status: approvalStatusEnum,
  comments: z.string().nullable(),
  approved_at: z.coerce.date().nullable(),
  created_at: z.coerce.date()
});

export type DocumentApproval = z.infer<typeof documentApprovalSchema>;

// Payment Application schemas
export const paymentStatusEnum = z.enum(['draft', 'submitted', 'under_review', 'approved', 'rejected', 'paid']);
export type PaymentStatus = z.infer<typeof paymentStatusEnum>;

export const paymentApplicationSchema = z.object({
  id: z.number(),
  project_id: z.number(),
  contractor_id: z.number(),
  term_number: z.number().int(),
  amount: z.number(),
  work_progress: z.number().min(0).max(100),
  status: paymentStatusEnum,
  submitted_by: z.number(),
  submitted_at: z.coerce.date().nullable(),
  created_at: z.coerce.date()
});

export type PaymentApplication = z.infer<typeof paymentApplicationSchema>;

// Form and Checklist schemas
export const formSchema = z.object({
  id: z.number(),
  project_id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  form_fields: z.string(), // JSON string of form structure
  created_by: z.number(),
  created_at: z.coerce.date()
});

export type Form = z.infer<typeof formSchema>;

export const formSubmissionSchema = z.object({
  id: z.number(),
  form_id: z.number(),
  submitted_by: z.number(),
  responses: z.string(), // JSON string of responses
  submitted_at: z.coerce.date(),
  created_at: z.coerce.date()
});

export type FormSubmission = z.infer<typeof formSubmissionSchema>;

// Meeting schemas
export const meetingStatusEnum = z.enum(['scheduled', 'ongoing', 'completed', 'cancelled']);
export type MeetingStatus = z.infer<typeof meetingStatusEnum>;

export const meetingSchema = z.object({
  id: z.number(),
  project_id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  scheduled_at: z.coerce.date(),
  location: z.string().nullable(),
  status: meetingStatusEnum,
  meeting_notes: z.string().nullable(),
  created_by: z.number(),
  created_at: z.coerce.date()
});

export type Meeting = z.infer<typeof meetingSchema>;

export const meetingAttendeeSchema = z.object({
  id: z.number(),
  meeting_id: z.number(),
  user_id: z.number(),
  attended: z.boolean(),
  created_at: z.coerce.date()
});

export type MeetingAttendee = z.infer<typeof meetingAttendeeSchema>;

// Input schemas for creation
export const createProjectInputSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
  location: z.string(),
  start_date: z.coerce.date(),
  end_date: z.coerce.date().nullable(),
  status: projectStatusEnum,
  budget: z.number().nullable()
});

export type CreateProjectInput = z.infer<typeof createProjectInputSchema>;

export const createDailyActivityInputSchema = z.object({
  project_id: z.number(),
  date: z.coerce.date(),
  work_description: z.string(),
  worker_count: z.number().int(),
  materials_used: z.string().nullable(),
  progress_percentage: z.number().min(0).max(100),
  weather: z.string().nullable(),
  k3_notes: z.string().nullable(),
  photo_urls: z.array(z.string()).optional()
});

export type CreateDailyActivityInput = z.infer<typeof createDailyActivityInputSchema>;

export const createDocumentInputSchema = z.object({
  project_id: z.number(),
  title: z.string(),
  type: documentTypeEnum,
  file_url: z.string(),
  version: z.string()
});

export type CreateDocumentInput = z.infer<typeof createDocumentInputSchema>;

export const createPaymentApplicationInputSchema = z.object({
  project_id: z.number(),
  contractor_id: z.number(),
  term_number: z.number().int(),
  amount: z.number(),
  work_progress: z.number().min(0).max(100)
});

export type CreatePaymentApplicationInput = z.infer<typeof createPaymentApplicationInputSchema>;

export const createMeetingInputSchema = z.object({
  project_id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  scheduled_at: z.coerce.date(),
  location: z.string().nullable(),
  attendee_ids: z.array(z.number())
});

export type CreateMeetingInput = z.infer<typeof createMeetingInputSchema>;

export const approveDocumentInputSchema = z.object({
  document_id: z.number(),
  status: approvalStatusEnum,
  comments: z.string().nullable()
});

export type ApproveDocumentInput = z.infer<typeof approveDocumentInputSchema>;


import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Schema imports
import { 
  createProjectInputSchema,
  createDailyActivityInputSchema,
  createDocumentInputSchema,
  createPaymentApplicationInputSchema,
  createMeetingInputSchema,
  approveDocumentInputSchema
} from './schema';

// Handler imports
import { createProject } from './handlers/create_project';
import { getProjects } from './handlers/get_projects';
import { getProjectById } from './handlers/get_project_by_id';
import { createDailyActivity } from './handlers/create_daily_activity';
import { getDailyActivities } from './handlers/get_daily_activities';
import { createDocument } from './handlers/create_document';
import { getDocuments } from './handlers/get_documents';
import { approveDocument } from './handlers/approve_document';
import { createPaymentApplication } from './handlers/create_payment_application';
import { getPaymentApplications } from './handlers/get_payment_applications';
import { createMeeting } from './handlers/create_meeting';
import { getMeetings } from './handlers/get_meetings';
import { getProjectDashboard } from './handlers/get_project_dashboard';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Project management
  createProject: publicProcedure
    .input(createProjectInputSchema)
    .mutation(({ input }) => createProject(input)),

  getProjects: publicProcedure
    .query(() => getProjects()),

  getProjectById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getProjectById(input.id)),

  getProjectDashboard: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .query(({ input }) => getProjectDashboard(input.projectId)),

  // Daily activities
  createDailyActivity: publicProcedure
    .input(createDailyActivityInputSchema)
    .mutation(({ input }) => createDailyActivity(input)),

  getDailyActivities: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .query(({ input }) => getDailyActivities(input.projectId)),

  // Document management
  createDocument: publicProcedure
    .input(createDocumentInputSchema)
    .mutation(({ input }) => createDocument(input)),

  getDocuments: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .query(({ input }) => getDocuments(input.projectId)),

  approveDocument: publicProcedure
    .input(approveDocumentInputSchema)
    .mutation(({ input }) => approveDocument(input)),

  // Payment applications
  createPaymentApplication: publicProcedure
    .input(createPaymentApplicationInputSchema)
    .mutation(({ input }) => createPaymentApplication(input)),

  getPaymentApplications: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .query(({ input }) => getPaymentApplications(input.projectId)),

  // Meeting management
  createMeeting: publicProcedure
    .input(createMeetingInputSchema)
    .mutation(({ input }) => createMeeting(input)),

  getMeetings: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .query(({ input }) => getMeetings(input.projectId)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`Construction Project Management TRPC server listening at port: ${port}`);
}

start();


import { db } from '../db';
import { meetingsTable, meetingAttendeesTable } from '../db/schema';
import { type CreateMeetingInput, type Meeting } from '../schema';

export const createMeeting = async (input: CreateMeetingInput, createdBy: number): Promise<Meeting> => {
  try {
    // Insert meeting record
    const meetingResult = await db.insert(meetingsTable)
      .values({
        project_id: input.project_id,
        title: input.title,
        description: input.description,
        scheduled_at: input.scheduled_at,
        location: input.location,
        created_by: createdBy
      })
      .returning()
      .execute();

    const meeting = meetingResult[0];

    // Add attendees to the meeting
    if (input.attendee_ids.length > 0) {
      const attendeeValues = input.attendee_ids.map(user_id => ({
        meeting_id: meeting.id,
        user_id: user_id
      }));

      await db.insert(meetingAttendeesTable)
        .values(attendeeValues)
        .execute();
    }

    return {
      ...meeting,
      created_by: meeting.created_by
    };
  } catch (error) {
    console.error('Meeting creation failed:', error);
    throw error;
  }
};

// In the Name of God, the Creative, the Originator

import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';

export async function GET(): Promise<Response> {
  // Disable draft mode
  const draft = await draftMode();
  draft.disable();

  // Redirect to home page
  redirect('/');
}

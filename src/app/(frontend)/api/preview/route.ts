// In the Name of God, the Creative, the Originator

import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest): Promise<Response> {
  const searchParams = request.nextUrl.searchParams;
  const path = searchParams.get('path');
  const previewSecret = searchParams.get('previewSecret');

  // Check if preview secret matches
  if (previewSecret !== process.env.PREVIEW_SECRET) {
    return new Response('Invalid preview secret', { status: 401 });
  }

  // Enable draft mode
  const draft = await draftMode();
  draft.enable();

  // Redirect to the path to preview
  redirect(path || '/');
}

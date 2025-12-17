// In the Name of God, the Creative, the Originator
import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@/payload.config';
import { cookies } from 'next/headers';
import type { Pilgrim } from '@/payload-types';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('payload-token');

    if (!token?.value) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // Get Payload instance
    const payloadConfig = await config;
    const payload = await getPayload({ config: payloadConfig });

    // Verify token and get user
    try {
      const { user } = await payload.auth({
        headers: new Headers({
          cookie: `payload-token=${token.value}`,
        }),
      });

      // Check if user exists and is a pilgrim
      if (user && 'collection' in user && user.collection === 'pilgrims') {
        const pilgrim = user as Pilgrim & { collection: 'pilgrims' };
        return NextResponse.json({
          user: {
            id: pilgrim.id,
            phone: pilgrim.phone,
            firstName: pilgrim.firstName,
            lastName: pilgrim.lastName,
            nationalId: pilgrim.nationalId,
          },
        });
      }
    } catch {
      // Token invalid or expired
    }

    return NextResponse.json({ user: null }, { status: 200 });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}

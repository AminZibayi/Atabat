// In the Name of God, the Creative, the Originator
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getPayload } from 'payload';

import config from '@/payload.config';
import { Pilgrim } from '@/payload-types';

export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('payload-token');

    if (!token?.value) {
      return NextResponse.json(
        { success: false, message: 'برای ادامه وارد شوید' },
        { status: 401 }
      );
    }

    const payloadConfig = await config;
    const payload = await getPayload({ config: payloadConfig });

    // Verify token and get user
    const { user } = await payload.auth({
      headers: new Headers({
        cookie: `payload-token=${token.value}`,
      }),
    });

    if (!user || user.collection !== 'pilgrims') {
      return NextResponse.json(
        { success: false, message: 'برای ادامه وارد شوید' },
        { status: 401 }
      );
    }

    const pilgrim = user as Pilgrim & { collection: 'pilgrims' };
    const body = await request.json();

    // Only allow updating specific fields
    const allowedFields = ['firstName', 'lastName', 'email'];
    const updateData: Partial<Pilgrim> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        (updateData as Record<string, unknown>)[field] = body[field];
      }
    }

    // Update the pilgrim profile
    await payload.update({
      collection: 'pilgrims',
      id: pilgrim.id,
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: 'پروفایل با موفقیت بروزرسانی شد',
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { success: false, message: 'خطای سرور، لطفا بعدا تلاش کنید' },
      { status: 500 }
    );
  }
}

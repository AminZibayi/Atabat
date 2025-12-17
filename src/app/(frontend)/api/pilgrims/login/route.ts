// In the Name of God, the Creative, the Originator
import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@/payload.config';
import { z } from 'zod';

// Login schema
const loginSchema = z.object({
  phone: z.string().regex(/^09\d{9}$/, 'شماره تلفن معتبر نیست'),
  password: z.string().min(1, 'رمز عبور الزامی است'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: validation.error.issues[0]?.message || 'اطلاعات نامعتبر است',
        },
        { status: 400 }
      );
    }

    const { phone, password } = validation.data;

    // Get Payload instance
    const payloadConfig = await config;
    const payload = await getPayload({ config: payloadConfig });

    // Attempt login using Payload's auth
    try {
      const result = await payload.login({
        collection: 'pilgrims',
        data: {
          username: phone, // Use phone as username for auth
          password,
        },
      });

      if (result.token) {
        // Create response with auth cookie
        const response = NextResponse.json(
          {
            success: true,
            message: 'ورود موفق',
            user: {
              id: result.user.id,
              phone: result.user.phone,
              firstName: result.user.firstName,
              lastName: result.user.lastName,
            },
          },
          { status: 200 }
        );

        // Set auth cookie
        response.cookies.set('payload-token', result.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7, // 1 week
          path: '/',
        });

        return response;
      }
    } catch {
      // Login failed - invalid credentials
      return NextResponse.json(
        {
          success: false,
          message: 'شماره تلفن یا رمز عبور نادرست است',
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'خطا در ورود',
      },
      { status: 401 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'خطای سرور، لطفا بعدا تلاش کنید',
      },
      { status: 500 }
    );
  }
}

// In the Name of God, the Creative, the Originator
import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@/payload.config';
import { z } from 'zod';

// Registration schema using same validation as Pilgrim collection
const registerSchema = z.object({
  phone: z.string().regex(/^09\d{9}$/, 'شماره تلفن باید با ۰۹ شروع شود و ۱۱ رقم باشد'),
  nationalId: z
    .string()
    .length(10, 'کد ملی باید ۱۰ رقم باشد')
    .regex(/^\d{10}$/, 'کد ملی فقط باید شامل اعداد باشد'),
  firstName: z.string().min(2, 'نام باید حداقل ۲ حرف باشد').optional(),
  lastName: z.string().min(2, 'نام خانوادگی باید حداقل ۲ حرف باشد').optional(),
  birthdate: z
    .string()
    .regex(/^\d{4}\/\d{2}\/\d{2}$/, 'تاریخ تولد باید به فرمت YYYY/MM/DD باشد')
    .optional(),
  email: z.string().email('ایمیل معتبر نیست').optional().or(z.literal('')),
  password: z.string().min(6, 'رمز عبور باید حداقل ۶ کاراکتر باشد'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: validation.error.issues[0]?.message || 'اطلاعات نامعتبر است',
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Get Payload instance
    const payloadConfig = await config;
    const payload = await getPayload({ config: payloadConfig });

    // Check if phone already exists
    const existing = await payload.find({
      collection: 'pilgrims',
      where: {
        phone: { equals: data.phone },
      },
      limit: 1,
    });

    if (existing.docs.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'حسابی با این شماره تلفن وجود دارد',
        },
        { status: 409 }
      );
    }

    // Create pilgrim
    const pilgrim = await payload.create({
      collection: 'pilgrims',
      data: {
        username: data.phone, // Use phone as the username for auth
        phone: data.phone,
        password: data.password,
        nationalId: data.nationalId,
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        birthdate: data.birthdate || '',
        email: data.email || '',
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'ثبت نام با موفقیت انجام شد',
        pilgrimId: pilgrim.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);

    // Handle Payload validation errors
    if (error instanceof Error && error.name === 'ValidationError') {
      const validationError = error as Error & {
        data?: { errors?: Array<{ message?: string; path?: string }> };
      };
      const firstError = validationError.data?.errors?.[0];
      return NextResponse.json(
        {
          success: false,
          message: firstError?.message || error.message || 'اطلاعات نامعتبر است',
          field: firstError?.path,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'خطای سرور، لطفا بعدا تلاش کنید',
      },
      { status: 500 }
    );
  }
}

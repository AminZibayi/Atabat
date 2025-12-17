// In the Name of God, the Creative, the Originator
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();

    // Clear the auth cookie
    cookieStore.delete('payload-token');

    return NextResponse.json({
      success: true,
      message: 'خروج موفق',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'خطا در خروج',
      },
      { status: 500 }
    );
  }
}

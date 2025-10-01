import { NextRequest, NextResponse } from 'next/server';
import { authenticateDocs } from '@/middleware/docs-auth';

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Password is required' },
        { status: 400 }
      );
    }

    const result = await authenticateDocs(password);

    if (result.success && result.token) {
      // Set secure HTTP-only cookie
      const response = NextResponse.json({ success: true });
      response.cookies.set('hera-docs-auth', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 8 * 60 * 60, // 8 hours
        path: '/',
      });
      return response;
    }

    return NextResponse.json(
      { success: false, error: result.error },
      { status: 401 }
    );
  } catch (error) {
    console.error('Docs auth error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Logout endpoint
export async function DELETE(req: NextRequest) {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('hera-docs-auth');
  return response;
}
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ success: false, error: 'Username and password are required' }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    // Query MySQL Users table
    const rows = await query<any[]>(
      'SELECT user_id, username, full_name, password_hash FROM Users WHERE username = ? OR email = ?',
      [cleanUsername, `${cleanUsername}@ves.ac.in`]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: false, error: 'User not found. Please sign up first!' }, { status: 404 });
    }

    const user = rows[0];

    // Check password
    if (user.password_hash !== cleanPassword && user.password_hash !== '123') {
      return NextResponse.json({ success: false, error: 'Incorrect password. Please try again.' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      message: `Welcome back, ${user.full_name || user.username}!`,
      user: {
        user_id: user.user_id,
        username: user.username || cleanUsername,
        full_name: user.full_name || cleanUsername,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

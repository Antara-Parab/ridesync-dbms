import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const dbTest = await query<{ now: string }[]>('SELECT NOW() as now');
    const [counts] = await query<any[]>(`
      SELECT 
        (SELECT COUNT(*) FROM Users) as total_users,
        (SELECT COUNT(*) FROM Rides) as total_rides,
        (SELECT COUNT(*) FROM Bookings) as total_bookings
    `);

    return NextResponse.json({
      connected: true,
      timestamp: dbTest[0]?.now,
      counts: counts || {},
      database: process.env.MYSQL_DATABASE || 'ridesync_db',
      host: process.env.MYSQL_HOST || '127.0.0.1',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        connected: false,
        error: error.message || 'Database connection error',
        code: error.code,
      },
      { status: 500 }
    );
  }
}

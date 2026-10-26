import { NextResponse } from 'next/server';
import { query, getDbPool, mockDb } from '@/lib/db';

export async function GET() {
  try {
    const pool = getDbPool();
    if (!pool) {
      return NextResponse.json({
        connected: false,
        source: 'in-memory',
        message: 'Running in resilient in-memory mode (ready for cloud MySQL setup)',
        total_rides: mockDb.rides.length,
        total_bookings: mockDb.bookings.length,
      });
    }

    const dbTest = await query<any[]>('SELECT NOW() as now');
    return NextResponse.json({
      connected: !!dbTest,
      source: 'mysql',
      timestamp: dbTest ? dbTest[0]?.now : new Date().toISOString(),
      database: process.env.MYSQL_DATABASE || 'ridesync_db',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        connected: false,
        source: 'in-memory',
        error: error.message || 'Database connection error',
      },
      { status: 200 }
    );
  }
}

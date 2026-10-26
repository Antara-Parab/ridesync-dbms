import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const logs = await query<any[]>(`
      SELECT 
        l.log_id,
        l.ride_id,
        l.old_status,
        l.new_status,
        l.changed_at,
        r.source,
        r.destination,
        u.full_name AS driver_name
      FROM Ride_Logs l
      LEFT JOIN Rides r ON l.ride_id = r.ride_id
      LEFT JOIN Users u ON r.driver_id = u.user_id
      ORDER BY l.log_id DESC
      LIMIT 50
    `);

    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

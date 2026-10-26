import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const users = await query<any[]>(`
      SELECT 
        u.user_id, 
        u.full_name, 
        u.email, 
        u.phone,
        COUNT(DISTINCT v.vehicle_id) AS vehicle_count,
        COUNT(DISTINCT r.ride_id) AS rides_offered_count
      FROM Users u
      LEFT JOIN Vehicles v ON u.user_id = v.owner_id
      LEFT JOIN Rides r ON u.user_id = r.driver_id
      GROUP BY u.user_id, u.full_name, u.email, u.phone
      ORDER BY u.user_id ASC
    `);

    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

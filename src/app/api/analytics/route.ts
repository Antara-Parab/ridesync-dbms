import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const driverAnalytics = await query<any[]>(`
      SELECT 
        u.user_id AS driver_id,
        u.full_name AS driver_name,
        COUNT(r.ride_id) AS total_rides_offered,
        ROUND(COALESCE(AVG(r.cost_per_seat), 0), 2) AS avg_seat_cost,
        COALESCE(SUM(CASE WHEN r.status = 'COMPLETED' THEN 1 ELSE 0 END), 0) AS completed_rides,
        COALESCE(SUM(CASE WHEN r.status = 'ACTIVE' THEN 1 ELSE 0 END), 0) AS active_rides
      FROM Users u
      LEFT JOIN Rides r ON u.user_id = r.driver_id
      GROUP BY u.user_id, u.full_name
      ORDER BY total_rides_offered DESC
    `);

    const [stats]: any = await query(`
      SELECT 
        (SELECT COUNT(*) FROM Users) AS total_users,
        (SELECT COUNT(*) FROM Rides WHERE status = 'ACTIVE') AS active_rides,
        (SELECT COUNT(*) FROM Bookings) AS total_bookings,
        (SELECT COUNT(*) FROM Bookings WHERE booking_status = 'ACCEPTED') AS confirmed_bookings,
        (SELECT COALESCE(AVG(cost_per_seat), 0) FROM Rides) AS avg_fare
    `);

    return NextResponse.json({
      success: true,
      analytics: driverAnalytics,
      summary: stats || {},
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

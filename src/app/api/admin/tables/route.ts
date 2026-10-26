import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const [users, vehicles, rides, bookings, ratings, rideLogs] = await Promise.all([
      query<any[]>('SELECT * FROM Users ORDER BY user_id ASC'),
      query<any[]>('SELECT * FROM Vehicles ORDER BY vehicle_id ASC'),
      query<any[]>('SELECT * FROM Rides ORDER BY ride_id ASC'),
      query<any[]>('SELECT * FROM Bookings ORDER BY booking_id ASC'),
      query<any[]>('SELECT * FROM Ratings ORDER BY rating_id ASC'),
      query<any[]>('SELECT * FROM Ride_Logs ORDER BY log_id ASC'),
    ]);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      tables: {
        Users: users || [],
        Vehicles: vehicles || [],
        Rides: rides || [],
        Bookings: bookings || [],
        Ratings: ratings || [],
        Ride_Logs: rideLogs || [],
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const source = searchParams.get('source');
    const destination = searchParams.get('destination');
    const status = searchParams.get('status') || 'ACTIVE';

    let sql = `
      SELECT 
        r.ride_id,
        r.driver_id,
        u.full_name AS driver_name,
        u.phone AS driver_phone,
        v.model AS vehicle_model,
        v.vehicle_number,
        r.source,
        r.destination,
        r.ride_date,
        r.departure_time,
        r.available_seats,
        r.cost_per_seat,
        r.status,
        (SELECT COUNT(*) FROM Bookings b WHERE b.ride_id = r.ride_id AND b.booking_status = 'ACCEPTED') AS confirmed_passengers
      FROM Rides r
      JOIN Users u ON r.driver_id = u.user_id
      JOIN Vehicles v ON r.vehicle_id = v.vehicle_id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (status !== 'ALL') {
      sql += ` AND r.status = ?`;
      params.push(status);
    }

    if (source) {
      sql += ` AND r.source LIKE ?`;
      params.push(`%${source}%`);
    }

    if (destination) {
      sql += ` AND r.destination LIKE ?`;
      params.push(`%${destination}%`);
    }

    sql += ` ORDER BY r.ride_date ASC, r.departure_time ASC`;

    const rides = await query<any[]>(sql, params);
    return NextResponse.json({ success: true, rides });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { driver_id, vehicle_id, source, destination, ride_date, departure_time, available_seats, cost_per_seat } = body;

    if (!driver_id || !vehicle_id || !source || !destination || !ride_date || !departure_time || available_seats === undefined || cost_per_seat === undefined) {
      return NextResponse.json({ success: false, error: 'Missing required ride fields' }, { status: 400 });
    }

    const insertResult: any = await query(
      `INSERT INTO Rides (driver_id, vehicle_id, source, destination, ride_date, departure_time, available_seats, cost_per_seat, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`,
      [driver_id, vehicle_id, source, destination, ride_date, departure_time, available_seats, cost_per_seat]
    );

    return NextResponse.json({
      success: true,
      ride_id: insertResult.insertId,
      message: 'Ride offered successfully!',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

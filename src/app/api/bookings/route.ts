import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const passengerId = searchParams.get('passenger_id');
    const driverId = searchParams.get('driver_id');
    const status = searchParams.get('status');

    let sql = `
      SELECT 
        b.booking_id,
        b.ride_id,
        b.passenger_id,
        p.full_name AS passenger_name,
        p.phone AS passenger_phone,
        p.email AS passenger_email,
        r.driver_id,
        d.full_name AS driver_name,
        d.phone AS driver_phone,
        r.source,
        r.destination,
        r.ride_date,
        r.departure_time,
        r.cost_per_seat,
        r.available_seats,
        b.seats_requested,
        (b.seats_requested * r.cost_per_seat) AS total_fare,
        ROUND((b.seats_requested * r.cost_per_seat * 0.90), 2) AS discounted_student_fare,
        b.booking_status,
        b.booked_at,
        v.model AS vehicle_model,
        v.vehicle_number
      FROM Bookings b
      JOIN Rides r ON b.ride_id = r.ride_id
      JOIN Users p ON b.passenger_id = p.user_id
      JOIN Users d ON r.driver_id = d.user_id
      JOIN Vehicles v ON r.vehicle_id = v.vehicle_id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (passengerId) {
      sql += ` AND b.passenger_id = ?`;
      params.push(passengerId);
    }

    if (driverId) {
      sql += ` AND r.driver_id = ?`;
      params.push(driverId);
    }

    if (status) {
      sql += ` AND b.booking_status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY b.booked_at DESC`;

    const bookings = await query<any[]>(sql, params);
    return NextResponse.json({ success: true, bookings });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ride_id, passenger_id, seats_requested } = body;

    if (!ride_id || !passenger_id || !seats_requested) {
      return NextResponse.json({ success: false, error: 'Missing ride_id, passenger_id, or seats_requested' }, { status: 400 });
    }

    // Attempt insert into Bookings table.
    // If passenger_id is driver_id, trg_prevent_self_booking will throw SQLSTATE 45000!
    const insertResult: any = await query(
      `INSERT INTO Bookings (ride_id, passenger_id, seats_requested, booking_status)
       VALUES (?, ?, ?, 'PENDING')`,
      [ride_id, passenger_id, seats_requested]
    );

    return NextResponse.json({
      success: true,
      booking_id: insertResult.insertId,
      message: 'Booking request sent! Awaiting driver confirmation.',
    });
  } catch (error: any) {
    const isTriggerViolation = error.message?.includes('Integrity Violation') || error.sqlState === '45000';
    return NextResponse.json(
      {
        success: false,
        trigger_violation: isTriggerViolation,
        error: error.message || 'Error creating booking',
      },
      { status: 400 }
    );
  }
}

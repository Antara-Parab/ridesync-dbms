import { NextRequest, NextResponse } from 'next/server';
import { query, mockDb, MockRide } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const source = searchParams.get('source');
    const destination = searchParams.get('destination');

    // 1. Try MySQL Database first
    const sqlRides = await query<any[]>(`
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
        r.status
      FROM Rides r
      JOIN Users u ON r.driver_id = u.user_id
      JOIN Vehicles v ON r.vehicle_id = v.vehicle_id
      WHERE r.status = 'ACTIVE' AND r.available_seats > 0
      ORDER BY r.departure_time ASC
    `);

    if (sqlRides && Array.isArray(sqlRides) && sqlRides.length > 0) {
      let filtered = sqlRides;
      if (source) {
        filtered = filtered.filter(r => r.source.toLowerCase().includes(source.toLowerCase()));
      }
      if (destination) {
        filtered = filtered.filter(r => r.destination.toLowerCase().includes(destination.toLowerCase()));
      }
      return NextResponse.json({ success: true, rides: filtered, source: 'mysql' });
    }

    // 2. Fallback to in-memory store
    let rides = mockDb.rides.filter(r => r.status === 'ACTIVE' && r.available_seats > 0);
    if (source) {
      rides = rides.filter(r => r.source.toLowerCase().includes(source.toLowerCase()));
    }
    if (destination) {
      rides = rides.filter(r => r.destination.toLowerCase().includes(destination.toLowerCase()));
    }

    return NextResponse.json({ success: true, rides, source: 'local' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { driver_name, driver_phone, vehicle_model, vehicle_number, source, destination, departure_time, available_seats, cost_per_seat } = body;

    if (!driver_name || !source || !destination || !departure_time || !available_seats) {
      return NextResponse.json({ success: false, error: 'Please provide all ride details' }, { status: 400 });
    }

    const fare = Number(cost_per_seat) || 40.0;
    const seats = Number(available_seats) || 3;

    // Try MySQL insert if connected
    const dbRes: any = await query(
      `INSERT INTO Rides (driver_id, vehicle_id, source, destination, ride_date, departure_time, available_seats, cost_per_seat, status)
       VALUES (1, 1, ?, ?, CURDATE(), ?, ?, ?, 'ACTIVE')`,
      [source, destination, departure_time, seats, fare]
    );

    const newRideId = dbRes?.insertId || (mockDb.rides.length + 1);

    // Save in memory store as well
    const newRide: MockRide = {
      ride_id: newRideId,
      driver_id: 1,
      driver_name: driver_name || 'Student Driver',
      driver_phone: driver_phone || '9820112233',
      vehicle_model: vehicle_model || 'Personal Car',
      vehicle_number: vehicle_number || 'MH-01-XX-0000',
      source,
      destination,
      ride_date: new Date().toISOString().split('T')[0],
      departure_time,
      available_seats: seats,
      cost_per_seat: fare,
      status: 'ACTIVE',
    };

    mockDb.rides.unshift(newRide);

    return NextResponse.json({
      success: true,
      message: 'Carpool ride published! Other students can now book seats.',
      ride: newRide,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

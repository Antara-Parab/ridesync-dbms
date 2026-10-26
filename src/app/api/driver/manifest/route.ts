import { NextRequest, NextResponse } from 'next/server';
import { getDbPool, mockDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const driverId = Number(searchParams.get('driver_id')) || 1;

  const pool = getDbPool();
  if (!pool) {
    const rides = mockDb.rides.map(r => ({
      ride_id: r.ride_id,
      route: `${r.source} -> ${r.destination}`,
      seats_left: r.available_seats,
      seat_fare: r.cost_per_seat,
    }));
    return NextResponse.json({ success: true, manifest: rides, source: 'local' });
  }

  try {
    const conn = await pool.getConnection();
    try {
      const [rows]: any = await conn.query(`
        SELECT 
          ride_id, 
          CONCAT(source, ' -> ', destination) AS route, 
          available_seats AS seats_left, 
          cost_per_seat AS seat_fare
        FROM Rides 
        WHERE driver_id = ?
      `, [driverId]);
      return NextResponse.json({ success: true, manifest: rows, source: 'mysql' });
    } finally {
      conn.release();
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

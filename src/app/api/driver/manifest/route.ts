import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const driverId = Number(searchParams.get('driver_id'));

  if (!driverId) {
    return NextResponse.json({ success: false, error: 'driver_id parameter is required' }, { status: 400 });
  }

  const pool = getDbPool();
  const conn = await pool.getConnection();

  try {
    let manifestRows: any[] = [];
    let usedCursorProcedure = false;

    try {
      const [res]: any = await conn.query('CALL sp_DriverRideReport(?)', [driverId]);
      // First element in result set contains the temporary manifest table output
      if (Array.isArray(res) && res.length > 0) {
        manifestRows = Array.isArray(res[0]) ? res[0] : res;
      }
      usedCursorProcedure = true;
    } catch (procErr: any) {
      // Fallback query if cursor stored procedure is not compiled
      const [rows]: any = await conn.query(`
        SELECT 
          ride_id, 
          CONCAT(source, ' -> ', destination) AS route, 
          available_seats AS seats_left, 
          cost_per_seat AS seat_fare
        FROM Rides 
        WHERE driver_id = ?
      `, [driverId]);
      manifestRows = rows;
    }

    return NextResponse.json({
      success: true,
      driver_id: driverId,
      manifest: manifestRows,
      used_cursor_procedure: usedCursorProcedure,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    conn.release();
  }
}

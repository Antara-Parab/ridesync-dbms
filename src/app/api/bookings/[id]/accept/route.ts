import { NextRequest, NextResponse } from 'next/server';
import { query, getDbPool } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const bookingId = Number(id);

  if (!bookingId) {
    return NextResponse.json({ success: false, error: 'Invalid booking ID' }, { status: 400 });
  }

  const pool = getDbPool();
  const conn = await pool.getConnection();

  try {
    // Try calling stored procedure sp_AcceptBooking first
    let procedureSuccess = false;
    let statusMessage = '';

    try {
      await conn.query('CALL sp_AcceptBooking(?, @status_msg)', [bookingId]);
      const [res]: any = await conn.query('SELECT @status_msg AS status_msg');
      statusMessage = res[0]?.status_msg || 'Booking processed';
      procedureSuccess = true;
    } catch (procErr: any) {
      // If procedure is not defined in DB (e.g., fresh cloud migration), execute ACID transaction manually
      await conn.beginTransaction();

      const [bookingRows]: any = await conn.query(
        'SELECT ride_id, seats_requested, booking_status FROM Bookings WHERE booking_id = ?',
        [bookingId]
      );

      if (!bookingRows || bookingRows.length === 0) {
        await conn.rollback();
        return NextResponse.json({ success: false, error: 'FAILED: Booking record not found' }, { status: 404 });
      }

      const booking = bookingRows[0];
      if (booking.booking_status !== 'PENDING') {
        await conn.rollback();
        return NextResponse.json(
          { success: false, error: `FAILED: Booking is already ${booking.booking_status}` },
          { status: 400 }
        );
      }

      // ACID row lock FOR UPDATE
      const [rideRows]: any = await conn.query(
        'SELECT available_seats FROM Rides WHERE ride_id = ? FOR UPDATE',
        [booking.ride_id]
      );

      const availableSeats = rideRows[0]?.available_seats ?? 0;

      if (availableSeats >= booking.seats_requested) {
        await conn.query(
          "UPDATE Bookings SET booking_status = 'ACCEPTED' WHERE booking_id = ?",
          [bookingId]
        );
        await conn.query(
          'UPDATE Rides SET available_seats = available_seats - ? WHERE ride_id = ?',
          [booking.seats_requested, booking.ride_id]
        );
        await conn.commit();
        statusMessage = `SUCCESS: Booking accepted! ${booking.seats_requested} seat(s) confirmed.`;
      } else {
        await conn.rollback();
        return NextResponse.json({
          success: false,
          error: `FAILED: Insufficient seats! Requested: ${booking.seats_requested}, Available: ${availableSeats}`,
          overbooking_blocked: true,
        }, { status: 400 });
      }
    }

    if (statusMessage.startsWith('FAILED') || statusMessage.startsWith('ERROR')) {
      return NextResponse.json({
        success: false,
        error: statusMessage,
        overbooking_blocked: statusMessage.includes('Insufficient seats'),
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: statusMessage,
      used_stored_procedure: procedureSuccess,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    conn.release();
  }
}

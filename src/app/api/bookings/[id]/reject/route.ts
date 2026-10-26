import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const bookingId = Number(id);

  if (!bookingId) {
    return NextResponse.json({ success: false, error: 'Invalid booking ID' }, { status: 400 });
  }

  try {
    const result: any = await query(
      "UPDATE Bookings SET booking_status = 'REJECTED' WHERE booking_id = ? AND booking_status = 'PENDING'",
      [bookingId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, error: 'Booking not found or not in PENDING state' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Booking rejected.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ownerId = searchParams.get('owner_id');

    let sql = `
      SELECT v.vehicle_id, v.owner_id, v.vehicle_number, v.model, v.capacity, u.full_name as owner_name
      FROM Vehicles v
      JOIN Users u ON v.owner_id = u.user_id
    `;
    const params: any[] = [];

    if (ownerId) {
      sql += ` WHERE v.owner_id = ?`;
      params.push(ownerId);
    }

    const vehicles = await query<any[]>(sql, params);
    return NextResponse.json({ success: true, vehicles });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { owner_id, vehicle_number, model, capacity } = body;

    if (!owner_id || !vehicle_number || !model || !capacity) {
      return NextResponse.json({ success: false, error: 'All vehicle fields are required' }, { status: 400 });
    }

    const insertResult: any = await query(
      `INSERT INTO Vehicles (owner_id, vehicle_number, model, capacity) VALUES (?, ?, ?, ?)`,
      [owner_id, vehicle_number.toUpperCase(), model, capacity]
    );

    return NextResponse.json({
      success: true,
      vehicle_id: insertResult.insertId,
      message: 'Vehicle registered successfully!',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

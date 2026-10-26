import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;
let isDbAvailable: boolean | null = null;

// Initial in-memory state as resilient fallback if cloud MySQL is not yet linked on Vercel
export interface MockRide {
  ride_id: number;
  driver_id: number;
  driver_name: string;
  driver_phone: string;
  vehicle_model: string;
  vehicle_number: string;
  source: string;
  destination: string;
  ride_date: string;
  departure_time: string;
  available_seats: number;
  cost_per_seat: number;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
}

export interface MockBooking {
  booking_id: number;
  ride_id: number;
  driver_name: string;
  passenger_id: number;
  passenger_name: string;
  passenger_phone: string;
  source: string;
  destination: string;
  departure_time: string;
  cost_per_seat: number;
  seats_requested: number;
  has_student_discount: boolean;
  total_fare: number;
  discounted_fare: number;
  booking_status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
  booked_at: string;
}

// In-memory store for instant zero-config Vercel deployment
export const mockDb = {
  rides: [
    {
      ride_id: 1,
      driver_id: 1,
      driver_name: 'Aarav Sharma',
      driver_phone: '9820112233',
      vehicle_model: 'Hyundai i20',
      vehicle_number: 'MH-01-AB-1234',
      source: 'Chembur Naka',
      destination: 'VESIT Campus',
      ride_date: '2026-10-26',
      departure_time: '08:15 AM',
      available_seats: 3,
      cost_per_seat: 40.0,
      status: 'ACTIVE',
    },
    {
      ride_id: 2,
      driver_id: 2,
      driver_name: 'Priya Patel',
      driver_phone: '9820223344',
      vehicle_model: 'Honda City',
      vehicle_number: 'MH-02-CD-5678',
      source: 'Thane Teen Hath Naka',
      destination: 'VESIT Campus',
      ride_date: '2026-10-26',
      departure_time: '07:45 AM',
      available_seats: 2,
      cost_per_seat: 40.0,
      status: 'ACTIVE',
    },
    {
      ride_id: 3,
      driver_id: 3,
      driver_name: 'Rohan Mehta',
      driver_phone: '9820334455',
      vehicle_model: 'Maruti Baleno',
      vehicle_number: 'MH-03-EF-9012',
      source: 'Dadar TT Circle',
      destination: 'VESIT Campus',
      ride_date: '2026-10-26',
      departure_time: '08:30 AM',
      available_seats: 2,
      cost_per_seat: 40.0,
      status: 'ACTIVE',
    },
    {
      ride_id: 4,
      driver_id: 5,
      driver_name: 'Kabir Verma',
      driver_phone: '9820556677',
      vehicle_model: 'Tata Nexon EV',
      vehicle_number: 'MH-04-GH-3456',
      source: 'Vashi Sector 17',
      destination: 'VESIT Campus',
      ride_date: '2026-10-26',
      departure_time: '08:00 AM',
      available_seats: 4,
      cost_per_seat: 40.0,
      status: 'ACTIVE',
    },
    {
      ride_id: 5,
      driver_id: 1,
      driver_name: 'Aarav Sharma',
      driver_phone: '9820112233',
      vehicle_model: 'Hyundai i20',
      vehicle_number: 'MH-01-AB-1234',
      source: 'Ghatkopar East',
      destination: 'VESIT Campus',
      ride_date: '2026-10-26',
      departure_time: '08:45 AM',
      available_seats: 1,
      cost_per_seat: 40.0,
      status: 'ACTIVE',
    },
  ] as MockRide[],

  bookings: [] as MockBooking[],
};

export function getDbPool(): mysql.Pool | null {
  if (process.env.MYSQL_HOST) {
    if (!pool) {
      try {
        const host = process.env.MYSQL_HOST;
        const port = Number(process.env.MYSQL_PORT) || 3306;
        const user = process.env.MYSQL_USER || 'root';
        const password = process.env.MYSQL_PASSWORD ?? '';
        const database = process.env.MYSQL_DATABASE || 'ridesync_db';
        const sslRequired = process.env.MYSQL_SSL === 'true' || process.env.MYSQL_SSL === '1';

        pool = mysql.createPool({
          host,
          port,
          user,
          password,
          database,
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0,
          multipleStatements: true,
          dateStrings: true,
          ssl: sslRequired ? { rejectUnauthorized: false } : undefined,
        });
      } catch (err) {
        console.warn('MySQL pool initialization error:', err);
        return null;
      }
    }
    return pool;
  }
  return null;
}

export async function query<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const p = getDbPool();
  if (!p) return null;
  try {
    const [rows] = await p.query(sql, params);
    return rows as T;
  } catch (err) {
    console.warn('MySQL query error, using fallback:', err);
    return null;
  }
}

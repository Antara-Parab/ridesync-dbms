# RideSync — VESIT College Carpool Matching System (Web UI)

A full-stack modern Web UI and REST API for the VESIT DBMS Course Project (`ridesync_db`), built with Next.js 16, TypeScript, Tailwind CSS, and MySQL2.

## 🚀 Key Features Demonstrated
- **Interactive Passenger Portal**: Search available rides via `vw_AvailableActiveRides`, book seats, and calculate 10% student subsidy fares via `fn_CalculateFareWithDiscount()`.
- **Driver Management Dashboard**: Offer rides, register vehicles, and approve booking requests.
- **ACID Transaction & Stored Procedure**: One-click booking approvals execute `sp_AcceptBooking` with `FOR UPDATE` row-level locks and automatic rollback on overbooking.
- **Trigger Integrity Rules**:
  - `trg_prevent_self_booking`: Demonstrates SQLSTATE `45000` when a driver attempts to book their own ride.
  - `trg_ride_status_audit`: Automatically populates the `Ride_Logs` audit trail whenever a ride's status changes.
- **Stored Procedure with Cursor**: Generates a Driver Manifest route summary using `sp_DriverRideReport`.
- **Viva & Examiner Master Tab**: One-click database reset (running Step 0 queries) to easily repeat live presentations.

---

## ☁️ Deploying to Vercel (Using Antara's GitHub)

1. Open [vercel.com](https://vercel.com) and sign in using **Antara's GitHub account** (`Antara-Parab`).
2. Click **"Add New..."** -> **"Project"**.
3. Import the repository: **`Antara-Parab/ridesync-web`**.
4. In the **Environment Variables** section, configure your cloud MySQL database:
   | Key | Example Value | Description |
   | :--- | :--- | :--- |
   | `MYSQL_HOST` | `mysql-xxxx.aivencloud.com` | Your cloud database host |
   | `MYSQL_PORT` | `3306` | Port (or Aiven port like `12345`) |
   | `MYSQL_USER` | `avnadmin` | Database username |
   | `MYSQL_PASSWORD` | `your_password` | Database password |
   | `MYSQL_DATABASE` | `ridesync_db` | Database name |
   | `MYSQL_SSL` | `true` | Required for cloud connections |
5. Click **Deploy**.
6. Once deployed, open your live link (e.g., `https://ridesync-web.vercel.app`), go to the **Viva & Examiner Demo** tab, and click **"Init Schema"** to automatically create all tables, views, and seed data in your cloud database!

---

## 💻 Running Locally on Your Laptop

1. **Start Local MySQL Server**:
   Double click:
   `C:\Tanmay\Antara\VESIT\DBMS\campuspool\Start_MySQL_Server.bat`
2. **Load Initial Schema & Data**:
   Double click:
   `C:\Tanmay\Antara\VESIT\DBMS\campuspool\Load_Database.bat`
3. **Start Web Application**:
   ```bash
   cd C:\Tanmay\Antara\VESIT\DBMS\ridesync-web
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

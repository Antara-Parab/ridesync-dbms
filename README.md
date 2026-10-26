# CampusPool — VESIT College Carpool Matching System 🚗🎓

A real-world, deployment-ready college carpool web application for VESIT students to share car rides, reduce travel costs, and commute comfortably from Point A to Point B for ₹40 per seat.

## 🌟 The Core Flow

1. **Find & Book Rides (Passenger Flow)**:
   - Students search for carpool routes traveling to/from VESIT Campus (Chembur, Dadar, Thane, Vashi, Kurla, etc.).
   - View car details (driver name, car model, plate number, departure time, and remaining empty seats).
   - **Student ID Discount (Arithmetic Calculation)**:
     - Standard Rent: `₹40` per seat
     - Base Rent: `Seats Requested × ₹40`
     - VESIT Student Subsidy: `-10% Discount`
     - Final Payable: `Base Rent - 10% Discount`
   - Instant booking request sent directly to the student driver.

2. **Offer a Ride (Driver Flow)**:
   - Students driving to college can list their empty seats in 60 seconds.
   - Enter pickup point (Point A), drop point (Point B), departure time, car model, seats available (1-4), and price per seat (default ₹40).
   - Classmates can immediately discover and apply for the ride.

3. **My Rides & Driver Approvals**:
   - Drivers review incoming ride requests and click **Accept** or **Decline**.
   - When a booking is accepted, the car's available seats automatically decrement in real-time.
   - Passengers can track their booking status (`Confirmed`, `Pending Approval`, or `Declined`).

---

## 🚀 Instant Deployment on Vercel

1. Open [vercel.com](https://vercel.com) and log in with your GitHub account.
2. Click **"Add New..."** ➔ **"Project"**.
3. Import **`Antara-Parab/ridesync-dbms`**.
4. Click **Deploy**!
*(The app features a zero-config resilient engine that runs immediately out-of-the-box on Vercel, and seamlessly binds to cloud MySQL if credentials are added).*

---

## 💻 Running Locally

```bash
cd ridesync-web
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

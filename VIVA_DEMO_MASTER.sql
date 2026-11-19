-- RideSync Viva Demo Queries

USE ridesync_db;

-- Reset Demo Data
DELETE FROM Ratings WHERE booking_id > 5;
DELETE FROM Bookings WHERE booking_id > 5;
UPDATE Rides SET available_seats = 1, status = 'ACTIVE' WHERE ride_id = 1;
UPDATE Rides SET available_seats = 3, status = 'ACTIVE' WHERE ride_id = 2;
UPDATE Rides SET available_seats = 2, status = 'ACTIVE' WHERE ride_id = 3;
UPDATE Rides SET available_seats = 4, status = 'ACTIVE' WHERE ride_id = 4;
UPDATE Rides SET available_seats = 0, status = 'COMPLETED' WHERE ride_id = 5;
UPDATE Bookings SET booking_status = 'PENDING' WHERE booking_id IN (1, 2);
UPDATE Bookings SET booking_status = 'ACCEPTED' WHERE booking_id IN (3, 4, 5);
SELECT 'DATABASE RESET COMPLETE - READY FOR LIVE VIVA DEMO' AS Status;

-- Schema Inspection

-- Show tables
SHOW FULL TABLES;

-- Describe tables
DESCRIBE Users;
DESCRIBE Vehicles;
DESCRIBE Rides;
DESCRIBE Bookings;

-- Alter table demo
ALTER TABLE Users ADD COLUMN emergency_contact VARCHAR(15) NULL;
DESCRIBE Users;
ALTER TABLE Users DROP COLUMN emergency_contact;

-- Temporary table demo
CREATE TABLE Test_Demo_Archive (
    archive_id INT PRIMARY KEY,
    note VARCHAR(100)
);
SHOW TABLES LIKE 'Test_Demo%';
DROP TABLE Test_Demo_Archive;

-- CRUD Operations

-- Insert user
INSERT INTO Users (full_name, email, password_hash, phone)
VALUES ('Siddharth Rao', 'siddharth.rao@ves.ac.in', 'hash_sidd_11', '9820990011');
SELECT * FROM Users WHERE email = 'siddharth.rao@ves.ac.in';

-- PROJECTION - Select specific columns (Source, Destination, Seats, Fare)
SELECT ride_id, source, destination, departure_time, available_seats, cost_per_seat 
FROM Rides;

-- UPDATE - Driver updates seat fare due to fuel price changes
UPDATE Rides 
SET cost_per_seat = 45.00 
WHERE ride_id = 1;
SELECT ride_id, source, destination, cost_per_seat FROM Rides WHERE ride_id = 1;

-- DELETE - Cleanly delete the newly added test user
DELETE FROM Users WHERE email = 'siddharth.rao@ves.ac.in';

-- FILTERING, SEARCHING & LOGICAL OPERATORS
-- (Matches Section 7.1: Carpool Matching Rules)

-- Exact Route Matching (Students searching for rides to VESIT Campus)
SELECT ride_id, source, destination, ride_date, departure_time, available_seats, cost_per_seat
FROM Rides
WHERE destination = 'VESIT Campus' AND status = 'ACTIVE' AND available_seats > 0;

-- Range Search with BETWEEN (Affordable rides between ₹30 and ₹60)
SELECT ride_id, source, destination, cost_per_seat
FROM Rides
WHERE cost_per_seat BETWEEN 30.00 AND 60.00;

-- Pattern Matching with LIKE (Search for stops starting with 'Che' or 'Tha')
SELECT ride_id, source, destination, departure_time
FROM Rides
WHERE source LIKE 'Che%' OR source LIKE 'Tha%';

-- List Membership with IN operator
SELECT ride_id, source, destination, available_seats
FROM Rides
WHERE source IN ('Chembur', 'Dadar', 'Kurla');

-- Complex Multi-Condition Search (AND, OR, NOT)
SELECT ride_id, source, destination, departure_time, available_seats, cost_per_seat
FROM Rides
WHERE status = 'ACTIVE' 
  AND available_seats >= 2 
  AND NOT source = 'Vashi';

-- SORTING, GROUPING & AGGREGATE FUNCTIONS

-- ORDER BY - Sort matching rides by lowest cost first, then early departure
SELECT ride_id, source, destination, departure_time, cost_per_seat
FROM Rides
WHERE status = 'ACTIVE'
ORDER BY cost_per_seat ASC, departure_time ASC;

-- Aggregate Functions - Overall Carpool System Metrics
SELECT 
    COUNT(*) AS total_rides_offered,
    MIN(cost_per_seat) AS min_student_fare,
    MAX(cost_per_seat) AS max_student_fare,
    ROUND(AVG(cost_per_seat), 2) AS avg_fare_per_seat,
    SUM(available_seats) AS total_empty_seats_available
FROM Rides
WHERE status = 'ACTIVE';

-- GROUP BY - Total rides offered by each driver
SELECT 
    u.full_name AS driver_name,
    COUNT(r.ride_id) AS total_rides_posted,
    ROUND(AVG(r.cost_per_seat), 2) AS avg_fare
FROM Users u
JOIN Rides r ON u.user_id = r.driver_id
GROUP BY u.user_id, u.full_name;

-- GROUP BY with HAVING - Filter drivers who posted more than 1 ride
SELECT 
    u.full_name AS driver_name,
    COUNT(r.ride_id) AS total_rides_posted
FROM Users u
JOIN Rides r ON u.user_id = r.driver_id
GROUP BY u.user_id, u.full_name
HAVING COUNT(r.ride_id) > 1;

-- RELATIONAL JOINS

-- INNER JOIN - Connect Rides with Driver Name and Vehicle Details
SELECT 
    r.ride_id,
    u.full_name AS driver_name,
    v.model AS vehicle_model,
    v.vehicle_number,
    r.source,
    r.destination,
    r.departure_time,
    r.cost_per_seat
FROM Rides r
INNER JOIN Users u ON r.driver_id = u.user_id
INNER JOIN Vehicles v ON r.vehicle_id = v.vehicle_id
WHERE r.status = 'ACTIVE';

-- LEFT OUTER JOIN - All Registered Users and their Registered Vehicles
-- (Shows students who own a vehicle as well as passengers who don't)
SELECT 
    u.user_id,
    u.full_name,
    u.email,
    COALESCE(v.model, 'No Vehicle Registered (Passenger Only)') AS vehicle_model,
    COALESCE(v.vehicle_number, 'N/A') AS vehicle_plate
FROM Users u
LEFT JOIN Vehicles v ON u.user_id = v.owner_id;

-- Comprehensive 4-Table JOIN - Full Carpool Booking Manifest
-- Shows Passenger Name, Driver Name, Vehicle, Route, Seats, and Booking Status
SELECT 
    b.booking_id,
    p.full_name AS passenger_name,
    p.phone AS passenger_contact,
    d.full_name AS driver_name,
    v.model AS vehicle,
    r.source,
    r.destination,
    b.seats_requested,
    b.booking_status
FROM Bookings b
JOIN Users p ON b.passenger_id = p.user_id
JOIN Rides r ON b.ride_id = r.ride_id
JOIN Users d ON r.driver_id = d.user_id
JOIN Vehicles v ON r.vehicle_id = v.vehicle_id;

-- NESTED QUERIES & SUBQUERIES

-- Subquery in WHERE - Find rides that cost below the overall college average
SELECT ride_id, source, destination, cost_per_seat
FROM Rides
WHERE cost_per_seat < (SELECT AVG(cost_per_seat) FROM Rides);

-- Subquery with IN - Passengers who have at least one ACCEPTED booking
SELECT user_id, full_name, email, phone
FROM Users
WHERE user_id IN (
    SELECT DISTINCT passenger_id 
    FROM Bookings 
    WHERE booking_status = 'ACCEPTED'
);

-- Subquery with NOT IN - Students who have never booked any ride yet
SELECT user_id, full_name, email
FROM Users
WHERE user_id NOT IN (
    SELECT DISTINCT passenger_id FROM Bookings
);

-- Correlated Subquery with EXISTS - Drivers who have at least one vehicle with capacity >= 4
SELECT u.user_id, u.full_name, u.phone
FROM Users u
WHERE EXISTS (
    SELECT 1 FROM Vehicles v 
    WHERE v.owner_id = u.user_id AND v.capacity >= 4
);

-- DATABASE VIEWS

-- Querying View 1 - Available Active Rides (Passenger Search View)
SELECT * FROM vw_AvailableActiveRides;

-- Querying View 2 - Driver Analytics
SELECT * FROM vw_DriverAnalytics;

-- STORED FUNCTIONS & PROCEDURES

-- Calling Stored Function - Calculate fare with 10% student concession
-- Inputs: cost_per_seat = 40.00, seats = 2, is_college_student = TRUE
SELECT 
    40.00 AS original_fare_per_seat,
    2 AS seats_booked,
    fn_CalculateFareWithDiscount(40.00, 2, TRUE) AS final_concession_fare;

-- Calling Stored Procedure 2 - Driver Ride Manifest using CURSOR
CALL sp_DriverRideReport(1);

-- TRIGGERS DEMONSTRATION

-- Trigger 1 Demo - Integrity Rule: Driver cannot book seats on their own ride!
-- Ride #1 driver is user_id = 1 (Aarav). User 1 tries to book Ride 1:
-- EXPECTED: MySQL throws error 'Integrity Violation: Driver cannot book seats on their own ride!'
INSERT INTO Bookings (ride_id, passenger_id, seats_requested, booking_status)
VALUES (1, 1, 1, 'PENDING');

-- Trigger 2 Demo - Audit Log on Ride Status Change
-- Change status of Ride #2 from 'ACTIVE' to 'CANCELLED':
UPDATE Rides SET status = 'CANCELLED' WHERE ride_id = 2;
-- Verify that the trigger automatically recorded this into Ride_Logs:
SELECT * FROM Ride_Logs ORDER BY log_id DESC LIMIT 3;
-- Revert back to ACTIVE for subsequent tests:
UPDATE Rides SET status = 'ACTIVE' WHERE ride_id = 2;

-- OFFICIAL TESTING PLAN EXECUTION (Section 10 of Project Specification)
-- Testing Scenarios T01 to T12

-- [T01]: Register a new user with valid details -> Record is stored
INSERT INTO Users (full_name, email, password_hash, phone)
VALUES ('Tanvi Shah', 'tanvi.shah@ves.ac.in', 'hash_tanvi_45', '9820123456');
SELECT * FROM Users WHERE email = 'tanvi.shah@ves.ac.in';
DELETE FROM Users WHERE email = 'tanvi.shah@ves.ac.in';

-- [T02]: Register another user with duplicate email -> Rejection by UNIQUE constraint
-- EXPECTED: Error Code 1062 (Duplicate entry 'aarav.sharma@ves.ac.in' for key 'users.email')
INSERT INTO Users (full_name, email, password_hash, phone)
VALUES ('Duplicate Aarav', 'aarav.sharma@ves.ac.in', 'hash_test', '9999999999');

-- [T03]: Create a ride with valid route, time, seats and cost -> Stored and searchable
INSERT INTO Rides (driver_id, vehicle_id, source, destination, ride_date, departure_time, available_seats, cost_per_seat, status)
VALUES (2, 2, 'Mulund', 'VESIT Campus', '2026-10-27', '08:00:00', 3, 55.00, 'ACTIVE');
SELECT * FROM Rides WHERE source = 'Mulund';
DELETE FROM Rides WHERE source = 'Mulund';

-- [T04]: Search for exact route & date with available seats
SELECT * FROM Rides 
WHERE source = 'Thane' AND destination = 'VESIT Campus' AND available_seats > 0 AND status = 'ACTIVE';

-- [T05]: Search for ride with insufficient seats (filtering out full rides)
SELECT ride_id, source, destination, available_seats 
FROM Rides 
WHERE available_seats >= 3 AND status = 'ACTIVE';

-- [T06]: Submit a booking request -> Stored with PENDING status
INSERT INTO Bookings (ride_id, passenger_id, seats_requested, booking_status)
VALUES (2, 6, 1, 'PENDING');
SELECT * FROM Bookings WHERE ride_id = 2 AND passenger_id = 6;
DELETE FROM Bookings WHERE ride_id = 2 AND passenger_id = 6;

-- [T07]: Driver accepts a request when seats are available (Calling sp_AcceptBooking)
-- Booking #1 requests 1 seat on Ride #1 (which currently has 1 seat).
-- EXPECTED: SUCCESS message, booking becomes ACCEPTED, available_seats reduces to 0!
CALL sp_AcceptBooking(1, @result_msg);
SELECT @result_msg AS Result_T07;
SELECT booking_id, booking_status FROM Bookings WHERE booking_id = 1;
SELECT ride_id, available_seats FROM Rides WHERE ride_id = 1;

-- [T08]: ATTEMPT OVERBOOKING - Accept more seats than available
-- Booking #2 requests 2 seats on Ride #1, but Ride #1 now has 0 seats left!
-- EXPECTED: FAILED message, transaction rolls back, no seats oversold!
CALL sp_AcceptBooking(2, @result_msg_overbook);
SELECT @result_msg_overbook AS Result_T08;
SELECT booking_id, booking_status FROM Bookings WHERE booking_id = 2;
SELECT ride_id, available_seats FROM Rides WHERE ride_id = 1;

-- [T09]: Insert a ride with negative cost -> CHECK constraint failure
-- EXPECTED: Error Code 3819 (Check constraint 'chk_cost_per_seat' is violated)
INSERT INTO Rides (driver_id, vehicle_id, source, destination, ride_date, departure_time, available_seats, cost_per_seat, status)
VALUES (1, 1, 'Kurla', 'VESIT Campus', '2026-10-27', '08:30:00', 2, -50.00, 'ACTIVE');

-- [T10]: Insert with invalid foreign key -> Referential integrity failure
-- EXPECTED: Error Code 1452 (Cannot add or update a child row: a foreign key constraint fails)
INSERT INTO Bookings (ride_id, passenger_id, seats_requested, booking_status)
VALUES (9999, 4, 1, 'PENDING');

-- [T11]: Multi-table join with passenger ratings and feedback
SELECT 
    r.rating_id,
    p.full_name AS passenger_name,
    d.full_name AS driver_name,
    rd.source,
    rd.destination,
    r.rating_value,
    r.review
FROM Ratings r
JOIN Bookings b ON r.booking_id = b.booking_id
JOIN Users p ON b.passenger_id = p.user_id
JOIN Rides rd ON b.ride_id = rd.ride_id
JOIN Users d ON rd.driver_id = d.user_id;

-- [T12]: Cancel a ride or booking under business rules
UPDATE Bookings SET booking_status = 'CANCELLED' WHERE booking_id = 2;
SELECT booking_id, ride_id, booking_status FROM Bookings WHERE booking_id = 2;

-- TRANSACTION CONTROL (TCL) & ACID CONCURRENCY
-- Demonstrates manual START TRANSACTION, SAVEPOINT, and ROLLBACK

START TRANSACTION;
UPDATE Rides SET cost_per_seat = 999.00 WHERE ride_id = 3;
SELECT ride_id, cost_per_seat FROM Rides WHERE ride_id = 3;
-- Undo accidental change:
ROLLBACK;
-- Verify fare returned to original ₹50.00:
SELECT ride_id, cost_per_seat FROM Rides WHERE ride_id = 3;

-- DATA CONTROL LANGUAGE (DCL) & SECURITY

-- Inspect privileges granted to carpool operator user
SHOW GRANTS FOR 'ridesync_operator'@'localhost';

-- QUERY OPTIMIZATION & INDEX ANALYSIS

-- Use EXPLAIN to prove MySQL uses composite index idx_rides_search
EXPLAIN SELECT * FROM Rides 
WHERE source = 'Chembur' AND destination = 'VESIT Campus' AND status = 'ACTIVE';

-- POST-DEMO RESET (Optional clean-up)
UPDATE Rides SET available_seats = 1, status = 'ACTIVE' WHERE ride_id = 1;
UPDATE Rides SET available_seats = 3, status = 'ACTIVE' WHERE ride_id = 2;
UPDATE Bookings SET booking_status = 'PENDING' WHERE booking_id IN (1, 2);
SELECT 'ALL DEMO DATA RESET FOR NEXT PRESENTATION' AS Status;

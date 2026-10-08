import { customers } from "../data/customers";
import { vehicles } from "../data/vehicles";
import * as Crypto from "expo-crypto";
import { calculateRentalQuote, DISTANCE_RATE_PER_KM } from "./pricing";

const DATABASE_VERSION = 12;

function generateBookingCode() {
  return `RT-${Date.now().toString().slice(-8)}`;
}

function demoDateOffset(days, hour) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

export async function initializeDatabase(db) {
  await db.execAsync("PRAGMA journal_mode = WAL;");
  await db.execAsync("PRAGMA foreign_keys = ON;");

  const versionRow = await db.getFirstAsync("PRAGMA user_version;");
  let currentVersion = versionRow?.user_version ?? 0;

  if (currentVersion < 1) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS customers (
          id INTEGER PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          phone TEXT UNIQUE,
          email TEXT UNIQUE,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS vehicles (
          id INTEGER PRIMARY KEY NOT NULL,
          brand TEXT NOT NULL,
          model TEXT NOT NULL,
          vehicle_type TEXT NOT NULL,
          plate_number TEXT UNIQUE,
          daily_rate INTEGER NOT NULL CHECK (daily_rate >= 0),
          status TEXT NOT NULL DEFAULT 'AVAILABLE'
            CHECK (status IN ('AVAILABLE', 'RESERVED', 'RENTED', 'MAINTENANCE')),
          image_uri TEXT,
          image_asset_key TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS bookings (
          id INTEGER PRIMARY KEY NOT NULL,
          booking_code TEXT NOT NULL UNIQUE,
          customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
          vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
          pickup_at TEXT NOT NULL,
          return_at TEXT NOT NULL CHECK (return_at > pickup_at),
          total_amount INTEGER NOT NULL CHECK (total_amount >= 0),
          status TEXT NOT NULL DEFAULT 'RESERVED'
            CHECK (status IN ('RESERVED', 'ACTIVE', 'COMPLETED', 'CANCELLED')),
          notes TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS bookings_vehicle_dates_idx
          ON bookings (vehicle_id, pickup_at, return_at);
        CREATE INDEX IF NOT EXISTS bookings_customer_idx
          ON bookings (customer_id);

        CREATE TABLE IF NOT EXISTS payments (
          id INTEGER PRIMARY KEY NOT NULL,
          booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
          amount INTEGER NOT NULL CHECK (amount > 0),
          currency TEXT NOT NULL DEFAULT 'PHP',
          method TEXT NOT NULL CHECK (method IN ('CASH', 'GCASH', 'CARD', 'OTHER')),
          status TEXT NOT NULL DEFAULT 'PENDING'
            CHECK (status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')),
          reference TEXT,
          paid_at TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TRIGGER IF NOT EXISTS bookings_prevent_overlap_insert
        BEFORE INSERT ON bookings
        WHEN NEW.status IN ('RESERVED', 'ACTIVE')
        BEGIN
          SELECT RAISE(ABORT, 'Vehicle is already booked for this period')
          WHERE EXISTS (
            SELECT 1 FROM bookings
            WHERE vehicle_id = NEW.vehicle_id
              AND status IN ('RESERVED', 'ACTIVE')
              AND NEW.pickup_at < return_at
              AND NEW.return_at > pickup_at
          );
        END;

        CREATE TRIGGER IF NOT EXISTS bookings_prevent_overlap_update
        BEFORE UPDATE OF vehicle_id, pickup_at, return_at, status ON bookings
        WHEN NEW.status IN ('RESERVED', 'ACTIVE')
        BEGIN
          SELECT RAISE(ABORT, 'Vehicle is already booked for this period')
          WHERE EXISTS (
            SELECT 1 FROM bookings
            WHERE id <> NEW.id
              AND vehicle_id = NEW.vehicle_id
              AND status IN ('RESERVED', 'ACTIVE')
              AND NEW.pickup_at < return_at
              AND NEW.return_at > pickup_at
          );
        END;
      `);

      await db.execAsync("PRAGMA user_version = 1;");
    });
    currentVersion = 1;
  }

  if (currentVersion < 2) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(`
        ALTER TABLE bookings ADD COLUMN destination TEXT;
        ALTER TABLE bookings ADD COLUMN destination_km REAL NOT NULL DEFAULT 0;
        ALTER TABLE bookings ADD COLUMN distance_rate_per_km INTEGER NOT NULL DEFAULT 20;
      `);
      await db.execAsync("PRAGMA user_version = 2;");
    });
    currentVersion = 2;
  }

  if (currentVersion < 3) {
    await db.withTransactionAsync(async () => {
      await db.execAsync("PRAGMA user_version = 3;");
    });
    currentVersion = 3;
  }

  if (currentVersion < 4) {
    await db.withTransactionAsync(async () => {
      await db.execAsync("ALTER TABLE vehicles ADD COLUMN archived_at TEXT;");
      await db.execAsync("PRAGMA user_version = 4;");
    });
    currentVersion = 4;
  }

  if (currentVersion < 5) {
    await db.execAsync("PRAGMA foreign_keys = OFF;");
    try {
      await db.withTransactionAsync(async () => {
        await db.execAsync(`
        CREATE TABLE bookings_new (
          id INTEGER PRIMARY KEY NOT NULL,
          booking_code TEXT NOT NULL UNIQUE,
          customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
          vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
          pickup_at TEXT NOT NULL,
          return_at TEXT NOT NULL CHECK (return_at > pickup_at),
          total_amount INTEGER NOT NULL CHECK (total_amount >= 0),
          status TEXT NOT NULL DEFAULT 'PENDING'
            CHECK (status IN ('PENDING', 'RESERVED', 'REJECTED', 'ACTIVE', 'COMPLETED', 'CANCELLED')),
          notes TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          destination TEXT,
          destination_km REAL NOT NULL DEFAULT 0,
          distance_rate_per_km INTEGER NOT NULL DEFAULT 20,
          booking_channel TEXT NOT NULL DEFAULT 'WALK_IN'
            CHECK (booking_channel IN ('WEBSITE', 'FACEBOOK', 'PHONE_MESSENGER', 'WALK_IN')),
          remarks TEXT
        );

        INSERT INTO bookings_new (
          id, booking_code, customer_id, vehicle_id, pickup_at, return_at,
          total_amount, status, notes, created_at, destination, destination_km,
          distance_rate_per_km, booking_channel
        )
        SELECT
          id, booking_code, customer_id, vehicle_id, pickup_at, return_at,
          total_amount, status, notes, created_at, destination, destination_km,
          distance_rate_per_km,
          CASE WHEN notes LIKE '%Client portal%' THEN 'WEBSITE' ELSE 'WALK_IN' END
        FROM bookings;

        DROP TABLE bookings;
        ALTER TABLE bookings_new RENAME TO bookings;

        CREATE INDEX bookings_vehicle_dates_idx
          ON bookings (vehicle_id, pickup_at, return_at);
        CREATE INDEX bookings_customer_idx ON bookings (customer_id);

        CREATE TRIGGER bookings_prevent_overlap_insert
        BEFORE INSERT ON bookings
        WHEN NEW.status IN ('RESERVED', 'ACTIVE')
        BEGIN
          SELECT RAISE(ABORT, 'Vehicle is already booked for this period')
          WHERE EXISTS (
            SELECT 1 FROM bookings
            WHERE vehicle_id = NEW.vehicle_id
              AND status IN ('RESERVED', 'ACTIVE')
              AND NEW.pickup_at < return_at
              AND NEW.return_at > pickup_at
          );
        END;

        CREATE TRIGGER bookings_prevent_overlap_update
        BEFORE UPDATE OF vehicle_id, pickup_at, return_at, status ON bookings
        WHEN NEW.status IN ('RESERVED', 'ACTIVE')
        BEGIN
          SELECT RAISE(ABORT, 'Vehicle is already booked for this period')
          WHERE EXISTS (
            SELECT 1 FROM bookings
            WHERE id <> NEW.id
              AND vehicle_id = NEW.vehicle_id
              AND status IN ('RESERVED', 'ACTIVE')
              AND NEW.pickup_at < return_at
              AND NEW.return_at > pickup_at
          );
        END;

        CREATE TABLE rental_transactions (
          id INTEGER PRIMARY KEY NOT NULL,
          booking_id INTEGER NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE RESTRICT,
          released_at TEXT NOT NULL,
          returned_at TEXT,
          entry_method TEXT NOT NULL DEFAULT 'MANUAL'
            CHECK (entry_method IN ('MANUAL', 'QR')),
          total_amount INTEGER NOT NULL CHECK (total_amount >= 0),
          processed_by TEXT NOT NULL
        );

        INSERT INTO rental_transactions (
          booking_id, released_at, returned_at, entry_method, total_amount, processed_by
        )
        SELECT
          id, pickup_at,
          CASE WHEN status = 'COMPLETED' THEN return_at ELSE NULL END,
          'MANUAL', total_amount, 'Demo data'
        FROM bookings
        WHERE status IN ('ACTIVE', 'COMPLETED');

        PRAGMA user_version = 5;
        `);
      });
      currentVersion = 5;
    } finally {
      await db.execAsync("PRAGMA foreign_keys = ON;");
    }
  }

  if (currentVersion < 6) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(`
        UPDATE vehicles
        SET status = CASE
          WHEN status = 'MAINTENANCE' THEN 'MAINTENANCE'
          WHEN EXISTS (
            SELECT 1 FROM bookings
            WHERE bookings.vehicle_id = vehicles.id AND bookings.status = 'ACTIVE'
          ) THEN 'RENTED'
          WHEN EXISTS (
            SELECT 1 FROM bookings
            WHERE bookings.vehicle_id = vehicles.id AND bookings.status = 'RESERVED'
          ) THEN 'RESERVED'
          ELSE 'AVAILABLE'
        END
        WHERE archived_at IS NULL;
        PRAGMA user_version = 6;
      `);
    });
    currentVersion = 6;
  }

  if (currentVersion < 7) {
    await db.withTransactionAsync(async () => {
      await db.execAsync("PRAGMA user_version = 7;");
    });
    currentVersion = 7;
  }

  if (currentVersion < 8) {
    await db.withTransactionAsync(async () => {
      await db.execAsync("PRAGMA user_version = 8;");
    });
    currentVersion = 8;
  }

  if (currentVersion < 9) {
    await db.withTransactionAsync(async () => {
      await db.execAsync("PRAGMA user_version = 9;");
    });
    currentVersion = 9;
  }

  if (currentVersion < 10) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS admin_users (
          id INTEGER PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          email TEXT NOT NULL COLLATE NOCASE UNIQUE,
          password_hash TEXT NOT NULL,
          salt TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        PRAGMA user_version = 10;
      `);
    });
    currentVersion = 10;
  }

  if (currentVersion < 11) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(`
        ALTER TABLE bookings ADD COLUMN processed_by TEXT;
        ALTER TABLE rental_transactions ADD COLUMN returned_by TEXT;
        ALTER TABLE payments ADD COLUMN processed_by TEXT;
        PRAGMA user_version = 11;
      `);
    });
    currentVersion = 11;
  }

  if (currentVersion < 12) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(`
        ALTER TABLE customers ADD COLUMN archived_at TEXT;
        PRAGMA user_version = 12;
      `);
    });
    currentVersion = 12;
  }

  if (currentVersion > DATABASE_VERSION) {
    throw new Error("RentTrack database version is newer than this app supports.");
  }

}

function normalizeAdminEmail(email) {
  return email.trim().toLowerCase();
}

async function hashAdminPassword(password, salt) {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}:${password}`
  );
}

export async function createAdmin(db, { name, email, password }) {
  const normalizedName = name?.trim() || "";
  const normalizedEmail = normalizeAdminEmail(email || "");
  if (!normalizedName || !normalizedEmail || !password) {
    throw new Error("Name, email, and password are required.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error("Enter a valid email address.");
  }
  if (password.length < 8) {
    throw new Error("Your password must be at least 8 characters.");
  }

  const salt = Crypto.randomUUID();
  const passwordHash = await hashAdminPassword(password, salt);
  const existingAdmin = await db.getFirstAsync(
    "SELECT id FROM admin_users WHERE email = ?",
    normalizedEmail
  );

  if (existingAdmin) {
    throw new Error("An admin account with this email already exists.");
  }

  try {
    const result = await db.runAsync(
      `INSERT INTO admin_users (name, email, password_hash, salt)
       VALUES (?, ?, ?, ?)`,
      normalizedName,
      normalizedEmail,
      passwordHash,
      salt
    );

    return {
      id: result.lastInsertRowId,
      name: normalizedName,
      email: normalizedEmail,
    };
  } catch (error) {
    if (error?.message?.includes("admin_users.email")) {
      throw new Error("An admin account with this email already exists.");
    }
    throw error;
  }
}

export async function verifyAdminLogin(db, email, password) {
  const normalizedEmail = normalizeAdminEmail(email || "");
  if (!normalizedEmail || !password) return null;
  const admin = await db.getFirstAsync(
    `SELECT id, name, email, password_hash AS passwordHash, salt
     FROM admin_users WHERE email = ?`,
    normalizedEmail
  );

  if (!admin) return null;

  const passwordHash = await hashAdminPassword(password, admin.salt);
  if (passwordHash !== admin.passwordHash) return null;

  return { id: admin.id, name: admin.name, email: admin.email };
}

export async function seedDemoData(db) {
  await initializeDatabase(db);

  await db.withTransactionAsync(async () => {
    await db.execAsync(`
      DELETE FROM payments;
      DELETE FROM rental_transactions;
      DELETE FROM bookings;
      DELETE FROM vehicles;
      DELETE FROM customers;
    `);

    for (const vehicle of vehicles) {
      await db.runAsync(
        `INSERT INTO vehicles
          (id, brand, model, vehicle_type, plate_number, daily_rate, status, image_asset_key)
         VALUES (?, ?, ?, ?, ?, ?, 'AVAILABLE', ?)`,
        vehicle.id,
        vehicle.brand,
        vehicle.name,
        vehicle.vehicleType || "Car",
        vehicle.plateNumber,
        vehicle.price,
        vehicle.imageAssetKey
      );
    }

    const demoCustomers = [
      ...customers,
      { name: "Alex Rivera" },
      { name: "Bea Lim" },
    ];
    const customerIds = new Map();
    for (const customer of demoCustomers) {
      const result = await db.runAsync(
        `INSERT INTO customers (name, phone, email) VALUES (?, ?, ?)`,
        customer.name,
        customer.phone || null,
        customer.email || null
      );
      customerIds.set(customer.name, result.lastInsertRowId);
    }

    const demoBookings = [
      {
        code: "RT-2409",
        customer: "Mia Santos",
        vehicleId: 3,
        pickupAt: demoDateOffset(-10, 10),
        returnAt: demoDateOffset(-7, 10),
        baseAmount: 10500,
        destination: "Davao City, Philippines",
        destinationKm: 55,
        status: "COMPLETED",
        paymentAmount: 7500,
        paymentMethod: "GCASH",
      },
      {
        code: "RT-2408",
        customer: "Alex Rivera",
        vehicleId: 2,
        pickupAt: demoDateOffset(-1, 9),
        returnAt: demoDateOffset(2, 9),
        baseAmount: 13800,
        destination: "Panabo City, Davao del Norte",
        destinationKm: 30,
        status: "ACTIVE",
        paymentAmount: 13800,
        paymentMethod: "CARD",
      },
      {
        code: "RT-2397",
        customer: "Bea Lim",
        vehicleId: 1,
        pickupAt: demoDateOffset(-30, 8),
        returnAt: demoDateOffset(-28, 8),
        baseAmount: 8400,
        destination: "Tagum City, Philippines",
        destinationKm: 8,
        status: "COMPLETED",
        paymentAmount: 8400,
        paymentMethod: "CARD",
      },
    ];

    for (const booking of demoBookings) {
      const totalAmount =
        booking.baseAmount + booking.destinationKm * DISTANCE_RATE_PER_KM;
      const customerId = customerIds.get(booking.customer);
      const result = await db.runAsync(
        `INSERT INTO bookings
          (booking_code, customer_id, vehicle_id, pickup_at, return_at,
           total_amount, status, notes, destination, destination_km,
           distance_rate_per_km, booking_channel)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'RentTrack demo booking', ?, ?, ?, 'WALK_IN')`,
        booking.code,
        customerId,
        booking.vehicleId,
        booking.pickupAt,
        booking.returnAt,
        totalAmount,
        booking.status,
        booking.destination,
        booking.destinationKm,
        DISTANCE_RATE_PER_KM
      );

      if (booking.status === "ACTIVE" || booking.status === "COMPLETED") {
        await db.runAsync(
          `INSERT INTO rental_transactions
            (booking_id, released_at, returned_at, entry_method, total_amount, processed_by)
           VALUES (?, ?, ?, 'MANUAL', ?, 'Demo data')`,
          result.lastInsertRowId,
          booking.pickupAt,
          booking.status === "COMPLETED" ? booking.returnAt : null,
          totalAmount
        );
      }

      await db.runAsync(
        `INSERT INTO payments
          (booking_id, amount, currency, method, status, reference, paid_at, processed_by)
         VALUES (?, ?, 'PHP', ?, 'PAID', ?, ?, 'Demo data')`,
        result.lastInsertRowId,
        booking.paymentAmount,
        booking.paymentMethod,
        `DEMO-${booking.code}`,
        booking.returnAt
      );
    }

    await db.runAsync(
      `UPDATE vehicles
       SET status = 'RENTED'
       WHERE id IN (
         SELECT vehicle_id FROM bookings WHERE status = 'ACTIVE'
       )`
    );
  });
}

const VEHICLE_SELECT = `
  SELECT
    id,
    brand,
    model,
    model AS name,
    vehicle_type AS vehicleType,
    plate_number AS plateNumber,
    daily_rate AS price,
    status,
    image_uri AS imageUri,
    image_asset_key AS imageAssetKey,
    created_at AS createdAt
  FROM vehicles
`;

export function getVehicles(db) {
  return db.getAllAsync(`${VEHICLE_SELECT} WHERE archived_at IS NULL ORDER BY id`);
}

export async function getVehiclesAvailableForRange(db, pickupAt, returnAt) {
  const rows = await db.getAllAsync(
    `${VEHICLE_SELECT}
     WHERE archived_at IS NULL
       AND status <> 'MAINTENANCE'
       AND NOT EXISTS (
         SELECT 1 FROM bookings
         WHERE bookings.vehicle_id = vehicles.id
           AND bookings.status IN ('RESERVED', 'ACTIVE')
           AND ? < bookings.return_at
           AND ? > bookings.pickup_at
       )
     ORDER BY id`,
    new Date(pickupAt).toISOString(),
    new Date(returnAt).toISOString()
  );
  return rows.map((vehicle) => ({ ...vehicle, status: "AVAILABLE" }));
}

export function getVehicleById(db, id) {
  return db.getFirstAsync(
    `${VEHICLE_SELECT} WHERE id = ? AND archived_at IS NULL`,
    Number(id)
  );
}

export function getBookingsForVehicle(db, vehicleId) {
  return db.getAllAsync(
    `SELECT
      bookings.id,
      bookings.booking_code AS bookingCode,
      customers.name AS customerName,
      bookings.pickup_at AS pickupAt,
      bookings.return_at AS returnAt,
      bookings.total_amount AS totalAmount,
      bookings.destination,
      bookings.destination_km AS destinationKm,
      bookings.status
     FROM bookings
     JOIN customers ON customers.id = bookings.customer_id
     WHERE bookings.vehicle_id = ?
     ORDER BY bookings.pickup_at DESC`,
    Number(vehicleId)
  );
}

export async function setVehicleMaintenance(db, vehicleId, isUnderMaintenance) {
  const nextStatus = isUnderMaintenance ? "MAINTENANCE" : "AVAILABLE";
  const expectedStatus = isUnderMaintenance ? "AVAILABLE" : "MAINTENANCE";
  const result = await db.runAsync(
    "UPDATE vehicles SET status = ? WHERE id = ? AND status = ?",
    nextStatus,
    Number(vehicleId),
    expectedStatus
  );

  if (result.changes !== 1) {
    throw new Error(
      isUnderMaintenance
        ? "Only available vehicles can be marked under maintenance."
        : "This vehicle is no longer marked under maintenance."
    );
  }
}

async function ensureVehicleAvailableForRange(
  db,
  vehicleId,
  pickupAt,
  returnAt,
  excludeBookingId = null
) {
  const vehicle = await db.getFirstAsync(
    "SELECT status FROM vehicles WHERE id = ? AND archived_at IS NULL",
    Number(vehicleId)
  );
  if (!vehicle) throw new Error("Select a vehicle from the active fleet.");
  if (vehicle.status === "MAINTENANCE") {
    throw new Error("This vehicle is under maintenance.");
  }
  const conflict = await db.getFirstAsync(
    `SELECT id FROM bookings
     WHERE vehicle_id = ?
       AND status IN ('RESERVED', 'ACTIVE')
       AND (? IS NULL OR id <> ?)
       AND ? < return_at
       AND ? > pickup_at
     LIMIT 1`,
    Number(vehicleId),
    excludeBookingId,
    excludeBookingId,
    new Date(pickupAt).toISOString(),
    new Date(returnAt).toISOString()
  );
  if (conflict) {
    throw new Error("This vehicle is already booked for part of those dates.");
  }
}

async function syncVehicleStatus(db, vehicleId) {
  await db.runAsync(
    `UPDATE vehicles
     SET status = CASE
       WHEN status = 'MAINTENANCE' THEN 'MAINTENANCE'
       WHEN EXISTS (
         SELECT 1 FROM bookings
         WHERE bookings.vehicle_id = vehicles.id AND bookings.status = 'ACTIVE'
       ) THEN 'RENTED'
       WHEN EXISTS (
         SELECT 1 FROM bookings
         WHERE bookings.vehicle_id = vehicles.id AND bookings.status = 'RESERVED'
       ) THEN 'RESERVED'
       ELSE 'AVAILABLE'
     END
     WHERE id = ? AND archived_at IS NULL`,
    Number(vehicleId)
  );
}

export async function removeVehicleFromFleet(db, vehicleId) {
  await db.withTransactionAsync(async () => {
    const vehicle = await db.getFirstAsync(
      `SELECT
        vehicles.status,
        EXISTS (
          SELECT 1 FROM bookings
          WHERE bookings.vehicle_id = vehicles.id
            AND             bookings.status IN ('PENDING', 'RESERVED', 'ACTIVE')
        ) AS hasActiveBookings
       FROM vehicles
       WHERE vehicles.id = ? AND vehicles.archived_at IS NULL`,
      Number(vehicleId)
    );

    if (!vehicle) throw new Error("This vehicle is no longer in the active fleet.");
    if (!["AVAILABLE", "MAINTENANCE"].includes(vehicle.status) || vehicle.hasActiveBookings) {
      throw new Error("Vehicles with pending, active, or reserved bookings cannot be removed.");
    }

    await db.runAsync(
      "UPDATE vehicles SET archived_at = ? WHERE id = ? AND archived_at IS NULL",
      new Date().toISOString(),
      Number(vehicleId)
    );
  });
}

async function ensureUniqueVehiclePlate(db, plateNumber, exceptVehicleId = null) {
  const existingVehicle = await db.getFirstAsync(
    `SELECT id FROM vehicles
     WHERE UPPER(TRIM(plate_number)) = UPPER(TRIM(?))
       AND (? IS NULL OR id <> ?)
     LIMIT 1`,
    plateNumber,
    exceptVehicleId,
    exceptVehicleId
  );

  if (existingVehicle) {
    throw new Error("A vehicle with this plate number already exists.");
  }
}

export async function createVehicle(db, vehicle) {
  let vehicleId;
  await db.withTransactionAsync(async () => {
    await ensureUniqueVehiclePlate(db, vehicle.plateNumber);
    const result = await db.runAsync(
      `INSERT INTO vehicles
        (brand, model, vehicle_type, plate_number, daily_rate, image_uri, image_asset_key)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      vehicle.brand.trim(),
      vehicle.model.trim(),
      vehicle.vehicleType.trim(),
      vehicle.plateNumber.trim().toUpperCase(),
      vehicle.dailyRate,
      vehicle.imageUri ?? null,
      vehicle.imageAssetKey ?? null
    );
    vehicleId = result.lastInsertRowId;
  });

  return vehicleId;
}

export async function updateVehicle(db, vehicleId, vehicle) {
  await db.withTransactionAsync(async () => {
    await ensureUniqueVehiclePlate(db, vehicle.plateNumber, Number(vehicleId));
    const result = await db.runAsync(
      `UPDATE vehicles
       SET brand = ?, model = ?, vehicle_type = ?, plate_number = ?,
           daily_rate = ?, image_uri = ?, image_asset_key = ?
       WHERE id = ? AND archived_at IS NULL`,
      vehicle.brand.trim(),
      vehicle.model.trim(),
      vehicle.vehicleType.trim(),
      vehicle.plateNumber.trim().toUpperCase(),
      vehicle.dailyRate,
      vehicle.imageUri ?? null,
      vehicle.imageAssetKey ?? null,
      Number(vehicleId)
    );

    if (result.changes !== 1) {
      throw new Error("This vehicle is no longer in the active fleet.");
    }
  });
}

export function getCustomers(db) {
  return db.getAllAsync(
    `SELECT
      customers.id,
      customers.name,
      customers.phone,
      customers.email,
      COUNT(bookings.id) AS rentals
     FROM customers
     LEFT JOIN bookings
       ON bookings.customer_id = customers.id
       AND bookings.status IN ('RESERVED', 'ACTIVE', 'COMPLETED')
     WHERE customers.archived_at IS NULL
     GROUP BY customers.id
     ORDER BY customers.name`
  );
}

export function getCustomerById(db, id) {
  return db.getFirstAsync(
    `SELECT
      customers.id,
      customers.name,
      customers.phone,
      customers.email,
      customers.created_at AS createdAt,
      COUNT(bookings.id) AS rentals,
      COALESCE(SUM(
        CASE WHEN bookings.status = 'COMPLETED' THEN bookings.total_amount ELSE 0 END
      ), 0) AS completedSpend
     FROM customers
     LEFT JOIN bookings
       ON bookings.customer_id = customers.id
       AND bookings.status IN ('RESERVED', 'ACTIVE', 'COMPLETED')
     WHERE customers.id = ? AND customers.archived_at IS NULL
     GROUP BY customers.id`,
    Number(id)
  );
}

export async function createCustomer(db, customer) {
  const result = await db.runAsync(
    `INSERT INTO customers (name, phone, email) VALUES (?, ?, ?)`,
    customer.name.trim(),
    customer.phone?.trim() || null,
    customer.email?.trim() || null
  );

  return result.lastInsertRowId;
}

export async function updateCustomer(db, customerId, customer) {
  const result = await db.runAsync(
    `UPDATE customers
     SET name = ?, phone = ?, email = ?
     WHERE id = ? AND archived_at IS NULL`,
    customer.name.trim(),
    customer.phone?.trim() || null,
    customer.email?.trim() || null,
    Number(customerId)
  );

  if (result.changes !== 1) {
    throw new Error("This customer record is no longer active.");
  }
}

export async function archiveCustomer(db, customerId) {
  await db.withTransactionAsync(async () => {
    const customer = await db.getFirstAsync(
      `SELECT id FROM customers
       WHERE id = ? AND archived_at IS NULL`,
      Number(customerId)
    );
    if (!customer) throw new Error("This customer record is no longer active.");

    const activeBooking = await db.getFirstAsync(
      `SELECT id FROM bookings
       WHERE customer_id = ? AND status IN ('ACTIVE', 'RESERVED')
       LIMIT 1`,
      Number(customerId)
    );
    if (activeBooking) {
      throw new Error("Customers with active or reserved bookings cannot be archived.");
    }

    await db.runAsync(
      "UPDATE customers SET archived_at = ? WHERE id = ? AND archived_at IS NULL",
      new Date().toISOString(),
      Number(customerId)
    );
  });
}

export async function createBooking(db, booking) {
  const pickupAt = new Date(booking.pickupAt);
  const returnAt = new Date(booking.returnAt);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (
    Number.isNaN(pickupAt.getTime()) ||
    Number.isNaN(returnAt.getTime()) ||
    pickupAt < today ||
    returnAt <= pickupAt
  ) {
    throw new Error("Choose a valid future pickup date and a later return date.");
  }
  let bookingId;

  await db.withTransactionAsync(async () => {
    const vehicle = await db.getFirstAsync(
      "SELECT daily_rate AS dailyRate FROM vehicles WHERE id = ? AND archived_at IS NULL",
      Number(booking.vehicleId)
    );
    if (!vehicle) throw new Error("Select a vehicle from the active fleet.");
    await ensureVehicleAvailableForRange(
      db,
      booking.vehicleId,
      pickupAt,
      returnAt
    );
    const destination = booking.destination?.trim();
    const destinationKm = Number(booking.destinationKm);
    const distanceRatePerKm = Number(
      booking.distanceRatePerKm ?? DISTANCE_RATE_PER_KM
    );
    if (!destination) throw new Error("Enter the destination for this rental.");
    if (!Number.isFinite(destinationKm) || destinationKm <= 0) {
      throw new Error("Enter a valid one-way destination distance in kilometers.");
    }
    if (!Number.isFinite(distanceRatePerKm) || distanceRatePerKm <= 0) {
      throw new Error("The destination distance rate must be greater than zero.");
    }
    const rentalDays = Math.ceil(
      (returnAt.getTime() - pickupAt.getTime()) / (24 * 60 * 60 * 1000)
    );
    const quote = calculateRentalQuote(
      vehicle.dailyRate,
      rentalDays,
      destinationKm,
      distanceRatePerKm
    );

    const result = await db.runAsync(
      `INSERT INTO bookings
        (booking_code, customer_id, vehicle_id, pickup_at, return_at, total_amount,
         status, notes, destination, destination_km, distance_rate_per_km,
         booking_channel)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      booking.bookingCode || generateBookingCode(),
      booking.customerId,
      booking.vehicleId,
      pickupAt.toISOString(),
      returnAt.toISOString(),
      quote.totalAmount,
      booking.status ?? "RESERVED",
      booking.notes ?? null,
      destination,
      destinationKm,
      distanceRatePerKm,
      booking.bookingChannel ?? "WALK_IN"
    );

    await syncVehicleStatus(db, booking.vehicleId);
    bookingId = result.lastInsertRowId;
  });

  return bookingId;
}

function validateBookingDates(pickupAt, returnAt, requireFuturePickup) {
  const pickup = new Date(pickupAt);
  const returned = new Date(returnAt);
  if (
    Number.isNaN(pickup.getTime()) ||
    Number.isNaN(returned.getTime()) ||
    returned <= pickup
  ) {
    throw new Error("Choose valid rental dates and make sure the return is after pickup.");
  }

  if (requireFuturePickup) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (pickup < today) {
      throw new Error("The pickup date must be today or later.");
    }
  }

  return { pickup, returned };
}

function quoteBookingTotal(dailyRate, pickupAt, returnAt, destinationKm, distanceRate) {
  const distance = Number(destinationKm);
  const ratePerKm = Number(distanceRate);
  if (!Number.isFinite(distance) || distance <= 0) {
    throw new Error("Enter a valid one-way destination distance in kilometers.");
  }
  if (!Number.isFinite(ratePerKm) || ratePerKm <= 0) {
    throw new Error("The destination distance rate must be greater than zero.");
  }

  const rentalDays = Math.ceil(
    (returnAt.getTime() - pickupAt.getTime()) / (24 * 60 * 60 * 1000)
  );
  return calculateRentalQuote(dailyRate, rentalDays, distance, ratePerKm).totalAmount;
}

export async function updateBooking(db, bookingId, changes) {
  await db.withTransactionAsync(async () => {
    const booking = await db.getFirstAsync(
      `SELECT
        vehicle_id AS vehicleId,
        pickup_at AS pickupAt,
        return_at AS returnAt,
        destination_km AS destinationKm,
        distance_rate_per_km AS distanceRatePerKm,
        bookings.status AS status,
        vehicles.daily_rate AS dailyRate
       FROM bookings
       JOIN vehicles ON vehicles.id = bookings.vehicle_id
       WHERE bookings.id = ? AND vehicles.archived_at IS NULL`,
      Number(bookingId)
    );
    if (!booking) throw new Error("This booking could not be found.");
    if (booking.status !== "RESERVED") {
      throw new Error("Only reserved bookings can have their dates or destination changed.");
    }

    const { pickup, returned } = validateBookingDates(
      changes.pickupAt,
      changes.returnAt,
      true
    );
    const destination = changes.destination?.trim();
    if (!destination) throw new Error("Enter a destination for this rental.");

    await ensureVehicleAvailableForRange(
      db,
      booking.vehicleId,
      pickup,
      returned,
      Number(bookingId)
    );
    const totalAmount = quoteBookingTotal(
      booking.dailyRate,
      pickup,
      returned,
      changes.destinationKm,
      booking.distanceRatePerKm
    );

    await db.runAsync(
      `UPDATE bookings
       SET pickup_at = ?, return_at = ?, destination = ?,
           destination_km = ?, total_amount = ?
       WHERE id = ? AND status = 'RESERVED'`,
      pickup.toISOString(),
      returned.toISOString(),
      destination,
      Number(changes.destinationKm),
      totalAmount,
      Number(bookingId)
    );
    await syncVehicleStatus(db, booking.vehicleId);
  });
}

export async function extendBooking(db, bookingId, newReturnAt) {
  await db.withTransactionAsync(async () => {
    const booking = await db.getFirstAsync(
      `SELECT
        vehicle_id AS vehicleId,
        pickup_at AS pickupAt,
        return_at AS returnAt,
        destination_km AS destinationKm,
        distance_rate_per_km AS distanceRatePerKm,
        bookings.status AS status,
        vehicles.daily_rate AS dailyRate
       FROM bookings
       JOIN vehicles ON vehicles.id = bookings.vehicle_id
       WHERE bookings.id = ? AND vehicles.archived_at IS NULL`,
      Number(bookingId)
    );
    if (!booking) throw new Error("This booking could not be found.");
    if (booking.status !== "ACTIVE") {
      throw new Error("Only active rentals can be extended.");
    }

    const pickup = new Date(booking.pickupAt);
    const currentReturn = new Date(booking.returnAt);
    const returned = new Date(newReturnAt);
    if (Number.isNaN(returned.getTime()) || returned <= currentReturn) {
      throw new Error("Choose an extension date later than the current return date.");
    }
    if (Number.isNaN(pickup.getTime())) {
      throw new Error("The booking pickup date is invalid; the rental cannot be extended.");
    }

    await ensureVehicleAvailableForRange(
      db,
      booking.vehicleId,
      pickup,
      returned,
      Number(bookingId)
    );
    const totalAmount = quoteBookingTotal(
      booking.dailyRate,
      pickup,
      returned,
      booking.destinationKm,
      booking.distanceRatePerKm
    );

    await db.runAsync(
      `UPDATE bookings
       SET return_at = ?, total_amount = ?
       WHERE id = ? AND status = 'ACTIVE'`,
      returned.toISOString(),
      totalAmount,
      Number(bookingId)
    );
    await syncVehicleStatus(db, booking.vehicleId);
  });
}

export async function updateBookingStatus(
  db,
  bookingId,
  nextStatus,
  processedBy,
  remarks = ""
) {
  const processor = processedBy?.trim();
  if (!processor) throw new Error("The processing admin could not be identified.");
  if (!["RESERVED", "REJECTED", "CANCELLED"].includes(nextStatus)) {
    throw new Error("This booking action is not supported.");
  }
  if (nextStatus === "REJECTED" && !remarks.trim()) {
    throw new Error("Enter a reason before rejecting the request.");
  }

  await db.withTransactionAsync(async () => {
    const booking = await db.getFirstAsync(
      `SELECT bookings.status,
              bookings.vehicle_id AS vehicleId,
              bookings.pickup_at AS pickupAt,
              bookings.return_at AS returnAt,
              vehicles.status AS vehicleStatus
       FROM bookings
       JOIN vehicles ON vehicles.id = bookings.vehicle_id
       WHERE bookings.id = ?`,
      Number(bookingId)
    );
    if (!booking) throw new Error("Booking not found.");

    const allowed =
      nextStatus === "RESERVED"
        ? booking.status === "PENDING" &&
          ["AVAILABLE", "RESERVED", "RENTED"].includes(booking.vehicleStatus)
        : nextStatus === "REJECTED"
          ? booking.status === "PENDING"
          : ["PENDING", "RESERVED"].includes(booking.status);
    if (!allowed) throw new Error("This booking can no longer be changed that way.");
    if (nextStatus === "CANCELLED" && booking.status === "RESERVED" && !remarks.trim()) {
      throw new Error("Enter a cancellation reason before cancelling the confirmed reservation.");
    }
    if (nextStatus === "RESERVED") {
      await ensureVehicleAvailableForRange(
        db,
        booking.vehicleId,
        booking.pickupAt,
        booking.returnAt
      );
    }

    await db.runAsync(
      "UPDATE bookings SET status = ?, remarks = ?, processed_by = ? WHERE id = ?",
      nextStatus,
      remarks.trim() || null,
      processor,
      Number(bookingId)
    );

    await syncVehicleStatus(db, booking.vehicleId);
  });
}

export async function releaseBooking(
  db,
  bookingId,
  verification,
  processedBy,
  entryMethod = "MANUAL"
) {
  const processor = processedBy?.trim();
  if (!processor) throw new Error("The processing admin could not be identified.");
  if (!verification?.validId || !verification?.contact || !verification?.emergencyContact) {
    throw new Error("Confirm the valid ID, contact number, and emergency contact before release.");
  }
  if (entryMethod !== "MANUAL") {
    throw new Error("Vehicle release is recorded with manual verification.");
  }

  await db.withTransactionAsync(async () => {
    const booking = await db.getFirstAsync(
      `SELECT bookings.status, bookings.vehicle_id AS vehicleId, bookings.total_amount AS totalAmount,
              vehicles.status AS vehicleStatus
       FROM bookings
       JOIN vehicles ON vehicles.id = bookings.vehicle_id
       WHERE bookings.id = ?`,
      Number(bookingId)
    );
    if (!booking || booking.status !== "RESERVED") {
      throw new Error("Only a confirmed reservation can be released.");
    }
    if (!["AVAILABLE", "RESERVED"].includes(booking.vehicleStatus)) {
      throw new Error("This vehicle cannot be released in its current status.");
    }

    const releasedAt = new Date().toISOString();
    await db.runAsync(
      `INSERT INTO rental_transactions
        (booking_id, released_at, entry_method, total_amount, processed_by)
       VALUES (?, ?, ?, ?, ?)`,
      Number(bookingId),
      releasedAt,
      entryMethod,
      Number(booking.totalAmount),
      processor
    );
    await db.runAsync(
      "UPDATE bookings SET status = 'ACTIVE' WHERE id = ?",
      Number(bookingId)
    );
    await syncVehicleStatus(db, booking.vehicleId);
  });
}

export async function returnBooking(db, bookingId, processedBy) {
  const processor = processedBy?.trim();
  if (!processor) throw new Error("The processing admin could not be identified.");
  await db.withTransactionAsync(async () => {
    const booking = await db.getFirstAsync(
      `SELECT bookings.status, bookings.vehicle_id AS vehicleId,
              bookings.destination_km AS destinationKm,
              bookings.distance_rate_per_km AS distanceRatePerKm,
              vehicles.daily_rate AS dailyRate,
              rental_transactions.id AS transactionId,
              rental_transactions.released_at AS releasedAt
       FROM bookings
       JOIN vehicles ON vehicles.id = bookings.vehicle_id
       LEFT JOIN rental_transactions ON rental_transactions.booking_id = bookings.id
       WHERE bookings.id = ?`,
      Number(bookingId)
    );
    if (!booking || booking.status !== "ACTIVE" || !booking.transactionId) {
      throw new Error("Only a released rental can be returned.");
    }

    const returnedAt = new Date();
    const billableDays = Math.max(
      1,
      Math.ceil((returnedAt.getTime() - new Date(booking.releasedAt).getTime()) / (24 * 60 * 60 * 1000))
    );
    const finalAmount = calculateRentalQuote(
      booking.dailyRate,
      billableDays,
      booking.destinationKm || 0,
      booking.distanceRatePerKm || DISTANCE_RATE_PER_KM
    ).totalAmount;
    await db.runAsync(
      `UPDATE rental_transactions
       SET returned_at = ?, total_amount = ?, returned_by = ?
       WHERE booking_id = ? AND returned_at IS NULL`,
      returnedAt.toISOString(),
      finalAmount,
      processor,
      Number(bookingId)
    );
    await db.runAsync(
      "UPDATE bookings SET status = 'COMPLETED', total_amount = ? WHERE id = ?",
      finalAmount,
      Number(bookingId)
    );
    await syncVehicleStatus(db, booking.vehicleId);
  });
}

export function getDateRangeReportRows(db, startDate, endDate) {
  return db.getAllAsync(
    `SELECT
       bookings.id,
       bookings.booking_code AS bookingCode,
       bookings.pickup_at AS pickupAt,
       bookings.return_at AS returnAt,
       bookings.total_amount AS totalAmount,
       bookings.status,
       bookings.booking_channel AS bookingChannel,
       bookings.remarks,
       customers.name AS customerName,
       vehicles.brand || ' ' || vehicles.model AS vehicleName,
       vehicles.vehicle_type AS vehicleType,
       rental_transactions.released_at AS releasedAt,
       rental_transactions.returned_at AS returnedAt,
       rental_transactions.processed_by AS processedBy
     FROM bookings
     JOIN customers ON customers.id = bookings.customer_id
     JOIN vehicles ON vehicles.id = bookings.vehicle_id
     LEFT JOIN rental_transactions ON rental_transactions.booking_id = bookings.id
     WHERE (bookings.pickup_at >= ? AND bookings.pickup_at < ?)
        OR (rental_transactions.released_at >= ? AND rental_transactions.released_at < ?)
        OR (rental_transactions.returned_at >= ? AND rental_transactions.returned_at < ?)
     ORDER BY bookings.pickup_at DESC`,
    new Date(startDate).toISOString(),
    new Date(endDate).toISOString(),
    new Date(startDate).toISOString(),
    new Date(endDate).toISOString(),
    new Date(startDate).toISOString(),
    new Date(endDate).toISOString()
  );
}

export function getVehicleUsageReportRows(db, startDate, endDate) {
  const start = new Date(startDate).toISOString();
  const end = new Date(endDate).toISOString();
  return db.getAllAsync(
    `SELECT
       vehicles.brand || ' ' || vehicles.model AS vehicleName,
       rental_transactions.released_at AS releasedAt,
       rental_transactions.returned_at AS returnedAt
     FROM vehicles
     LEFT JOIN bookings
       ON bookings.vehicle_id = vehicles.id
       AND bookings.status IN ('ACTIVE', 'COMPLETED')
     LEFT JOIN rental_transactions
       ON rental_transactions.booking_id = bookings.id
       AND rental_transactions.released_at < ?
       AND COALESCE(rental_transactions.returned_at, ?) > ?
     WHERE vehicles.archived_at IS NULL
     ORDER BY vehicleName`,
    end,
    end,
    start
  );
}

export function getBookings(db) {
  return db.getAllAsync(`
    SELECT
      bookings.id,
      bookings.booking_code AS bookingCode,
      bookings.customer_id AS customerId,
      customers.name AS customerName,
      bookings.vehicle_id AS vehicleId,
      vehicles.brand || ' ' || vehicles.model AS vehicleName,
      vehicles.plate_number AS plateNumber,
      bookings.pickup_at AS pickupAt,
      bookings.return_at AS returnAt,
      bookings.total_amount AS totalAmount,
      bookings.destination,
      bookings.destination_km AS destinationKm,
      bookings.distance_rate_per_km AS distanceRatePerKm,
      bookings.booking_channel AS bookingChannel,
      bookings.remarks,
      bookings.status
    FROM bookings
    JOIN customers ON customers.id = bookings.customer_id
    JOIN vehicles ON vehicles.id = bookings.vehicle_id
    ORDER BY bookings.pickup_at DESC
  `);
}

export async function getMonthlyReportData(db, monthStart) {
  const previousMonthStart = new Date(
    monthStart.getFullYear(),
    monthStart.getMonth() - 1,
    1
  );
  const nextMonthStart = new Date(
    monthStart.getFullYear(),
    monthStart.getMonth() + 1,
    1
  );
  const toMonthKey = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  const currentKey = toMonthKey(monthStart);
  const previousKey = toMonthKey(previousMonthStart);
  const currentStart = monthStart.toISOString();
  const currentEnd = nextMonthStart.toISOString();
  const previousStart = previousMonthStart.toISOString();
  const previousEnd = currentStart;
  const reportBookingFields = `
    SELECT
      bookings.id,
      bookings.pickup_at AS pickupAt,
      bookings.return_at AS returnAt,
      bookings.total_amount AS totalAmount,
      bookings.status,
      rental_transactions.returned_at AS returnedAt,
      vehicles.id AS vehicleId,
      vehicles.brand AS vehicleBrand,
      vehicles.model AS vehicleName,
      vehicles.image_asset_key AS imageAssetKey
    FROM bookings
    JOIN vehicles ON vehicles.id = bookings.vehicle_id
    LEFT JOIN rental_transactions ON rental_transactions.booking_id = bookings.id
  `;

  const [
    bookings,
    previousBookings,
    utilizationBookings,
    previousUtilizationBookings,
    incomeBookings,
    previousIncomeBookings,
    customerCounts,
    fleetRow,
  ] = await Promise.all([
    db.getAllAsync(
      `${reportBookingFields}
       WHERE bookings.pickup_at >= ? AND bookings.pickup_at < ?
         AND bookings.status <> 'CANCELLED'`,
      currentStart,
      currentEnd
    ),
    db.getAllAsync(
      `${reportBookingFields}
       WHERE bookings.pickup_at >= ? AND bookings.pickup_at < ?
         AND bookings.status <> 'CANCELLED'`,
      previousStart,
      previousEnd
    ),
    db.getAllAsync(
      `${reportBookingFields}
       WHERE bookings.pickup_at < ? AND bookings.return_at > ?
         AND bookings.status IN ('RESERVED', 'ACTIVE', 'COMPLETED')`,
      currentEnd,
      currentStart
    ),
    db.getAllAsync(
      `${reportBookingFields}
       WHERE bookings.pickup_at < ? AND bookings.return_at > ?
         AND bookings.status IN ('RESERVED', 'ACTIVE', 'COMPLETED')`,
      previousEnd,
      previousStart
    ),
    db.getAllAsync(
      `${reportBookingFields}
       WHERE rental_transactions.returned_at >= ?
         AND rental_transactions.returned_at < ?
         AND bookings.status = 'COMPLETED'`,
      currentStart,
      currentEnd
    ),
    db.getAllAsync(
      `${reportBookingFields}
       WHERE rental_transactions.returned_at >= ?
         AND rental_transactions.returned_at < ?
         AND bookings.status = 'COMPLETED'`,
      previousStart,
      previousEnd
    ),
    db.getAllAsync(
      `SELECT substr(created_at, 1, 7) AS monthKey, COUNT(*) AS customerCount
       FROM customers
       WHERE substr(created_at, 1, 7) IN (?, ?)
       GROUP BY substr(created_at, 1, 7)`,
      currentKey,
      previousKey
    ),
    db.getFirstAsync(
      "SELECT COUNT(*) AS fleetCount FROM vehicles WHERE archived_at IS NULL"
    ),
  ]);

  const customerCountByMonth = Object.fromEntries(
    customerCounts.map((row) => [row.monthKey, row.customerCount])
  );

  return {
    bookings,
    previousBookings,
    utilizationBookings,
    previousUtilizationBookings,
    incomeBookings,
    previousIncomeBookings,
    customerCount: customerCountByMonth[currentKey] || 0,
    previousCustomerCount: customerCountByMonth[previousKey] || 0,
    fleetCount: fleetRow?.fleetCount || 0,
  };
}

export function getBookingByCode(db, bookingCode) {
  return db.getFirstAsync(
    `SELECT
      bookings.id,
      bookings.booking_code AS bookingCode,
      bookings.customer_id AS customerId,
      customers.name AS customerName,
      bookings.vehicle_id AS vehicleId,
      vehicles.brand || ' ' || vehicles.model AS vehicleName,
      vehicles.plate_number AS plateNumber,
      bookings.pickup_at AS pickupAt,
      bookings.return_at AS returnAt,
      bookings.total_amount AS totalAmount,
      bookings.destination,
      bookings.destination_km AS destinationKm,
      bookings.distance_rate_per_km AS distanceRatePerKm,
      bookings.status,
      bookings.booking_channel AS bookingChannel,
      bookings.remarks,
      bookings.processed_by AS processedBy,
      vehicles.daily_rate AS dailyRate,
      rental_transactions.released_at AS releasedAt,
      rental_transactions.returned_at AS returnedAt,
      rental_transactions.entry_method AS entryMethod,
      rental_transactions.processed_by AS releasedBy,
      rental_transactions.returned_by AS returnedBy,
      CASE
        WHEN COALESCE((
          SELECT SUM(payments.amount) FROM payments
          WHERE payments.booking_id = bookings.id AND payments.status = 'PAID'
        ), 0) >= bookings.total_amount
          AND COALESCE((
            SELECT SUM(payments.amount) FROM payments
            WHERE payments.booking_id = bookings.id AND payments.status = 'PAID'
          ), 0) > 0 THEN 'PAID'
        WHEN COALESCE((
          SELECT SUM(payments.amount) FROM payments
          WHERE payments.booking_id = bookings.id AND payments.status = 'PAID'
        ), 0) > 0 THEN 'PARTIAL'
        ELSE (
          SELECT payments.status FROM payments
          WHERE payments.booking_id = bookings.id
          ORDER BY payments.id DESC LIMIT 1
        )
      END AS paymentStatus,
      COALESCE((
        SELECT SUM(payments.amount) FROM payments
        WHERE payments.booking_id = bookings.id AND payments.status = 'PAID'
      ), 0) AS paidAmount,
      (SELECT payments.method FROM payments
       WHERE payments.booking_id = bookings.id
       ORDER BY payments.id DESC LIMIT 1) AS paymentMethod,
      (SELECT payments.reference FROM payments
       WHERE payments.booking_id = bookings.id
       ORDER BY payments.id DESC LIMIT 1) AS paymentReference,
      (SELECT payments.processed_by FROM payments
       WHERE payments.booking_id = bookings.id
       ORDER BY payments.id DESC LIMIT 1) AS paymentProcessedBy
    FROM bookings
    JOIN customers ON customers.id = bookings.customer_id
    JOIN vehicles ON vehicles.id = bookings.vehicle_id
    LEFT JOIN rental_transactions ON rental_transactions.booking_id = bookings.id
    WHERE bookings.booking_code = ?`,
    bookingCode
  );
}

export function getPaymentLedger(db) {
  return db.getAllAsync(`
    SELECT
      payments.id,
      payments.amount,
      payments.currency,
      payments.method,
      payments.status,
      payments.reference,
      payments.paid_at AS paidAt,
      payments.created_at AS createdAt,
      bookings.booking_code AS bookingCode,
      customers.name AS customerName,
      vehicles.brand || ' ' || vehicles.model AS vehicleName
    FROM payments
    JOIN bookings ON bookings.id = payments.booking_id
    JOIN customers ON customers.id = bookings.customer_id
    JOIN vehicles ON vehicles.id = bookings.vehicle_id
    ORDER BY COALESCE(payments.paid_at, payments.created_at) DESC, payments.id DESC
  `);
}

export function getUnpaidBookingCount(db) {
  return db.getFirstAsync(
    `SELECT COUNT(*) AS bookingCount
     FROM bookings
     WHERE bookings.status IN ('RESERVED', 'ACTIVE', 'COMPLETED')
       AND COALESCE((
         SELECT SUM(payments.amount) FROM payments
         WHERE payments.booking_id = bookings.id
           AND payments.status = 'PAID'
       ), 0) < bookings.total_amount`
  );
}

export function getBookingsForCustomerId(db, customerId) {
  return db.getAllAsync(
    `SELECT
      bookings.id,
      bookings.booking_code AS bookingCode,
      bookings.customer_id AS customerId,
      customers.name AS customerName,
      bookings.vehicle_id AS vehicleId,
      vehicles.brand || ' ' || vehicles.model AS vehicleName,
      vehicles.plate_number AS plateNumber,
      bookings.pickup_at AS pickupAt,
      bookings.return_at AS returnAt,
      bookings.total_amount AS totalAmount,
      bookings.destination,
      bookings.destination_km AS destinationKm,
      bookings.distance_rate_per_km AS distanceRatePerKm,
      bookings.remarks,
      rental_transactions.released_at AS releasedAt,
      rental_transactions.returned_at AS returnedAt,
      CASE
        WHEN COALESCE((
          SELECT SUM(payments.amount) FROM payments
          WHERE payments.booking_id = bookings.id AND payments.status = 'PAID'
        ), 0) >= bookings.total_amount
          AND COALESCE((
            SELECT SUM(payments.amount) FROM payments
            WHERE payments.booking_id = bookings.id AND payments.status = 'PAID'
          ), 0) > 0 THEN 'PAID'
        WHEN COALESCE((
          SELECT SUM(payments.amount) FROM payments
          WHERE payments.booking_id = bookings.id AND payments.status = 'PAID'
        ), 0) > 0 THEN 'PARTIAL'
        ELSE (
          SELECT payments.status FROM payments
          WHERE payments.booking_id = bookings.id
          ORDER BY payments.id DESC LIMIT 1
        )
      END AS paymentStatus,
      COALESCE((
        SELECT SUM(payments.amount) FROM payments
        WHERE payments.booking_id = bookings.id AND payments.status = 'PAID'
      ), 0) AS paidAmount,
      (SELECT payments.method FROM payments
       WHERE payments.booking_id = bookings.id
       ORDER BY payments.id DESC LIMIT 1) AS paymentMethod,
      (SELECT payments.reference FROM payments
       WHERE payments.booking_id = bookings.id
       ORDER BY payments.id DESC LIMIT 1) AS paymentReference,
      bookings.status
    FROM bookings
    JOIN customers ON customers.id = bookings.customer_id
    JOIN vehicles ON vehicles.id = bookings.vehicle_id
    LEFT JOIN rental_transactions ON rental_transactions.booking_id = bookings.id
    WHERE bookings.customer_id = ?
    ORDER BY bookings.pickup_at DESC`,
    Number(customerId)
  );
}

export async function createPayment(db, payment, processedBy) {
  const processor = processedBy?.trim();
  if (!processor) throw new Error("The processing admin could not be identified.");
  let paymentId;
  await db.withTransactionAsync(async () => {
    const booking = await db.getFirstAsync(
      `SELECT id, total_amount AS totalAmount, status
       FROM bookings
       WHERE id = ?`,
      Number(payment.bookingId)
    );
    if (!booking) throw new Error("This booking could not be found.");
    if (!["RESERVED", "ACTIVE", "COMPLETED"].includes(booking.status)) {
      throw new Error("Only confirmed, active, or completed rentals can be checked out.");
    }

    const paidAmount = await db.getFirstAsync(
      `SELECT COALESCE(SUM(amount), 0) AS paidAmount
       FROM payments
       WHERE booking_id = ? AND status = 'PAID'`,
      Number(payment.bookingId)
    );
    const amountDue = Number(booking.totalAmount) - Number(paidAmount?.paidAmount || 0);
    if (amountDue <= 0) throw new Error("This booking has no remaining balance.");

    const result = await db.runAsync(
      `INSERT INTO payments
        (booking_id, amount, currency, method, status, reference, paid_at, processed_by)
       VALUES (?, ?, 'PHP', ?, 'PAID', ?, ?, ?)`,
      Number(payment.bookingId),
      amountDue,
      payment.method,
      payment.reference,
      new Date().toISOString(),
      processor
    );
    paymentId = result.lastInsertRowId;
  });

  return paymentId;
}
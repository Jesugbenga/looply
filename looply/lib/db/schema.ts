// lib/db/schema.ts
import { pgTable, uuid, varchar, text, timestamp, decimal, boolean, integer, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table (both riders and drivers)
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  firebaseUid: varchar('firebase_uid', { length: 255 }).unique().notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  profileImage: text('profile_image'),
  userType: varchar('user_type', { length: 10 }).default('rider').notNull(), // 'rider' | 'driver' | 'both'
  isActive: boolean('is_active').default(true),
  rating: decimal('rating', { precision: 3, scale: 2 }).default('5.00'),
  totalRides: integer('total_rides').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Driver profiles (additional info for drivers)
export const driverProfiles = pgTable('driver_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  licenseNumber: varchar('license_number', { length: 50 }).unique().notNull(),
  licenseExpiry: timestamp('license_expiry').notNull(),
  vehicleId: uuid('vehicle_id').references(() => vehicles.id),
  isVerified: boolean('is_verified').default(false),
  isAvailable: boolean('is_available').default(false),
  currentLocation: jsonb('current_location'), // {lat, lng}
  totalEarnings: decimal('total_earnings', { precision: 10, scale: 2 }).default('0.00'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Vehicles table
export const vehicles = pgTable('vehicles', {
  id: uuid('id').primaryKey().defaultRandom(),
  make: varchar('make', { length: 50 }).notNull(),
  model: varchar('model', { length: 50 }).notNull(),
  year: integer('year').notNull(),
  color: varchar('color', { length: 30 }).notNull(),
  licensePlate: varchar('license_plate', { length: 20 }).unique().notNull(),
  vehicleType: varchar('vehicle_type', { length: 20 }).default('sedan'), // 'sedan', 'suv', 'hatchback', 'luxury'
  seats: integer('seats').default(4),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Addresses table (saved addresses for users)
export const addresses = pgTable('addresses', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  label: varchar('label', { length: 50 }).notNull(), // 'home', 'work', 'other'
  street: varchar('street', { length: 255 }).notNull(),
  city: varchar('city', { length: 100 }).notNull(),
  province: varchar('province', { length: 50 }).notNull(),
  postalCode: varchar('postal_code', { length: 10 }).notNull(),
  country: varchar('country', { length: 50 }).default('Canada'),
  coordinates: jsonb('coordinates').notNull(), // {lat, lng}
  isDefault: boolean('is_default').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Rides table
export const rides = pgTable('rides', {
  id: uuid('id').primaryKey().defaultRandom(),
  riderId: uuid('rider_id').references(() => users.id).notNull(),
  driverId: uuid('driver_id').references(() => users.id),
  pickupLocation: jsonb('pickup_location').notNull(), // {address, coordinates}
  dropoffLocation: jsonb('dropoff_location').notNull(), // {address, coordinates}
  rideType: varchar('ride_type', { length: 20 }).default('standard'), // 'standard', 'premium', 'luxury'
  status: varchar('status', { length: 20 }).default('requested'), // 'requested', 'accepted', 'in_progress', 'completed', 'cancelled'
  fare: decimal('fare', { precision: 8, scale: 2 }),
  distance: decimal('distance', { precision: 8, scale: 2 }), // in kilometers
  estimatedDuration: integer('estimated_duration'), // in minutes
  actualDuration: integer('actual_duration'), // in minutes
  paymentMethod: varchar('payment_method', { length: 20 }).default('card'), // 'card', 'cash', 'wallet'
  paymentStatus: varchar('payment_status', { length: 20 }).default('pending'), // 'pending', 'completed', 'failed'
  riderNotes: text('rider_notes'),
  driverNotes: text('driver_notes'),
  requestedAt: timestamp('requested_at').defaultNow(),
  acceptedAt: timestamp('accepted_at'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  cancelledAt: timestamp('cancelled_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Ride ratings table
export const rideRatings = pgTable('ride_ratings', {
  id: uuid('id').primaryKey().defaultRandom(),
  rideId: uuid('ride_id').references(() => rides.id, { onDelete: 'cascade' }).notNull(),
  raterId: uuid('rater_id').references(() => users.id).notNull(), // who gave the rating
  ratedId: uuid('rated_id').references(() => users.id).notNull(), // who received the rating
  rating: integer('rating').notNull(), // 1-5
  comment: text('comment'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  driverProfile: one(driverProfiles, {
    fields: [users.id],
    references: [driverProfiles.userId],
  }),
  addresses: many(addresses),
  ridesAsRider: many(rides, { relationName: 'rider' }),
  ridesAsDriver: many(rides, { relationName: 'driver' }),
  ratingsGiven: many(rideRatings, { relationName: 'rater' }),
  ratingsReceived: many(rideRatings, { relationName: 'rated' }),
}));

export const driverProfilesRelations = relations(driverProfiles, ({ one }) => ({
  user: one(users, {
    fields: [driverProfiles.userId],
    references: [users.id],
  }),
  vehicle: one(vehicles, {
    fields: [driverProfiles.vehicleId],
    references: [vehicles.id],
  }),
}));

export const vehiclesRelations = relations(vehicles, ({ many }) => ({
  drivers: many(driverProfiles),
}));

export const addressesRelations = relations(addresses, ({ one }) => ({
  user: one(users, {
    fields: [addresses.userId],
    references: [users.id],
  }),
}));

export const ridesRelations = relations(rides, ({ one, many }) => ({
  rider: one(users, {
    fields: [rides.riderId],
    references: [users.id],
    relationName: 'rider',
  }),
  driver: one(users, {
    fields: [rides.driverId],
    references: [users.id],
    relationName: 'driver',
  }),
  ratings: many(rideRatings),
}));

export const rideRatingsRelations = relations(rideRatings, ({ one }) => ({
  ride: one(rides, {
    fields: [rideRatings.rideId],
    references: [rides.id],
  }),
  rater: one(users, {
    fields: [rideRatings.raterId],
    references: [users.id],
    relationName: 'rater',
  }),
  rated: one(users, {
    fields: [rideRatings.ratedId],
    references: [users.id],
    relationName: 'rated',
  }),
}));
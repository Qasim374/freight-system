import {
  mysqlTable,
  int,
  varchar,
  text,
  boolean,
  decimal,
  mysqlEnum,
  timestamp,
  date,
} from "drizzle-orm/mysql-core";

// USERS
export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).unique(),
  password: varchar("password", { length: 255 }),
  role: varchar("role", { length: 50 }),
  company: varchar("company", { length: 255 }),
});

// QUOTES
export const quotes = mysqlTable("quotes", {
  id: int("id").primaryKey().autoincrement(),
  clientId: int("client_id"),
  mode: mysqlEnum("mode", ["Ex-Works", "FOB"]),
  containerType: mysqlEnum("container_type", ["20ft", "40ft", "40HC"]),
  numContainers: int("num_containers"),
  commodity: varchar("commodity", { length: 255 }),
  weightPerContainer: decimal("weight_per_container", {
    precision: 10,
    scale: 2,
  }),
  shipmentDate: date("shipment_date"),
  collectionAddress: text("collection_address"),
  status: mysqlEnum("status", [
    "awaiting_bids",
    "bids_received",
    "client_review",
    "booked",
  ]).default("awaiting_bids"),
  finalPrice: decimal("final_price", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// QUOTE BIDS
export const quoteBids = mysqlTable("quote_bids", {
  id: int("id").primaryKey().autoincrement(),
  quoteId: int("quote_id"),
  vendorId: int("vendor_id"),
  costUsd: decimal("cost_usd", { precision: 10, scale: 2 }),
  sailingDate: date("sailing_date"),
  carrierName: varchar("carrier_name", { length: 255 }),
  status: mysqlEnum("status", ["submitted", "selected", "rejected"]).default(
    "submitted"
  ),
  markupApplied: boolean("markup_applied").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// SHIPMENTS
export const shipments = mysqlTable("shipments", {
  id: int("id").primaryKey().autoincrement(),
  quoteId: int("quote_id"),
  clientId: int("client_id"),
  vendorId: int("vendor_id"),
  shipmentStatus: mysqlEnum("shipment_status", [
    "booked",
    "draft_bl_uploaded",
    "final_bl_uploaded",
    "in_transit",
  ]).default("booked"),
  trackingStatus: mysqlEnum("tracking_status", [
    "quote_confirmed",
    "booking",
    "loading",
    "sailed",
    "delivered",
  ]).default("quote_confirmed"),
  carrierReference: varchar("carrier_reference", { length: 255 }),
  eta: date("eta"),
  createdAt: timestamp("created_at").defaultNow(),
});

// BILLS OF LADING
export const billsOfLading = mysqlTable("bills_of_lading", {
  id: int("id").primaryKey().autoincrement(),
  shipmentId: int("shipment_id"),
  vendorId: int("vendor_id"),
  draftBl: varchar("draft_bl", { length: 255 }),
  finalBl: varchar("final_bl", { length: 255 }),
  blStatus: mysqlEnum("bl_status", [
    "draft_uploaded",
    "awaiting_client_approval",
    "amendment_requested",
    "final_uploaded",
    "final_approved",
  ]).default("draft_uploaded"),
  approvedByClient: boolean("approved_by_client").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// AMENDMENTS
export const amendments = mysqlTable("amendments", {
  id: int("id").primaryKey().autoincrement(),
  blId: int("bl_id"),
  initiatedBy: mysqlEnum("initiated_by", ["client", "admin", "vendor"]),
  reason: text("reason"),
  fileUpload: varchar("file_upload", { length: 255 }),
  extraCost: decimal("extra_cost", { precision: 10, scale: 2 }),
  delayDays: int("delay_days"),
  status: mysqlEnum("status", [
    "requested",
    "vendor_replied",
    "admin_review",
    "client_review",
    "accepted",
    "rejected",
  ]).default("requested"),
  approvedBy: varchar("approved_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// INVOICES
export const invoices = mysqlTable("invoices", {
  id: int("id").primaryKey().autoincrement(),
  shipmentId: int("shipment_id"),
  userId: int("user_id"),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  status: mysqlEnum("status", ["paid", "unpaid", "awaiting_verification"]),
  paymentMethod: varchar("payment_method", { length: 50 }),
  proofUploaded: varchar("proof_uploaded", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// SHIPMENT LOGS
export const shipmentLogs = mysqlTable("shipment_logs", {
  id: int("id").primaryKey().autoincrement(),
  shipmentId: int("shipment_id"),
  actor: varchar("actor", { length: 255 }),
  action: varchar("action", { length: 255 }),
  timestamp: timestamp("timestamp").defaultNow(),
  details: text("details"),
});

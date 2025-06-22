import {
  mysqlTable,
  varchar,
  int,
  timestamp,
  decimal,
  text,
  json,
  boolean,
  mysqlEnum,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  company: varchar("company", { length: 255 }),
  role: mysqlEnum("role", [
    "client_admin",
    "bl_manager",
    "pricing_reviewer",
    "accounts",
    "vendor_admin",
    "pricing_agent",
    "bl_manager_vendor",
    "accounts_vendor",
    "system_admin",
    "vendor_manager",
    "quote_control",
    "amendment_reviewer",
    "finance_admin",
    "analytics_officer",
  ]).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const shipments = mysqlTable("shipments", {
  id: varchar("id", { length: 36 }).primaryKey(),
  clientId: int("client_id").notNull(),
  vendorId: int("vendor_id"),
  status: mysqlEnum("status", [
    "quote_requested",
    "quote_received",
    "quote_confirmed",
    "booking",
    "booked",
    "draft_bl",
    "final_bl",
    "in_transit",
    "loading",
    "sailed",
    "delivered",
  ]).default("quote_requested"),
  containerType: mysqlEnum("container_type", ["20ft", "40ft", "40HC"]),
  commodity: varchar("commodity", { length: 255 }),
  numberOfContainers: int("number_of_containers"),
  weightPerContainer: decimal("weight_per_container", {
    precision: 10,
    scale: 2,
  }),
  preferredShipmentDate: timestamp("preferred_shipment_date"),
  collectionAddress: text("collection_address"),
  // Tracking fields
  carrierReference: varchar("carrier_reference", { length: 255 }),
  eta: timestamp("eta"),
  sailingDate: timestamp("sailing_date"),
  loadingDate: timestamp("loading_date"),
  deliveredDate: timestamp("delivered_date"),
  // Quote workflow fields
  quoteRequestedAt: timestamp("quote_requested_at").defaultNow(),
  quoteDeadline: timestamp("quote_deadline"),
  winningQuoteId: int("winning_quote_id"),
  finalPrice: decimal("final_price", { precision: 10, scale: 2 }),
  // BL workflow fields
  hasDraftBL: boolean("has_draft_bl").default(false),
  hasFinalBL: boolean("has_final_bl").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const quotes = mysqlTable("quotes", {
  id: int("id").autoincrement().primaryKey(),
  shipmentId: varchar("shipment_id", { length: 36 }).notNull(),
  vendorId: int("vendor_id").notNull(),
  cost: decimal("cost", { precision: 10, scale: 2 }).notNull(),
  sailingDate: timestamp("sailing_date").notNull(),
  carrierName: varchar("carrier_name", { length: 255 }).notNull(),
  submittedAt: timestamp("submitted_at").defaultNow(),
  isWinner: boolean("is_winner").default(false),
});

export const billsOfLading = mysqlTable("bills_of_lading", {
  id: int("id").autoincrement().primaryKey(),
  shipmentId: varchar("shipment_id", { length: 36 }).notNull(),
  version: mysqlEnum("version", ["draft", "final"]).notNull(),
  fileUrl: varchar("file_url", { length: 512 }).notNull(),
  approved: boolean("approved").default(false),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const amendments = mysqlTable("amendments", {
  id: int("id").autoincrement().primaryKey(),
  shipmentId: varchar("shipment_id", { length: 36 }).notNull(),
  reason: text("reason").notNull(),
  extraCost: decimal("extra_cost", { precision: 10, scale: 2 }).default(0.0),
  delayDays: int("delay_days").default(0),
  status: mysqlEnum("status", [
    "requested",
    "vendor_replied",
    "admin_review",
    "client_review",
    "accepted",
    "rejected",
  ]).default("requested"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  shipmentId: varchar("shipment_id", { length: 36 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  type: mysqlEnum("type", ["client", "vendor"]).notNull(),
  status: mysqlEnum("status", [
    "paid",
    "unpaid",
    "awaiting_verification",
  ]).default("unpaid"),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  shipmentId: varchar("shipment_id", { length: 36 }).notNull(),
  actorId: int("actor_id").notNull(),
  action: varchar("action", { length: 255 }).notNull(),
  details: json("details"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Role-based access control system for Royal Gulf Freight System

export type UserRole =
  // Client Roles
  | "client_admin"
  | "bl_manager"
  | "pricing_reviewer"
  | "accounts"
  // Vendor Roles
  | "vendor_admin"
  | "pricing_agent"
  | "bl_manager_vendor"
  | "accounts_vendor"
  // Admin Roles
  | "system_admin"
  | "vendor_manager"
  | "quote_control"
  | "amendment_reviewer"
  | "finance_admin"
  | "analytics_officer";

export interface Permission {
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  // CLIENT ROLES
  client_admin: [
    { resource: "quotes", action: "create" },
    { resource: "quotes", action: "read" },
    { resource: "quotes", action: "update" },
    { resource: "quotes", action: "delete" },
    { resource: "bl", action: "read" },
    { resource: "bl", action: "approve" },
    { resource: "bl", action: "request_amendment" },
    { resource: "invoices", action: "read" },
    { resource: "invoices", action: "pay" },
    { resource: "shipments", action: "read" },
    { resource: "shipments", action: "track" },
    { resource: "amendments", action: "request" },
    { resource: "amendments", action: "respond" },
  ],

  bl_manager: [
    { resource: "bl", action: "read" },
    { resource: "bl", action: "approve" },
    { resource: "bl", action: "request_amendment" },
    { resource: "shipments", action: "read" },
    { resource: "shipments", action: "track" },
  ],

  pricing_reviewer: [
    { resource: "quotes", action: "read" },
    { resource: "quotes", action: "approve" },
    { resource: "shipments", action: "read" },
    { resource: "shipments", action: "track" },
  ],

  accounts: [
    { resource: "invoices", action: "read" },
    { resource: "invoices", action: "pay" },
    { resource: "shipments", action: "read" },
    { resource: "shipments", action: "track" },
  ],

  // VENDOR ROLES
  vendor_admin: [
    { resource: "quotes", action: "submit" },
    { resource: "quotes", action: "read" },
    { resource: "bl", action: "upload" },
    { resource: "bl", action: "read" },
    { resource: "costs", action: "edit" },
    { resource: "account", action: "manage" },
    { resource: "amendments", action: "respond" },
    { resource: "invoices", action: "read" },
    { resource: "shipments", action: "read" },
    { resource: "post_booking_changes", action: "propose" },
  ],

  pricing_agent: [
    { resource: "quotes", action: "submit" },
    { resource: "quotes", action: "read" },
    { resource: "shipments", action: "read" },
  ],

  bl_manager_vendor: [
    { resource: "bl", action: "upload" },
    { resource: "bl", action: "read" },
    { resource: "shipments", action: "read" },
  ],

  accounts_vendor: [
    { resource: "invoices", action: "read" },
    { resource: "invoices", action: "download" },
    { resource: "shipments", action: "read" },
  ],

  // ADMIN ROLES
  system_admin: [
    { resource: "*", action: "*" }, // Full access
  ],

  vendor_manager: [
    { resource: "vendors", action: "create" },
    { resource: "vendors", action: "read" },
    { resource: "vendors", action: "update" },
    { resource: "vendors", action: "delete" },
    { resource: "vendors", action: "suspend" },
    { resource: "vendors", action: "activate" },
    { resource: "kyc", action: "upload" },
    { resource: "kyc", action: "review" },
    { resource: "shipments", action: "read" },
  ],

  quote_control: [
    { resource: "quotes", action: "read" },
    { resource: "quotes", action: "override" },
    { resource: "quotes", action: "compare" },
    { resource: "quotes", action: "approve" },
    { resource: "quotes", action: "reject" },
    { resource: "shipments", action: "read" },
  ],

  amendment_reviewer: [
    { resource: "amendments", action: "read" },
    { resource: "amendments", action: "approve" },
    { resource: "amendments", action: "reject" },
    { resource: "amendments", action: "negotiate" },
    { resource: "shipments", action: "read" },
  ],

  finance_admin: [
    { resource: "invoices", action: "read" },
    { resource: "invoices", action: "create" },
    { resource: "invoices", action: "update" },
    { resource: "invoices", action: "reconcile" },
    { resource: "payments", action: "verify" },
    { resource: "payments", action: "mark_paid" },
    { resource: "shipments", action: "read" },
  ],

  analytics_officer: [
    { resource: "reports", action: "read" },
    { resource: "analytics", action: "read" },
    { resource: "vendor_performance", action: "read" },
    { resource: "shipments", action: "read" },
  ],
};

export function hasPermission(
  userRole: UserRole,
  resource: string,
  action: string
): boolean {
  const permissions = ROLE_PERMISSIONS[userRole];
  if (!permissions) return false;

  // Check for wildcard permissions first
  const wildcardPermission = permissions.find(
    (p) => p.resource === "*" && p.action === "*"
  );
  if (wildcardPermission) return true;

  // Check for specific resource wildcard
  const resourceWildcard = permissions.find(
    (p) => p.resource === resource && p.action === "*"
  );
  if (resourceWildcard) return true;

  // Check for specific permission
  const specificPermission = permissions.find(
    (p) => p.resource === resource && p.action === action
  );
  return !!specificPermission;
}

export function getRoleDisplayName(role: UserRole): string {
  const displayNames: Record<UserRole, string> = {
    // Client Roles
    client_admin: "Client Admin",
    bl_manager: "BL Manager",
    pricing_reviewer: "Pricing Reviewer",
    accounts: "Accounts",

    // Vendor Roles
    vendor_admin: "Vendor Admin",
    pricing_agent: "Pricing Agent",
    bl_manager_vendor: "BL Manager",
    accounts_vendor: "Accounts",

    // Admin Roles
    system_admin: "System Admin",
    vendor_manager: "Vendor Manager",
    quote_control: "Quote Control",
    amendment_reviewer: "Amendment Reviewer",
    finance_admin: "Finance Admin",
    analytics_officer: "Analytics Officer",
  };

  return displayNames[role] || role;
}

export function getRoleCategory(role: UserRole): "client" | "vendor" | "admin" {
  if (
    role.startsWith("client_") ||
    ["bl_manager", "pricing_reviewer", "accounts"].includes(role)
  ) {
    return "client";
  }
  if (
    role.startsWith("vendor_") ||
    ["pricing_agent", "bl_manager_vendor", "accounts_vendor"].includes(role)
  ) {
    return "vendor";
  }
  return "admin";
}

// Helper function to check if user can access a specific shipment
export function canAccessShipment(
  userRole: UserRole,
  userId: number,
  shipmentClientId?: number,
  shipmentVendorId?: number
): boolean {
  const category = getRoleCategory(userRole);

  switch (category) {
    case "client":
      // Client roles can only access their own shipments
      return shipmentClientId === userId;
    case "vendor":
      // Vendor roles can only access shipments assigned to them
      return shipmentVendorId === userId;
    case "admin":
      // Admin roles can access all shipments
      return true;
    default:
      return false;
  }
}

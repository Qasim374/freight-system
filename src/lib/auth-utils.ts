import bcrypt from "bcryptjs";

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

// For temporary use - plain text comparison (NOT recommended for production)
export function comparePlainTextPassword(
  inputPassword: string,
  storedPassword: string
): boolean {
  return inputPassword === storedPassword;
}

// Role categorization for access control
export const ADMIN_ROLES = [
  "system_admin",
  // "client_admin",
  "bl_manager",
  "pricing_reviewer",
  "accounts",
  "quote_control",
  "amendment_reviewer",
  "finance_admin",
  "analytics_officer",
] as const;

export const VENDOR_ROLES = [
  "vendor_admin",
  "vendor_manager",
  "bl_manager_vendor",
  "accounts_vendor",
  "pricing_agent",
] as const;

export const CLIENT_ROLES = ["client_admin"] as const;

export type UserRole =
  | (typeof ADMIN_ROLES)[number]
  | (typeof VENDOR_ROLES)[number]
  | (typeof CLIENT_ROLES)[number];

// Helper functions
export function isAdminRole(role: string): boolean {
  return ADMIN_ROLES.includes(role as any);
}

export function isVendorRole(role: string): boolean {
  return VENDOR_ROLES.includes(role as any);
}

export function isClientRole(role: string): boolean {
  return CLIENT_ROLES.includes(role as any);
}

export function getDashboardPath(role: string): string {
  if (isAdminRole(role)) {
    return "/admin/dashboard";
  } else if (isVendorRole(role)) {
    return "/vendor/dashboard";
  } else if (isClientRole(role)) {
    return "/client/dashboard";
  }
  return "/unauthorized";
}

export function hasAccessToSection(
  role: string,
  section: "admin" | "vendor" | "client"
): boolean {
  switch (section) {
    case "admin":
      return isAdminRole(role);
    case "vendor":
      return isVendorRole(role);
    case "client":
      return isClientRole(role);
    default:
      return false;
  }
}

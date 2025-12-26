import { Database } from "../types/supabase";

export type UserRole = Database["public"]["Enums"]["user_role"];

export const ROLES = {
  ADMIN: "admin" as UserRole,
  SUB_ADMIN: "sub_admin" as UserRole,
  RETAILER: "retailer" as UserRole,
  BEAUTY_PARLOR: "beauty_parlor" as UserRole,
  LOCAL_CUSTOMER: "local_customer" as UserRole,
};

export const PERMISSIONS = {
  // User Management
  VIEW_USERS: "view_users",
  CREATE_USERS: "create_users",
  EDIT_USERS: "edit_users",
  DELETE_USERS: "delete_users",
  APPROVE_USERS: "approve_users",
  
  // Product Management
  VIEW_PRODUCTS: "view_products",
  CREATE_PRODUCTS: "create_products",
  EDIT_PRODUCTS: "edit_products",
  DELETE_PRODUCTS: "delete_products",
  APPROVE_PRODUCTS: "approve_products",
  
  // Order Management
  VIEW_ALL_ORDERS: "view_all_orders",
  VIEW_ASSIGNED_ORDERS: "view_assigned_orders",
  EDIT_ORDERS: "edit_orders",
  ASSIGN_ORDERS: "assign_orders",
  
  // Payment Management
  RECORD_PAYMENTS: "record_payments",
  VIEW_PAYMENTS: "view_payments",
  
  // Inventory Management
  MANAGE_INVENTORY: "manage_inventory",
  VIEW_INVENTORY: "view_inventory",
  
  // Reports & Analytics
  VIEW_REPORTS: "view_reports",
  EXPORT_DATA: "export_data",
  
  // Audit Logs
  VIEW_AUDIT_LOGS: "view_audit_logs",
  
  // Coupons
  MANAGE_COUPONS: "manage_coupons",
};

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: Object.values(PERMISSIONS),
  sub_admin: [
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.VIEW_PRODUCTS,
    PERMISSIONS.CREATE_PRODUCTS,
    PERMISSIONS.EDIT_PRODUCTS,
    PERMISSIONS.VIEW_ASSIGNED_ORDERS,
    PERMISSIONS.EDIT_ORDERS,
    PERMISSIONS.RECORD_PAYMENTS,
    PERMISSIONS.VIEW_PAYMENTS,
    PERMISSIONS.MANAGE_INVENTORY,
    PERMISSIONS.VIEW_INVENTORY,
  ],
  retailer: [
    PERMISSIONS.VIEW_PRODUCTS,
  ],
  beauty_parlor: [
    PERMISSIONS.VIEW_PRODUCTS,
  ],
  local_customer: [
    PERMISSIONS.VIEW_PRODUCTS,
  ],
  salesman: [
    PERMISSIONS.VIEW_PRODUCTS,
    PERMISSIONS.VIEW_ASSIGNED_ORDERS,
    PERMISSIONS.VIEW_PAYMENTS,
    PERMISSIONS.RECORD_PAYMENTS,
  ],
};

export function hasPermission(role: UserRole, permission: string): boolean {
  const rolePermissions = ROLE_PERMISSIONS[role] || [];
  return rolePermissions.includes(permission);
}

export function hasAnyPermission(role: UserRole, permissions: string[]): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}

export function hasAllPermissions(role: UserRole, permissions: string[]): boolean {
  return permissions.every(permission => hasPermission(role, permission));
}

export function isAdmin(role: UserRole): boolean {
  return role === ROLES.ADMIN;
}

export function isSubAdmin(role: UserRole): boolean {
  return role === ROLES.SUB_ADMIN;
}

export function isAdminOrSubAdmin(role: UserRole): boolean {
  return isAdmin(role) || isSubAdmin(role);
}

export function canAccessAdminPanel(role: UserRole): boolean {
  return isAdminOrSubAdmin(role);
}

export function canManageUsers(role: UserRole): boolean {
  return hasPermission(role, PERMISSIONS.APPROVE_USERS);
}

export function canManageProducts(role: UserRole): boolean {
  return hasPermission(role, PERMISSIONS.DELETE_PRODUCTS);
}

export function getRoleDisplayName(role: UserRole): string {
  const displayNames: Record<UserRole, string> = {
    admin: "Administrator",
    sub_admin: "Sub-Admin",
    retailer: "Retailer",
    beauty_parlor: "Beauty Parlor",
    local_customer: "Customer",
    salesman: "Salesman",
  };
  return displayNames[role] || role;
}

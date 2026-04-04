
/**
 * Permission System for FidelizaCred
 * Manages role-based access control (RBAC) across the application
 */

// Defined roles
export const ROLES = {
  ADMIN: "admin",
  SUPERVISOR: "supervisor",
  EMPLOYEE: "employee",
  GUEST: "guest",
};

// Defined permissions
export const PERMISSIONS = {
  // Clients
  CREATE_CLIENT: "create:client",
  READ_CLIENT: "read:client",
  UPDATE_CLIENT: "update:client",
  DELETE_CLIENT: "delete:client",

  // Loans
  CREATE_LOAN: "create:loan",
  READ_LOAN: "read:loan",
  UPDATE_LOAN: "update:loan",
  DELETE_LOAN: "delete:loan",
  APPROVE_LOAN: "approve:loan",
  REJECT_LOAN: "reject:loan",
  REQUEST_LOAN: "request:loan",

  // Finances
  READ_FINANCE: "read:finance",
  CREATE_TRANSACTION: "create:transaction",
  UPDATE_TRANSACTION: "update:transaction",
  DELETE_TRANSACTION: "delete:transaction",

  // Reports
  READ_REPORT: "read:report",
  EXPORT_REPORT: "export:report",
  GENERATE_PROTOCOL: "generate:protocol",

  // Cobrança
  READ_COBRANCA: "read:cobranca",
  MANAGE_COBRANCA: "manage:cobranca",

  // Recebimentos
  READ_RECEBIMENTOS: "read:recebimentos",
  CREATE_RECEBIMENTOS: "create:recebimentos",

  // Employees
  MANAGE_EMPLOYEES: "manage:employees",
  READ_EMPLOYEES: "read:employees",

  // Settings
  MANAGE_SETTINGS: "manage:settings",

  // Agenda
  READ_AGENDA: "read:agenda",
  MANAGE_AGENDA: "manage:agenda",
};

/**
 * Role-Permission Matrix
 * Defines what permissions each role has
 */
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    // Admin has all permissions
    ...Object.values(PERMISSIONS),
  ],
  
  [ROLES.SUPERVISOR]: [
    // Supervisor can manage most operations but not settings
    PERMISSIONS.CREATE_CLIENT,
    PERMISSIONS.READ_CLIENT,
    PERMISSIONS.UPDATE_CLIENT,
    PERMISSIONS.CREATE_LOAN,
    PERMISSIONS.READ_LOAN,
    PERMISSIONS.UPDATE_LOAN,
    PERMISSIONS.APPROVE_LOAN,
    PERMISSIONS.REJECT_LOAN,
    PERMISSIONS.READ_FINANCE,
    PERMISSIONS.CREATE_TRANSACTION,
    PERMISSIONS.UPDATE_TRANSACTION,
    PERMISSIONS.READ_REPORT,
    PERMISSIONS.EXPORT_REPORT,
    PERMISSIONS.READ_COBRANCA,
    PERMISSIONS.MANAGE_COBRANCA,
    PERMISSIONS.READ_RECEBIMENTOS,
    PERMISSIONS.CREATE_RECEBIMENTOS,
    PERMISSIONS.READ_EMPLOYEES,
    PERMISSIONS.READ_AGENDA,
    PERMISSIONS.MANAGE_AGENDA,
  ],
  
  [ROLES.EMPLOYEE]: [
    // Employee can manage their own clients and create requisitions for loans
    PERMISSIONS.CREATE_CLIENT,
    PERMISSIONS.READ_CLIENT,
    PERMISSIONS.UPDATE_CLIENT,
    PERMISSIONS.READ_LOAN,
    PERMISSIONS.UPDATE_LOAN,
    PERMISSIONS.REQUEST_LOAN,
    PERMISSIONS.READ_FINANCE,
    PERMISSIONS.READ_REPORT,
    PERMISSIONS.READ_COBRANCA,
    PERMISSIONS.MANAGE_COBRANCA,
    PERMISSIONS.READ_RECEBIMENTOS,
    PERMISSIONS.CREATE_RECEBIMENTOS,
    PERMISSIONS.READ_AGENDA,
    PERMISSIONS.MANAGE_AGENDA,
  ],
  
  [ROLES.GUEST]: [
    // Guest has minimal read-only permissions
    PERMISSIONS.READ_CLIENT,
    PERMISSIONS.READ_LOAN,
    PERMISSIONS.READ_AGENDA,
  ],
};

/**
 * Checks if a user has a specific permission based on their role
 * @param {string} userRole - The user's role (from access_level)
 * @param {string} permission - The permission to check
 * @returns {boolean} True if user has permission
 */
export const hasPermission = (userRole, permission) => {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS[ROLES.GUEST];
  return rolePermissions.includes(permission);
};

/**
 * Checks if user can perform an action on a specific module
 * @param {string} userRole - The user's role
 * @param {string} module - The module name (e.g., "loan", "client")
 * @param {string} action - The action (e.g., "create", "delete")
 * @returns {boolean} True if user can perform action
 */
export const canAction = (userRole, module, action) => {
  const permission = `${action}:${module}`;
  return hasPermission(userRole, permission);
};

/**
 * Get all permissions for a role
 * @param {string} userRole - The user's role
 * @returns {array} Array of permissions
 */
export const getPermissions = (userRole) => {
  return ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS[ROLES.GUEST];
};

/**
 * Check if user is admin
 * @param {string} userRole - The user's role
 * @returns {boolean}
 */
export const isAdmin = (userRole) => userRole === ROLES.ADMIN;

/**
 * Check if user is supervisor or admin
 * @param {string} userRole - The user's role
 * @returns {boolean}
 */
export const isSupervisor = (userRole) => {
  return userRole === ROLES.ADMIN || userRole === ROLES.SUPERVISOR;
};

/**
 * Check if user is employee
 * @param {string} userRole - The user's role
 * @returns {boolean}
 */
export const isEmployee = (userRole) => userRole === ROLES.EMPLOYEE;

/**
 * Map between database access_level and application roles
 * Handles backwards compatibility
 */
export const mapAccessLevelToRole = (accessLevel) => {
  const mapping = {
    admin: ROLES.ADMIN,
    supervisor: ROLES.SUPERVISOR,
    employee: ROLES.EMPLOYEE,
    guest: ROLES.GUEST,
  };
  return mapping[accessLevel] || ROLES.GUEST;
};

export default {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission,
  canAction,
  getPermissions,
  isAdmin,
  isSupervisor,
  isEmployee,
  mapAccessLevelToRole,
};

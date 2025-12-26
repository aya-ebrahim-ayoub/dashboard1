
export enum UserRole {
  ADMIN = 'Admin',
  MANAGER = 'Manager',
  EMPLOYEE = 'Employee'
}

export type Permission = 
  | 'view_analytics'
  | 'manage_users'
  | 'edit_roles'
  | 'view_reports'
  | 'manage_billing';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  status: 'Active' | 'Inactive' | 'Pending';
  lastActive: string;
}

export interface Metric {
  label: string;
  value: string;
  change: number;
  trend: 'up' | 'down';
}

export interface RoleConfig {
  role: UserRole;
  permissions: Permission[];
  color: string;
}

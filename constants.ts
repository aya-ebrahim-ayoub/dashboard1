
import { UserRole, User, Metric, RoleConfig, Permission } from './types';

export const USERS_MOCK_DATA: User[] = [
  { id: '1', name: 'Alexander Wright', email: 'alex@nexus.corp', role: UserRole.ADMIN, department: 'Executive', status: 'Active', lastActive: '2 mins ago' },
  { id: '2', name: 'Sarah Chen', email: 'sarah.c@nexus.corp', role: UserRole.MANAGER, department: 'Product', status: 'Active', lastActive: '1 hour ago' },
  { id: '3', name: 'Marcus Miller', email: 'm.miller@nexus.corp', role: UserRole.EMPLOYEE, department: 'Engineering', status: 'Inactive', lastActive: '2 days ago' },
  { id: '4', name: 'Elena Rodriguez', email: 'elena@nexus.corp', role: UserRole.MANAGER, department: 'Marketing', status: 'Active', lastActive: '10 mins ago' },
  { id: '5', name: 'David Kim', email: 'd.kim@nexus.corp', role: UserRole.EMPLOYEE, department: 'Design', status: 'Active', lastActive: '30 mins ago' },
  { id: '6', name: 'Jessica Vane', email: 'j.vane@nexus.corp', role: UserRole.EMPLOYEE, department: 'Engineering', status: 'Pending', lastActive: 'Never' },
  { id: '7', name: 'Thomas More', email: 't.more@nexus.corp', role: UserRole.ADMIN, department: 'Operations', status: 'Active', lastActive: 'Now' },
  { id: '8', name: 'Lila Thorne', email: 'lila@nexus.corp', role: UserRole.MANAGER, department: 'Engineering', status: 'Active', lastActive: '4 hours ago' },
];

export const METRICS_DATA: Metric[] = [
  { label: 'Total Revenue', value: '$2,450,120', change: 12.5, trend: 'up' },
  { label: 'Active Users', value: '18,245', change: 8.2, trend: 'up' },
  { label: 'System Uptime', value: '99.98%', change: 0.02, trend: 'up' },
  { label: 'Server Load', value: '42.1%', change: 5.4, trend: 'down' },
];

export const ROLE_CONFIGS: RoleConfig[] = [
  { 
    role: UserRole.ADMIN, 
    color: 'bg-indigo-600',
    permissions: ['view_analytics', 'manage_users', 'edit_roles', 'view_reports', 'manage_billing'] 
  },
  { 
    role: UserRole.MANAGER, 
    color: 'bg-emerald-600',
    permissions: ['view_analytics', 'view_reports'] 
  },
  { 
    role: UserRole.EMPLOYEE, 
    color: 'bg-slate-600',
    permissions: ['view_analytics'] 
  },
];

export const ALL_PERMISSIONS: { id: Permission; label: string }[] = [
  { id: 'view_analytics', label: 'View Analytics' },
  { id: 'manage_users', label: 'Manage Users' },
  { id: 'edit_roles', label: 'Edit Role Definitions' },
  { id: 'view_reports', label: 'View Advanced Reports' },
  { id: 'manage_billing', label: 'Manage Enterprise Billing' },
];

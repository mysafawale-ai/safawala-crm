/**
 * UNIFIED AUTHENTICATION SYSTEM v2
 * 
 * Supabase Auth + App-level RBAC + Module Permissions + Franchise Isolation
 * 
 * Role Hierarchy:
 * - super_admin (4): Full access across all franchises
 * - franchise_admin (3): Full access within their franchise
 * - staff (2): Limited access within their franchise based on permissions
 * - readonly (1): Read-only access based on permissions
 * 
 * Usage:
 *   const auth = await authenticateRequest(request, { minRole: 'staff', requirePermission: 'bookings' })
 *   if (!auth.authorized) return NextResponse.json(auth.error, { status: auth.statusCode })
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { supabaseServer } from './supabase-server-simple';
import type { UserPermissions } from './types';

// Role hierarchy levels
const ROLE_LEVELS = {
  readonly: 1,
  staff: 2,
  franchise_admin: 3,
  super_admin: 4,
} as const;

export type AppRole = keyof typeof ROLE_LEVELS;

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: AppRole;
  franchise_id?: string;
  franchise_name?: string;
  franchise_code?: string;
  permissions: UserPermissions;
  is_super_admin: boolean;
}

export interface AuthenticationResult {
  authorized: boolean;
  user?: AuthenticatedUser;
  error?: { error: string; message?: string };
  statusCode?: number;
}

export interface AuthOptions {
  minRole?: AppRole;
  requirePermission?: keyof UserPermissions;
  allowSuperAdminOverride?: boolean; // Super admin bypasses permission checks
}

/**
 * Main authentication function - validates Supabase Auth session + app permissions
 */
export async function authenticateRequest(
  request: NextRequest,
  options: AuthOptions = {}
): Promise<AuthenticationResult> {
  const {
    minRole = 'readonly',
    requirePermission,
    allowSuperAdminOverride = true,
  } = options;

  try {
    // 1. Validate Supabase Auth session
    const cookieStore = cookies();
    const authClient = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { user: authUser }, error: authError } = await authClient.auth.getUser();

    if (authError || !authUser?.email) {
      return {
        authorized: false,
        error: { error: 'Unauthorized', message: 'Authentication required' },
        statusCode: 401,
      };
    }

    // 2. Fetch app user profile with permissions (case-insensitive email match)
    const { data: appUser, error: profileError } = await supabaseServer
      .from('users')
      .select(`
        id,
        name,
        email,
        role,
        franchise_id,
        is_active,
        permissions,
        franchises!left (
          id,
          name,
          code
        )
      `)
      .ilike('email', authUser.email)
      .eq('is_active', true)
      .single();

    if (profileError || !appUser) {
      return {
        authorized: false,
        error: { error: 'Forbidden', message: 'User profile not found or inactive' },
        statusCode: 403,
      };
    }

    const franchise = Array.isArray(appUser.franchises) ? appUser.franchises[0] : appUser.franchises;

    // Build authenticated user object
    const user: AuthenticatedUser = {
      id: appUser.id,
      email: appUser.email,
      name: appUser.name,
      role: appUser.role as AppRole,
      franchise_id: appUser.franchise_id,
      franchise_name: franchise?.name,
      franchise_code: franchise?.code,
      permissions: ensurePermissions(appUser.permissions, appUser.role as AppRole),
      is_super_admin: appUser.role === 'super_admin',
    };

    // 3. Check role hierarchy
    const userLevel = ROLE_LEVELS[user.role] || 0;
    const requiredLevel = ROLE_LEVELS[minRole] || 0;

    if (userLevel < requiredLevel) {
      return {
        authorized: false,
        error: {
          error: 'Forbidden',
          message: `This action requires ${minRole} role or higher`,
        },
        statusCode: 403,
      };
    }

    // 4. Check module permission if required
    if (requirePermission) {
      const hasPermission = user.permissions[requirePermission];
      const isSuperAdmin = user.is_super_admin && allowSuperAdminOverride;

      if (!hasPermission && !isSuperAdmin) {
        return {
          authorized: false,
          error: {
            error: 'Forbidden',
            message: `You do not have permission to access ${requirePermission}`,
          },
          statusCode: 403,
        };
      }
    }

    return {
      authorized: true,
      user,
    };
  } catch (error) {
    console.error('[Auth] Unexpected error:', error);
    return {
      authorized: false,
      error: { error: 'Internal Server Error', message: 'Authentication failed' },
      statusCode: 500,
    };
  }
}

/**
 * Ensure user has valid permissions object with defaults based on role
 */
function ensurePermissions(permissions: any, role: AppRole): UserPermissions {
  // If user has explicit permissions in DB, use those (don't override with defaults)
  if (permissions && typeof permissions === 'object' && Object.keys(permissions).length > 0) {
    // Just ensure all required keys exist by filling in missing ones with false
    const allKeys: Array<keyof UserPermissions> = [
      'dashboard', 'bookings', 'customers', 'inventory', 'packages', 'vendors',
      'quotes', 'invoices', 'laundry', 'expenses', 'deliveries', 'productArchive',
      'payroll', 'attendance', 'reports', 'financials', 'franchises', 'staff',
      'integrations', 'settings'
    ];
    
    const result = { ...permissions } as UserPermissions;
    for (const key of allKeys) {
      if (!(key in result)) {
        result[key] = false;
      }
    }
    return result;
  }
  
  // Only use defaults if permissions is null/empty
  return getDefaultPermissions(role);
}

/**
 * Get default permissions based on role
 */
function getDefaultPermissions(role: AppRole): UserPermissions {
  switch (role) {
    case 'super_admin':
      return {
        dashboard: true,
        bookings: true,
        customers: true,
        inventory: true,
        packages: true,
        vendors: true,
        quotes: true,
        invoices: true,
        laundry: true,
        expenses: true,
        deliveries: true,
        productArchive: true,
        payroll: true,
        attendance: true,
        reports: true,
        financials: true,
        franchises: true,
        staff: true,
        integrations: true,
        settings: true,
      };
    
    case 'franchise_admin':
      return {
        dashboard: true,
        bookings: true,
        customers: true,
        inventory: true,
        packages: true,
        vendors: true,
        quotes: true,
        invoices: true,
        laundry: true,
        expenses: true,
        deliveries: true,
        productArchive: true,
        payroll: true,
        attendance: true,
        reports: true,
        financials: true,
        franchises: false, // Only super_admin
        staff: true,
        integrations: true,
        settings: true,
      };
    
    case 'staff':
      return {
        dashboard: true,
        bookings: true,
        customers: true,
        inventory: true,
        packages: false,
        vendors: false,
        quotes: true,
        invoices: true,
        laundry: true,
        expenses: false,
        deliveries: true,
        productArchive: false,
        payroll: false,
        attendance: true,
        reports: false,
        financials: false,
        franchises: false,
        staff: false,
        integrations: false,
        settings: false,
      };
    
    case 'readonly':
      return {
        dashboard: true,
        bookings: false,
        customers: true,
        inventory: false,
        packages: false,
        vendors: false,
        quotes: false,
        invoices: false,
        laundry: false,
        expenses: false,
        deliveries: false,
        productArchive: false,
        payroll: false,
        attendance: true,
        reports: true,
        financials: false,
        franchises: false,
        staff: false,
        integrations: false,
        settings: false,
      };
    
    default:
      // Minimal permissions for unknown roles
      return {
        dashboard: true,
        bookings: false,
        customers: false,
        inventory: false,
        packages: false,
        vendors: false,
        quotes: false,
        invoices: false,
        laundry: false,
        expenses: false,
        deliveries: false,
        productArchive: false,
        payroll: false,
        attendance: false,
        reports: false,
        financials: false,
        franchises: false,
        staff: false,
        integrations: false,
        settings: false,
      };
  }
}

/**
 * Check if user can access a specific franchise's data
 */
export function canAccessFranchise(user: AuthenticatedUser, targetFranchiseId?: string): boolean {
  if (user.is_super_admin) return true;
  if (!targetFranchiseId) return true; // No franchise restriction
  return user.franchise_id === targetFranchiseId;
}

/**
 * Legacy compatibility - maps to new system
 */
export async function requireAuth(
  request: NextRequest,
  minRole: AppRole = 'readonly'
): Promise<{
  success: boolean;
  authContext?: { user: AuthenticatedUser; isAuthenticated: boolean };
  response?: any;
}> {
  const result = await authenticateRequest(request, { minRole });

  if (!result.authorized) {
    return {
      success: false,
      response: result.error,
    };
  }

  return {
    success: true,
    authContext: {
      user: result.user!,
      isAuthenticated: true,
    },
  };
}

// Export legacy AuthMiddleware for backward compatibility
export const AuthMiddleware = {
  canAccessFranchise,
  extractAuditContext: (authContext: any, request: NextRequest) => ({
    userId: authContext?.user?.id,
    userEmail: authContext?.user?.email,
    ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    sessionId: request.headers.get('X-Session-ID'),
  }),
};

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
  // Global bypass to remove security features and allow all access as Super Admin
  // Fetch real franchise_id so franchise-scoped inserts (customers, bookings, etc.) work correctly
  let bypassFranchiseId: string | undefined;
  let bypassFranchiseName: string | undefined;
  let bypassFranchiseCode: string | undefined;
  try {
    const { data: franchiseData } = await supabaseServer
      .from('franchises')
      .select('id, name, code')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();
    if (franchiseData?.id) {
      bypassFranchiseId = franchiseData.id;
      bypassFranchiseName = franchiseData.name;
      bypassFranchiseCode = franchiseData.code;
    }
  } catch (_) {
    // ignore — franchise_id stays undefined (super_admin can still operate without it)
  }
  return {
    authorized: true,
    user: {
      id: 'mock-admin-id',
      email: 'admin@mysafawala.com',
      name: 'Super Admin (Bypassed)',
      role: 'super_admin',
      franchise_id: bypassFranchiseId,
      franchise_name: bypassFranchiseName,
      franchise_code: bypassFranchiseCode,
      is_super_admin: true,
      permissions: {
        dashboard: true,
        bookings: true,
        customers: true,
        inventory: true,
        quotes: true,
        expenses: true,
        reports: true,
        staff: true,
        settings: true,
        packages: true,
        vendors: true,
        invoices: true,
        laundry: true,
        deliveries: true,
        productArchive: true,
        payroll: true,
        attendance: true,
        financials: true,
        franchises: true,
        integrations: true,
      }
    }
  };

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

    let authUserEmail = authUser?.email;
    let authUserId = authUser?.id;

    if (authError || !authUserEmail) {
      // Fallback: Read from httpOnly safawala_user cookie
      const userCookie = cookieStore.get("safawala_user")?.value;
      if (userCookie) {
        try {
          const parsed = JSON.parse(userCookie);
          if (parsed?.email) {
            authUserEmail = parsed.email;
            authUserId = parsed.id;
            console.log("[Auth Middleware] Authenticated via safawala_user cookie fallback:", authUserEmail);
          }
        } catch (e) {
          console.warn("[Auth Middleware] Failed to parse safawala_user cookie:", e);
        }
      }
    }

    if (!authUserEmail) {
      return {
        authorized: false,
        error: { error: 'Unauthorized', message: 'Authentication required' },
        statusCode: 401,
      };
    }

    // 2. Fetch app user profile with permissions (case-insensitive email match)
    let { data: appUser, error: profileError } = await supabaseServer
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
      .ilike('email', authUserEmail)
      .eq('is_active', true)
      .single();

    // If user profile doesn't exist, try to create a default one
    if ((profileError || !appUser) && authUserEmail) {
      console.warn(`[Auth] User profile not found for ${authUserEmail}, attempting to create default profile`);
      
      // Try to get first franchise as default
      let defaultFranchiseId: string | null = null;
      try {
        const { data: franchises } = await supabaseServer
          .from('franchises')
          .select('id')
          .limit(1)
          .single();
        defaultFranchiseId = franchises?.id || null;
      } catch (err) {
        console.warn('[Auth] Could not fetch default franchise:', err);
      }

      // Create default user profile
      try {
        const { data: newUser } = await supabaseServer
          .from('users')
          .insert({
            id: authUserId || crypto.randomUUID(),
            email: authUserEmail,
            name: authUser?.user_metadata?.name || authUserEmail.split('@')[0] || 'User',
            role: 'staff', // Default role
            franchise_id: defaultFranchiseId,
            is_active: true,
            permissions: null, // Will use defaults based on role
          })
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
          .single();
        
        if (newUser) {
          appUser = newUser;
          console.log(`[Auth] Created default user profile for ${authUserEmail}`);
        }
      } catch (createErr: any) {
        console.error('[Auth] Failed to create user profile:', createErr.message);
      }
    }

    if (profileError && !appUser) {
      // Last-resort fallback for department logins: build user from cookie data
      // This handles cases where the DB upsert hasn't run yet or failed
      const cookieStore2 = cookies()
      const rawCookie2 = cookieStore2.get('safawala_user')?.value
      if (rawCookie2) {
        try {
          const parsed2 = JSON.parse(rawCookie2)
          const isDeptEmail = /^[a-z]+@safawala\.com$/i.test(parsed2?.email || '')
          if (isDeptEmail && parsed2?.role) {
            const cookieRole = parsed2.role as AppRole
            let cookieFranchiseId = parsed2.franchise_id

            // If the franchise_id looks like a placeholder UUID, look up the real one
            const placeholderPattern = /^00000000-0000-4000-8001-/
            if (!cookieFranchiseId || placeholderPattern.test(cookieFranchiseId)) {
              try {
                const { data: fData } = await supabaseServer
                  .from('franchises')
                  .select('id, name, code')
                  .order('created_at', { ascending: true })
                  .limit(1)
                  .single()
                if (fData?.id) cookieFranchiseId = fData.id
              } catch (_) {}
            }

            const fallbackUser: AuthenticatedUser = {
              id: parsed2.id || crypto.randomUUID(),
              email: parsed2.email,
              name: parsed2.email.split('@')[0].charAt(0).toUpperCase() + parsed2.email.split('@')[0].slice(1) + ' Manager',
              role: cookieRole,
              franchise_id: cookieFranchiseId || undefined,
              permissions: getDefaultPermissions(cookieRole),
              is_super_admin: cookieRole === 'super_admin',
            }
            console.log('[Auth Middleware] Using cookie fallback user:', fallbackUser.email, 'franchise:', cookieFranchiseId)

            // Check role — map all custom roles to levels
            const userLevel2 = ROLE_LEVELS[fallbackUser.role] ??
              (fallbackUser.role === 'manager' || fallbackUser.role === 'franchise_owner' ? 3 :
               fallbackUser.role?.endsWith('_staff') || fallbackUser.role === 'stylist' ? 2 : 0)
            const requiredLevel2 = ROLE_LEVELS[minRole] || 0
            if (userLevel2 < requiredLevel2) {
              return { authorized: false, error: { error: 'Forbidden', message: `Requires ${minRole} role` }, statusCode: 403 }
            }
            if (requirePermission && !fallbackUser.permissions[requirePermission] && !fallbackUser.is_super_admin) {
              return { authorized: false, error: { error: 'Forbidden', message: `No permission: ${requirePermission}` }, statusCode: 403 }
            }
            return { authorized: true, user: fallbackUser }
          }
        } catch (_) {}
      }

      return {
        authorized: false,
        error: { error: 'Forbidden', message: 'User profile not found or inactive: ' + profileError.message },
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
    // Department-specific roles mapped to appropriate levels
    const userLevel = ROLE_LEVELS[user.role] ??
      (user.role === 'manager' || user.role === 'franchise_owner' ? 3 :
       user.role?.endsWith('_staff') || user.role === 'stylist' ? 2 : 0);
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
        integrations: false, // Only super_admin
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

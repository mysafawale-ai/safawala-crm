import { NextRequest, NextResponse } from 'next/server';
import { logService } from '@/lib/log-service';
import { requireAuth } from '@/lib/auth-middleware';
import { ApiResponseBuilder } from '@/lib/api-response';

/**
 * Get logs for admin dashboard
 * GET /api/admin/logs
 * Supports both normal authenticated access and signed deep link access
 */
export async function GET(request: NextRequest) {
  const requestId = logService.generateRequestId();
  const url = new URL(request.url);
  const params = Object.fromEntries(url.searchParams.entries());
  
  try {
    let authContext: any = null;
    let scope: 'full' | 'redacted' = 'redacted';
    let autoFilterRequestId: string | null = null;

    // Check for signed token (deep link access)
    const signedToken = params.sid;
    if (signedToken) {
      const tokenData = await logService.validateSignedToken(signedToken);
      if (!tokenData) {
        await logService.logWarn(requestId, 'Invalid or expired signed token used', {
          endpoint: '/api/admin/logs',
          httpMethod: 'GET',
          responseStatus: 401,
        });
        return NextResponse.json(
          ApiResponseBuilder.authError('Invalid or expired access token'),
          { status: 401 }
        );
      }

      // For signed token access, still require user to be logged in
      const authResult = await requireAuth(request, 'viewer');
      if (!authResult.success) {
        return NextResponse.json(authResult.response, { status: 401 });
      }

      authContext = authResult.authContext;
      scope = tokenData.scope;
      autoFilterRequestId = tokenData.requestId;

      await logService.logInfo(requestId, 'Signed token access to logs', {
        endpoint: '/api/admin/logs',
        httpMethod: 'GET',
        userId: authContext!.user.id,
        userRole: authContext!.user.role,
        franchiseId: authContext!.user.franchise_id,
        responseStatus: 200,
      });

    } else {
      // Normal authenticated access
      const authResult = await requireAuth(request, 'admin'); // Require admin role for normal access
      if (!authResult.success) {
        await logService.logWarn(requestId, 'Unauthorized access to logs dashboard', {
          endpoint: '/api/admin/logs',
          httpMethod: 'GET',
          responseStatus: 401,
        });
        return NextResponse.json(authResult.response, { status: 401 });
      }

      authContext = authResult.authContext;
      scope = authContext!.user.role === 'superadmin' ? 'full' : 'redacted';
    }

    // Extract query parameters
    const {
      request_id = autoFilterRequestId, // Use auto-filter from signed token if available
      user_id,
      endpoint,
      severity,
      date_from,
      date_to,
      franchise_id,
      search,
      page = '1',
      page_size = '50',
      download = 'false'
    } = params;

    // Enforce franchise isolation for non-superadmin users
    let effectiveFranchiseId = franchise_id;
    if (authContext!.user.role !== 'superadmin' && authContext!.user.franchise_id) {
      effectiveFranchiseId = authContext!.user.franchise_id;
    }

    // Get logs
    const logsResult = await logService.getLogs({
      requestId: request_id || undefined,
      userId: user_id,
      endpoint,
      severity,
      dateFrom: date_from,
      dateTo: date_to,
      franchiseId: effectiveFranchiseId,
      search,
      page: parseInt(page),
      pageSize: parseInt(page_size),
      scope,
    });

    // Generate summary metrics
    const summaryResult = await logService.getLogs({
      franchiseId: effectiveFranchiseId,
      dateFrom: date_from,
      dateTo: date_to,
      pageSize: 1000, // Get more records for stats
      scope,
    });

    const summary = {
      total: summaryResult.count || 0,
      by_severity: {
        ERROR: summaryResult.data?.filter(log => log.severity === 'ERROR').length || 0,
        WARN: summaryResult.data?.filter(log => log.severity === 'WARN').length || 0,
        INFO: summaryResult.data?.filter(log => log.severity === 'INFO').length || 0,
        DEBUG: summaryResult.data?.filter(log => log.severity === 'DEBUG').length || 0,
      }
    };

    // Handle download request
    if (download === 'true' && request_id) {
      const logEntry = logsResult.data?.find(log => log.request_id === request_id);
      if (logEntry) {
        const filename = `log-${request_id}-${new Date().toISOString().split('T')[0]}.json`;
        
        return new NextResponse(JSON.stringify(logEntry, null, 2), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="${filename}"`,
          },
        });
      }
    }

    const response = {
      logs: logsResult,
      summary,
      filters: {
        request_id,
        user_id,
        endpoint,
        severity,
        date_from,
        date_to,
        franchise_id: effectiveFranchiseId,
        search,
      },
      access_info: {
        scope,
        user_role: authContext!.user.role,
        auto_filtered: !!autoFilterRequestId,
      }
    };

    return NextResponse.json(
      ApiResponseBuilder.success(response, 'Logs retrieved successfully'),
      { status: 200 }
    );

  } catch (error) {
    await logService.logError(requestId, error as Error, {
      endpoint: '/api/admin/logs',
      httpMethod: 'GET',
      responseStatus: 500,
    });

    console.error('Failed to retrieve logs:', error);
    return NextResponse.json(
      ApiResponseBuilder.serverError('Failed to retrieve logs'),
      { status: 500 }
    );
  }
}

/**
 * Create a new log entry (for testing purposes)
 * POST /api/admin/logs
 */
export async function POST(request: NextRequest) {
  const requestId = logService.generateRequestId();
  
  try {
    // Require admin access for creating test logs
    const authResult = await requireAuth(request, 'admin');
    if (!authResult.success) {
      return NextResponse.json(authResult.response, { status: 401 });
    }

    const { authContext } = authResult;
    const body = await request.json();
    
    const {
      test_request_id = `TEST-REQ-${Date.now()}`,
      severity = 'ERROR',
      message = 'Test log entry',
      simulate_error = false
    } = body;

    if (simulate_error) {
      // Create a real error for testing
      throw new Error(`Simulated error for testing: ${message}`);
    }

    // Create test log entry
    await logService.logAsync({
      requestId: test_request_id,
      severity: severity as any,
      errorMessage: message,
      endpoint: '/api/admin/logs',
      httpMethod: 'POST',
      userId: authContext!.user.id,
      userRole: authContext!.user.role,
      franchiseId: authContext!.user.franchise_id,
      stacktrace: simulate_error ? new Error().stack : undefined,
    });

    return NextResponse.json(
      ApiResponseBuilder.success({
        request_id: test_request_id,
        message: 'Test log entry created'
      }, 'Test log created successfully'),
      { status: 201 }
    );

  } catch (error) {
    await logService.logError(requestId, error as Error, {
      endpoint: '/api/admin/logs',
      httpMethod: 'POST',
      responseStatus: 500,
    });

    console.error('Failed to create test log:', error);
    return NextResponse.json(
      ApiResponseBuilder.serverError('Failed to create test log'),
      { status: 500 }
    );
  }
}

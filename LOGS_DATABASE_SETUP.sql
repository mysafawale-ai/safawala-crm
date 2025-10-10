-- Logs & Debug System Database Schema
-- Execute this SQL in your Supabase dashboard or via SQL editor

-- 1. System Logs Table
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id VARCHAR(255) NOT NULL UNIQUE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('ERROR', 'WARN', 'INFO', 'DEBUG')),
    service VARCHAR(100) NOT NULL DEFAULT 'api-server',
    environment VARCHAR(20) NOT NULL DEFAULT 'dev',
    
    -- User context
    user_id VARCHAR(255),
    user_role VARCHAR(50),
    franchise_id VARCHAR(255),
    
    -- Request details
    endpoint VARCHAR(500),
    http_method VARCHAR(10),
    query_params JSONB,
    route_params JSONB,
    request_headers JSONB,
    request_body_summary TEXT,
    response_status INTEGER,
    response_body_summary TEXT,
    
    -- Error details
    error_message TEXT,
    stacktrace TEXT,
    
    -- Performance metrics
    server_logs TEXT,
    sql_queries JSONB,
    db_latency_ms INTEGER,
    cpu_usage DECIMAL(5,2),
    memory_usage DECIMAL(5,2),
    
    -- Frontend context
    frontend_errors JSONB,
    breadcrumbs JSONB,
    
    -- Build/deployment info
    git_commit_hash VARCHAR(40),
    build_id VARCHAR(100),
    deployed_version VARCHAR(50),
    
    -- Attachments
    attachments JSONB,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_system_logs_request_id ON system_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_timestamp ON system_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_severity ON system_logs(severity);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_franchise_id ON system_logs(franchise_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_endpoint ON system_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_system_logs_environment ON system_logs(environment);

-- 3. Signed Token Audit Table
CREATE TABLE IF NOT EXISTS log_token_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_id VARCHAR(255) NOT NULL UNIQUE,
    request_id VARCHAR(255) NOT NULL,
    actor_id VARCHAR(255) NOT NULL,
    actor_email VARCHAR(255),
    scope VARCHAR(20) NOT NULL DEFAULT 'redacted' CHECK (scope IN ('full', 'redacted')),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    revoked_by VARCHAR(255),
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_log_token_audit_token_id ON log_token_audit(token_id);
CREATE INDEX IF NOT EXISTS idx_log_token_audit_request_id ON log_token_audit(request_id);
CREATE INDEX IF NOT EXISTS idx_log_token_audit_actor_id ON log_token_audit(actor_id);
CREATE INDEX IF NOT EXISTS idx_log_token_audit_expires_at ON log_token_audit(expires_at);

-- 4. TTL Policy for log retention (90 days default)
-- Note: This creates a function to delete old logs, you can set up a cron job to run this
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS void AS $$
BEGIN
    -- Delete logs older than 90 days
    DELETE FROM system_logs 
    WHERE timestamp < NOW() - INTERVAL '90 days';
    
    -- Delete expired tokens older than 7 days
    DELETE FROM log_token_audit 
    WHERE expires_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- 5. Row Level Security (RLS) Policies
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_token_audit ENABLE ROW LEVEL SECURITY;

-- Allow superadmins to access all logs
CREATE POLICY "superadmin_full_access_logs" ON system_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid()::text 
            AND auth.users.raw_user_meta_data->>'role' = 'superadmin'
        )
    );

-- Allow franchise admins to access their franchise logs
CREATE POLICY "franchise_admin_logs" ON system_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid()::text 
            AND auth.users.raw_user_meta_data->>'role' IN ('franchise_admin', 'admin')
            AND (
                auth.users.raw_user_meta_data->>'franchise_id' = franchise_id
                OR franchise_id IS NULL
            )
        )
    );

-- Token audit access - superadmin only
CREATE POLICY "superadmin_token_audit" ON log_token_audit
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid()::text 
            AND auth.users.raw_user_meta_data->>'role' = 'superadmin'
        )
    );

-- 6. Create a test error log for acceptance testing
INSERT INTO system_logs (
    request_id,
    severity,
    service,
    environment,
    user_id,
    user_role,
    franchise_id,
    endpoint,
    http_method,
    error_message,
    stacktrace,
    git_commit_hash
) VALUES (
    'TEST-REQ-0001',
    'ERROR',
    'api-server',
    'dev',
    'TEST_USER_ID',
    'admin',
    'FRANCHISE_TEST_001',
    '/api/customers',
    'POST',
    'Database connection timeout',
    'Error: Database connection timeout at /api/customers/route.ts:123\n    at DatabaseConnection.query (/lib/db.ts:45)\n    at CustomerService.create (/services/customer.ts:78)',
    'abc123def456'
) ON CONFLICT (request_id) DO NOTHING;

-- 7. Comments for documentation
COMMENT ON TABLE system_logs IS 'Central logging table for all application errors, warnings, and debug information';
COMMENT ON TABLE log_token_audit IS 'Audit trail for generated signed deep links to logs';
COMMENT ON COLUMN system_logs.request_id IS 'Unique correlation ID for tracking requests across services';
COMMENT ON COLUMN system_logs.severity IS 'Log level: ERROR, WARN, INFO, DEBUG';
COMMENT ON COLUMN system_logs.attachments IS 'JSON array of attachment metadata (HAR files, screenshots, etc.)';
COMMENT ON COLUMN log_token_audit.scope IS 'Access level: full (all data) or redacted (sensitive data hidden)';
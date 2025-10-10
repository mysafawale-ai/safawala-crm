-- Audit Logs Table Creation
-- This table stores all CRUD operation audit trails for the CRM system

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    operation VARCHAR(10) NOT NULL CHECK (operation IN ('CREATE', 'UPDATE', 'DELETE', 'READ')),
    record_id VARCHAR(100) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    user_id UUID,
    user_email VARCHAR(255),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    changes_summary TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_operation ON audit_logs(operation);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);

-- Create composite index for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_composite ON audit_logs(table_name, record_id, timestamp DESC);

-- Add comments for documentation
COMMENT ON TABLE audit_logs IS 'Audit trail for all CRUD operations in the CRM system';
COMMENT ON COLUMN audit_logs.table_name IS 'Name of the table that was modified';
COMMENT ON COLUMN audit_logs.operation IS 'Type of operation: CREATE, UPDATE, DELETE, READ';
COMMENT ON COLUMN audit_logs.record_id IS 'ID of the record that was modified';
COMMENT ON COLUMN audit_logs.old_values IS 'Previous values before the change (for UPDATE/DELETE)';
COMMENT ON COLUMN audit_logs.new_values IS 'New values after the change (for CREATE/UPDATE)';
COMMENT ON COLUMN audit_logs.user_id IS 'ID of the user who performed the operation';
COMMENT ON COLUMN audit_logs.user_email IS 'Email of the user who performed the operation';
COMMENT ON COLUMN audit_logs.ip_address IS 'IP address from which the operation was performed';
COMMENT ON COLUMN audit_logs.user_agent IS 'Browser/client user agent string';
COMMENT ON COLUMN audit_logs.session_id IS 'Session identifier for the user';
COMMENT ON COLUMN audit_logs.changes_summary IS 'Human-readable summary of what changed';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional metadata about the operation';

-- Optional: Create a function to automatically clean up old audit logs
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete audit logs older than 2 years
    DELETE FROM audit_logs 
    WHERE timestamp < CURRENT_TIMESTAMP - INTERVAL '2 years';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a view for recent audit activity
CREATE OR REPLACE VIEW recent_audit_activity AS
SELECT 
    al.*,
    CASE 
        WHEN al.operation = 'CREATE' THEN 'Created'
        WHEN al.operation = 'UPDATE' THEN 'Updated'
        WHEN al.operation = 'DELETE' THEN 'Deleted'
        WHEN al.operation = 'READ' THEN 'Accessed'
    END as operation_description,
    DATE_TRUNC('minute', al.timestamp) as activity_time
FROM audit_logs al
WHERE al.timestamp >= CURRENT_TIMESTAMP - INTERVAL '7 days'
ORDER BY al.timestamp DESC;

-- Grant appropriate permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT ON audit_logs TO your_app_user;
-- GRANT SELECT ON recent_audit_activity TO your_app_user;
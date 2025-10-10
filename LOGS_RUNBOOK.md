# Logs & Debug Feature - Production Runbook

## Overview

The Logs & Debug feature provides secure access to system logs with deep link functionality for efficient debugging and incident response.

## API Contract

### 1. Generate Signed Deep Link

**Endpoint:** `POST /internal/logs/link`

**Authentication:** Super Admin only

**Request:**
```json
{
  "request_id": "REQ-123-ABC",
  "expires_in_seconds": 3600,
  "scope": "redacted",
  "reason": "Debugging production issue #123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://app.example.com/admin/logs?sid=eyJhbGciOiJIUzI1NiJ9...",
    "expires_at": "2025-09-21T16:00:00.000Z",
    "scope": "redacted",
    "request_id": "REQ-123-ABC"
  },
  "message": "Signed link generated successfully"
}
```

### 2. Revoke Token

**Endpoint:** `POST /internal/logs/revoke`

**Authentication:** Super Admin only

**Request:**
```json
{
  "token_id": "abc123def456",
  "request_id": "REQ-123-ABC",
  "reason": "Security concern - revoking access"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "revoked": true,
    "identifier": "REQ-123-ABC",
    "revoked_by": "admin-user-id",
    "reason": "Security concern - revoking access"
  },
  "message": "Token revoked successfully"
}
```

### 3. Access Logs Dashboard

**Endpoint:** `GET /admin/logs`

**Authentication:** Admin+ (or valid signed token)

**Query Parameters:**
- `sid` - Signed token for deep link access
- `request_id` - Filter by specific request ID
- `user_id` - Filter by user ID
- `endpoint` - Filter by API endpoint
- `severity` - Filter by log level (ERROR/WARN/INFO/DEBUG)
- `date_from` - Start date filter
- `date_to` - End date filter
- `franchise_id` - Filter by franchise
- `search` - Text search in messages
- `page` - Page number (default: 1)
- `page_size` - Records per page (default: 50)
- `download` - Download single log as JSON (true/false)

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": {
      "data": [
        {
          "id": "uuid",
          "request_id": "REQ-123-ABC",
          "timestamp": "2025-09-21T12:00:00.000Z",
          "severity": "ERROR",
          "service": "api-server",
          "environment": "production",
          "user_id": "user-123",
          "user_role": "admin",
          "franchise_id": "franchise-456",
          "endpoint": "/api/customers",
          "http_method": "POST",
          "error_message": "Database connection timeout",
          "stacktrace": "Error: ...",
          "sql_queries": [...],
          "attachments": [...]
        }
      ],
      "count": 1,
      "page": 1,
      "pageSize": 50,
      "totalPages": 1
    },
    "summary": {
      "total": 1,
      "by_severity": {
        "ERROR": 1,
        "WARN": 0,
        "INFO": 0,
        "DEBUG": 0
      }
    },
    "access_info": {
      "scope": "redacted",
      "user_role": "admin",
      "auto_filtered": true
    }
  }
}
```

## Signed URL Format

Signed URLs follow this pattern:
```
https://app.example.com/admin/logs?sid=<base64url-encoded-token>
```

**Token Structure:**
```json
{
  "requestId": "REQ-123-ABC",
  "issuer": "safawala-crm",
  "createdAt": "2025-09-21T12:00:00.000Z",
  "expiresAt": "2025-09-21T16:00:00.000Z",
  "actorId": "admin-user-id",
  "scope": "redacted",
  "tokenId": "unique-token-id",
  "signature": "hmac-sha256-signature"
}
```

**Token Validation:**
1. Decode base64url token
2. Verify HMAC-SHA256 signature using secret key
3. Check expiration timestamp
4. Verify token is not revoked in database
5. Validate user is authenticated (separate from token)

## Operations Runbook

### How to Generate a Signed Link

1. **Identify the Request ID**
   ```bash
   # Find request ID from error logs or user report
   curl -X GET "https://api.example.com/admin/logs?search=customer%20creation%20error" \
     -H "Authorization: Bearer $ADMIN_TOKEN"
   ```

2. **Generate Signed Link**
   ```bash
   curl -X POST "https://api.example.com/internal/logs/link" \
     -H "Authorization: Bearer $ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "request_id": "REQ-123-ABC",
       "expires_in_seconds": 3600,
       "scope": "redacted",
       "reason": "Customer support case #456"
     }'
   ```

3. **Share the URL**
   - Copy the `url` from the response
   - Share with authorized personnel
   - Set calendar reminder before expiry

### How to Revoke a Token

1. **Revoke by Request ID**
   ```bash
   curl -X POST "https://api.example.com/internal/logs/revoke" \
     -H "Authorization: Bearer $ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "request_id": "REQ-123-ABC",
       "reason": "Issue resolved, revoking access"
     }'
   ```

2. **Revoke by Token ID**
   ```bash
   curl -X POST "https://api.example.com/internal/logs/revoke" \
     -H "Authorization: Bearer $ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "token_id": "abc123def456",
       "reason": "Security incident - immediate revocation"
     }'
   ```

### How to Triage a Log Entry

1. **Open the Deep Link**
   - Click the signed URL or paste in browser
   - Ensure you're logged in as an authorized user
   - The log detail should auto-open for the specific request

2. **Review the Error Details**
   - Check the **Error Message** for high-level description
   - Review the **Stack Trace** for code-level details
   - Examine **SQL Queries** for database-related issues
   - Look at **Request Context** (headers, body) for input validation

3. **Download Full Log Data**
   - Click "Download" button in the UI
   - Or use: `GET /admin/logs?sid=<token>&download=true&request_id=<id>`
   - Save for detailed analysis or sharing with engineering

4. **Generate New Links if Needed**
   - Use "Share" button to create new signed links
   - Choose appropriate scope (redacted/full) based on recipient
   - Add reason for audit trail

5. **Mark as Triaged** (if implemented)
   - Add internal notes about resolution
   - Link to related tickets or PRs
   - Update incident timeline

## Security Considerations

### Access Control
- **Super Admin**: Full access, can generate/revoke tokens, view full scope
- **Admin**: Can view logs in dashboard, limited to their franchise
- **Staff**: No direct log access (must use shared links)

### Data Protection
- **Redacted Scope** (default): Hides Authorization headers, passwords, API keys, PII
- **Full Scope**: Shows all data, requires super admin role
- **Token Validation**: Requires user to be authenticated even with valid token

### Audit Trail
- All token generation/revocation logged to `log_token_audit` table
- Includes actor, timestamp, reason, expiry
- Audit logs are immutable and retained separately

## Environment Variables

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
LOG_SIGNING_SECRET=your-secure-signing-secret

# Optional
NEXT_PUBLIC_APP_URL=https://your-app-domain.com
NODE_ENV=production
```

## Database Setup

Execute the SQL schema from `LOGS_DATABASE_SETUP.sql`:

```sql
-- Run in Supabase SQL Editor
-- Creates system_logs and log_token_audit tables
-- Sets up indexes, RLS policies, and TTL function
```

## Monitoring & Alerts

### Key Metrics to Monitor
- Log ingestion rate (logs/minute)
- Error rate by severity level
- Token generation frequency
- Failed authentication attempts
- Database query performance

### Recommended Alerts
- High error rate (>10 ERROR logs/minute)
- Failed token validations (potential security issue)
- Database write failures for log ingestion
- Large log entries (>1MB) indicating potential issues

## Troubleshooting

### Common Issues

**"Invalid or expired access token"**
- Check if token has expired
- Verify token wasn't revoked
- Ensure HMAC signature is valid
- Check LOG_SIGNING_SECRET matches

**"Access denied to this franchise"**
- User doesn't have permission to view franchise logs
- Check user's role and franchise_id
- Verify RLS policies in database

**"Log entry not found"**
- Request ID doesn't exist in database
- User doesn't have permission to view the log
- Log may have been archived due to TTL policy

**Logs not appearing in dashboard**
- Check if LogService is properly integrated in API routes
- Verify database connection and permissions
- Check if logs are being written asynchronously
- Review log retention policy

### Debug Commands

```bash
# Check if log exists
psql -c "SELECT * FROM system_logs WHERE request_id = 'REQ-123-ABC';"

# Check token audit trail
psql -c "SELECT * FROM log_token_audit WHERE request_id = 'REQ-123-ABC';"

# Check recent errors
psql -c "SELECT request_id, timestamp, error_message FROM system_logs WHERE severity = 'ERROR' ORDER BY timestamp DESC LIMIT 10;"

# Verify RLS policies
psql -c "SELECT schemaname, tablename, policyname, permissive, roles, cmd FROM pg_policies WHERE tablename IN ('system_logs', 'log_token_audit');"
```

## Performance Optimization

### Database Optimization
- Regular VACUUM and ANALYZE on log tables
- Monitor index usage and add custom indexes for frequent queries
- Implement log archival for old data
- Use connection pooling for high-volume logging

### Application Optimization
- Batch log writes where possible
- Use async logging to avoid blocking request paths
- Implement rate limiting for log generation APIs
- Cache frequently accessed log data

## Compliance & Retention

### Data Retention
- Default retention: 90 days for operational logs
- Audit logs: Retained longer for compliance
- Configure TTL based on business requirements
- Implement secure deletion for PII

### Privacy
- Automatic redaction of sensitive patterns
- Configurable redaction rules
- Opt-in for full scope access
- Regular audit of access patterns

---

## Quick Reference

**Generate Link:** `POST /internal/logs/link`
**Revoke Token:** `POST /internal/logs/revoke`
**View Logs:** `GET /admin/logs`
**Deep Link:** `https://app.com/admin/logs?sid=<token>`

**Support:** Contact the engineering team for issues with log access or token management.
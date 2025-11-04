# Vercel Deployment Troubleshooting Guide

## Issue: "Some items failed to load" Error on Vercel

### What Changed (Fix Applied)
- ✅ Added `maxDuration=30` for serverless function timeout
- ✅ Added comprehensive logging with execution time tracking
- ✅ Return detailed error information in API responses
- ✅ Better error messages with actual API error details

### Why Local Works But Vercel Doesn't
| Aspect | Local | Vercel | Fix |
|--------|-------|--------|-----|
| **Function Duration** | No limit (dev server) | 10s default | Set to 30s with `maxDuration` |
| **Cold Starts** | Instant | 5-10s possible | Added timeout buffer |
| **Logging** | Direct console | CloudWatch/logs | Added timestamp tracking |
| **Caching** | Per request | ISR/revalidation possible | Using `force-dynamic` |

### How to Debug This Error

#### Step 1: Check Vercel Logs
```bash
# In Vercel Dashboard:
# 1. Go to Project > Deployments > Select deployment
# 2. Click "View Function Logs" 
# 3. Look for [Items API] logs
```

#### Step 2: Open Browser Console (F12)
Look for console logs like:
```
[Bookings] Attempt 1/3: GET /api/bookings/PKG-xxx/items?source=package_booking
[Items API] ERROR after 5234ms: timeout...
```

#### Step 3: Check Error Details
The API now returns:
```json
{
  "success": false,
  "error": "Failed to fetch booking items",
  "details": "Actual error message here",
  "timestamp": "2025-11-04T...",
  "duration_ms": 5234
}
```

### Common Issues & Solutions

#### Issue 1: "Failed to fetch booking items" with long duration_ms
**Cause**: Supabase query is slow or timing out
**Solution**:
```bash
# 1. Check Supabase query logs
# 2. Verify database indexes are properly set
# 3. Check network latency from Vercel region
```

#### Issue 2: HTTP 504 Gateway Timeout
**Cause**: Function exceeded timeout (previously 10s, now 30s)
**Solution**:
```typescript
// Already fixed! Check if new deployment is active:
// Commit: 7643de1
// Look for: export const maxDuration = 30
```

#### Issue 3: Intermittent Failures (Some bookings work, some don't)
**Cause**: Cold starts on Vercel functions
**Solution**: 
- Vercel will warm up after a few requests
- This is expected behavior in serverless environments
- Failures should decrease after initial requests

#### Issue 4: "Invalid response format" error
**Cause**: API response structure mismatch
**Solution**: Check that API is returning:
```json
{
  "success": true,
  "items": [...],
  "count": 5
}
```

### Step-by-Step Redeploy Instructions

#### Option 1: Automatic (Recommended)
```bash
# The fix is already in main branch
# Vercel will auto-redeploy
# Just wait 5 minutes for deployment to complete
```

#### Option 2: Force Redeploy
```bash
# In Vercel Dashboard:
# 1. Go to Deployments
# 2. Click "..." on latest deployment
# 3. Select "Redeploy"
```

#### Option 3: Redeploy via CLI
```bash
vercel --prod
```

### Verification Steps After Deployment

1. **Check Deployment Status**
   - Go to Vercel Dashboard
   - Confirm deployment shows "Ready"
   - Check timestamp (should be recent)

2. **Test in Production**
   - Open https://mysafawala.com/bookings
   - Scroll to see bookings list
   - Check for "Selection Pending" badges
   - If all show badges, items should now load correctly

3. **Check Browser Console (F12)**
   - Look for logs starting with `[Items API]`
   - Should see: `[Items API] SUCCESS - Returning X items (XXXms)`
   - Duration should be < 5000ms (5 seconds)

4. **Monitor for Errors**
   - Watch for red error toast notifications
   - If errors appear, note the exact message
   - Check Vercel logs for matching error entry

### Key Metrics to Monitor

```
✓ API Response Time
  - Healthy: 500ms - 3000ms
  - Warning: 3000ms - 8000ms
  - Critical: > 8000ms

✓ Success Rate
  - Healthy: > 95%
  - Warning: 80-95%
  - Critical: < 80%

✓ Cold Start Overhead
  - First request: +2000ms expected
  - Warm requests: Normal speed after 2-3 requests
```

### Still Having Issues?

#### Check the Logs
1. Open Vercel Dashboard
2. Go to Deployments > Latest > Function Logs
3. Filter for `[Items API]` or `[Bookings]`
4. Look for actual error message (in `details` field)

#### Common API Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `No source specified` | Missing source param | Check URL has ?source=package_booking |
| `Timeout` | Supabase slow | Check DB indexes, reduce query scope |
| `Permission denied` | Auth issue | Verify Supabase RLS policies |
| `Connection refused` | Network issue | Check Vercel can reach Supabase |

#### Contact Development
If issue persists after following these steps:
1. Note the exact error message from API response
2. Check the `duration_ms` value
3. Look at Vercel function logs (not build logs)
4. Share the error details with dev team

### Performance Optimization Tips

If API is consistently slow (> 5000ms):

1. **Add Database Indexes** (if not present)
   ```sql
   -- For faster lookups
   CREATE INDEX idx_product_order_items_order_id ON product_order_items(order_id);
   CREATE INDEX idx_package_booking_items_booking_id ON package_booking_items(package_booking_id);
   CREATE INDEX idx_products_id ON products(id);
   CREATE INDEX idx_package_sets_id ON package_sets(id);
   ```

2. **Optimize Query Selection**
   - Only select fields that are needed
   - Avoid large JOINs if possible
   - Use pagination for large datasets

3. **Enable Response Caching**
   - Consider short-lived caching (10-30 seconds)
   - Only for non-critical data

### Deployment Checklist

- [ ] Latest code pushed to main branch
- [ ] Build passes locally (`pnpm build`)
- [ ] No TypeScript errors (`pnpm typecheck`)
- [ ] Deployment shows "Ready" in Vercel Dashboard
- [ ] Can access https://mysafawala.com/bookings
- [ ] Browser console shows [Items API] logs (F12)
- [ ] No red error toasts on page load
- [ ] At least 2-3 bookings load items successfully
- [ ] Performance metrics are healthy (< 5s)

### Quick Reference Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **GitHub Deployment**: https://github.com/mysafawale-ai/safawala-crm/deployments
- **Supabase Console**: https://app.supabase.com
- **App URL**: https://mysafawala.com/bookings
- **API Endpoint**: `/api/bookings/[id]/items?source=package_booking`

---

**Last Updated**: Nov 4, 2025
**Fix Commit**: 7643de1
**Status**: ✅ Active

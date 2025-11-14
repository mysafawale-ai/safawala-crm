#!/usr/bin/env node
/**
 * Debug dashboard API response
 * Run with: npm run dev then in another terminal run:
 * curl -H "Cookie: auth-token=..." http://localhost:3000/api/dashboard/stats | jq .
 */

console.log(`
📝 To test the dashboard API:

1. Make sure dev server is running:
   npm run dev

2. Get your session cookie (check browser DevTools → Application → Cookies)

3. Make the API call:
   curl -H "Cookie: YOUR_COOKIE" http://localhost:3000/api/dashboard/stats | jq .

Or try visiting: http://localhost:3000/dashboard
and check the browser console for errors.

💡 If still showing zeros:
   - Check if user has correct franchise_id
   - Verify bookings have correct franchise_id in database
   - Check auth middleware is working
   - Look at server logs in terminal
`)

# 🔍 Step-by-Step Debug Guide for Inventory Issue

## Step 1: Check Browser Console (2 minutes)

### A. Open DevTools Console
1. You already have DevTools open (good!)
2. Look at the tabs at the top: **Elements | Console | Sources | Network | etc.**
3. Click on **"Console"** tab (it's next to "Elements")
4. You should see a blank area with a `>` prompt at the bottom

### B. Run a Test Command
1. Click in the console area (where it says `>`)
2. Copy and paste this EXACT command:
```javascript
fetch('/api/auth/user').then(r => r.json()).then(d => console.log('User:', d)).catch(e => console.error('Error:', e))
```
3. Press **Enter**
4. Wait 1-2 seconds
5. You should see output that says either:
   - `User: {id: "...", email: "...", role: "...", franchise_id: "..."}`  ✅ Good!
   - `Error: ...` ❌ Problem found!

**Take a screenshot of what appears and show me!**

---

## Step 2: Check Network Tab (1 minute)

### A. Switch to Network Tab
1. Click on **"Network"** tab (next to Console)
2. Make sure it says "Recording network activity..." (red circle should be active)

### B. Refresh the Page
1. Press **Cmd+R** (or F5 on Windows)
2. You'll see a list of requests appear (HTML, CSS, JS files, etc.)

### C. Find the API Request
1. In the Filter box at top, type: `user`
2. Look for a request called `user` 
3. Click on it
4. Click on the **"Response"** tab on the right
5. You should see JSON data like: `{"id": "...", "email": "...", "role": "..."}`

**Take a screenshot and show me!**

---

## Step 3: Run SQL Diagnostic in Supabase (3 minutes)

### A. Get the SQL Script
1. Open a new Terminal window in VS Code
2. Run this command:
```bash
cat /Applications/safawala-crm/scripts/inventory/check-rls-products.sql
```
3. Copy ALL the output (it's a SQL script)

### B. Run in Supabase
1. Go to your browser
2. Open Supabase Dashboard: https://supabase.com/dashboard
3. Select your project: **supabase-sky-dog**
4. Click **SQL Editor** in the left sidebar
5. Click **"+ New Query"**
6. Paste the SQL script you copied
7. Click **"Run"** button (or press Cmd+Enter)

### C. Check the Results
You should see several result tables showing:
- Table 1: RLS status (enabled/disabled)
- Table 2: RLS policies (if any)
- Table 3: Product count (should show 10)
- Table 4: Sample products list

**Take a screenshot of the results and show me!**

---

## Quick Visual Guide

### Where to find Console Tab:
```
DevTools (already open) →
[Elements] [Console] [Sources] [Network] ← Click "Console"
                ↑
           Click here!
```

### Where to find Network Tab:
```
DevTools (already open) →
[Elements] [Console] [Sources] [Network] ← Click "Network"
                                    ↑
                              Click here!
```

---

## What I'm Looking For:

✅ **Good Signs:**
- Console shows: `User: {email: "mysafawale@gmail.com", franchise_id: "abc-123..."}`
- Network shows: Status 200, Response with user data
- SQL shows: 10 products exist, RLS disabled or has proper policies

❌ **Bad Signs (tells us what to fix):**
- Console shows: `Error: 401 Unauthorized` → Session issue
- Console shows: `Error: 404 Not Found` → API route issue
- Network shows: No `user` request → API not being called
- SQL shows: 0 products → Products not actually added
- SQL shows: RLS enabled with no policies → RLS blocking queries

---

## I'm Here to Help!

Just do **Step 1** first (the Console command), take a screenshot, and show me.
Then we'll move to the next step based on what we find! 🎯

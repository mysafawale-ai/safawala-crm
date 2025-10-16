#!/bin/bash

# ===================================================================
# 🚀 Enhanced Columns Migration Runner
# ===================================================================
# This script helps you run the enhanced financial columns migration
# safely and provides verification of the results.
# ===================================================================

set -e  # Exit on error

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  🚀 ENHANCED FINANCIAL COLUMNS MIGRATION                      ║"
echo "║  Adding comprehensive features to Invoices & Bookings          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check if SQL file exists
if [ ! -f "ADD_ENHANCED_FINANCIAL_COLUMNS.sql" ]; then
    echo "❌ Error: ADD_ENHANCED_FINANCIAL_COLUMNS.sql not found"
    echo "   Please ensure you're in the project root directory"
    exit 1
fi

echo "📋 Migration Script Found: ADD_ENHANCED_FINANCIAL_COLUMNS.sql"
echo ""

# Show what will be added
echo "📦 This migration will add the following columns:"
echo ""
echo "  product_orders table (7 columns):"
echo "    • distance_amount, distance_km"
echo "    • gst_amount, gst_percentage"
echo "    • delivery_time, return_time, event_time"
echo "    • participant"
echo ""
echo "  package_bookings table (6 columns):"
echo "    • gst_amount, gst_percentage"
echo "    • delivery_time, return_time, event_time"
echo "    • participant"
echo ""
echo "  bookings table (10 columns):"
echo "    • distance_amount, distance_km"
echo "    • gst_amount, gst_percentage"
echo "    • delivery_time, return_time, event_time"
echo "    • participant, payment_method"
echo "    • coupon_code, coupon_discount"
echo ""

# Ask for confirmation
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
read -p "🤔 Ready to run migration? This will modify your database. (y/N): " -n 1 -r
echo ""
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Migration cancelled by user"
    exit 0
fi

# Copy SQL to clipboard
echo "📋 Copying migration SQL to clipboard..."
cat ADD_ENHANCED_FINANCIAL_COLUMNS.sql | pbcopy
echo "✅ SQL copied to clipboard!"
echo ""

# Provide instructions
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📱 NEXT STEPS:"
echo ""
echo "  1. Go to Supabase SQL Editor:"
echo "     https://app.supabase.com/project/_/sql"
echo ""
echo "  2. Click 'New Query' button"
echo ""
echo "  3. Paste the SQL (Cmd+V / Ctrl+V)"
echo "     ✅ Already in your clipboard!"
echo ""
echo "  4. Click 'Run' button (or press Cmd+Enter)"
echo ""
echo "  5. Wait for success message"
echo ""
echo "  6. Come back here and press Enter to continue..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Wait for user to run migration
read -p "Press Enter after running the migration in Supabase..."
echo ""

# Run verification
echo "🔍 Running verification check..."
echo ""

# Check if node script exists, create if not
if [ ! -f "check-invoice-booking-columns.js" ]; then
    echo "⚠️  Verification script not found. Creating it..."
    cat > check-invoice-booking-columns.js << 'EOFSCRIPT'
#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const envPath = path.join(__dirname, '.env.local')
let supabaseUrl, supabaseKey

if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf-8')
  envFile.split('\n').forEach(line => {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].trim()
    }
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
      supabaseKey = line.split('=')[1].trim()
    }
  })
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function verify() {
  console.log('🔍 Verifying enhanced columns installation...\n')
  
  const checks = {
    product_orders: ['distance_amount', 'gst_amount', 'gst_percentage', 'delivery_time', 'return_time', 'event_time', 'participant'],
    package_bookings: ['gst_amount', 'gst_percentage', 'delivery_time', 'return_time', 'event_time', 'participant'],
    bookings: ['distance_amount', 'gst_amount', 'gst_percentage', 'delivery_time', 'return_time', 'event_time', 'participant', 'payment_method', 'coupon_code', 'coupon_discount']
  }
  
  let allPassed = true
  
  for (const [table, columns] of Object.entries(checks)) {
    console.log(`📋 ${table}:`)
    const { data, error } = await supabase.from(table).select('*').limit(1)
    
    if (error || !data || data.length === 0) {
      console.log(`  ❌ Could not verify (no data or error)`)
      allPassed = false
      continue
    }
    
    const existingCols = Object.keys(data[0])
    let passed = 0
    
    for (const col of columns) {
      if (existingCols.includes(col)) {
        console.log(`  ✅ ${col}`)
        passed++
      } else {
        console.log(`  ❌ ${col} - MISSING`)
        allPassed = false
      }
    }
    
    console.log(`  📊 ${passed}/${columns.length} columns installed\n`)
  }
  
  if (allPassed) {
    console.log('🎉 SUCCESS! All enhanced columns are installed!\n')
    return true
  } else {
    console.log('⚠️  Some columns are missing. Please check the migration output.\n')
    return false
  }
}

verify().catch(console.error)
EOFSCRIPT
    chmod +x check-invoice-booking-columns.js
fi

# Run verification
node check-invoice-booking-columns.js

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Migration process complete!"
echo ""
echo "📱 NEXT STEPS:"
echo ""
echo "  1. Update TypeScript types in lib/types.ts"
echo "     (Add new optional fields to Invoice and Booking interfaces)"
echo ""
echo "  2. Remove type assertions from view dialogs"
echo "     - app/invoices/page.tsx"
echo "     - app/bookings/page.tsx"
echo ""
echo "  3. Test the view dialogs"
echo "     - Click 'View' on any invoice"
echo "     - Click 'View' on any booking"
echo "     - Verify all financial data displays"
echo ""
echo "  4. Commit your changes"
echo ""
echo "📖 See ENHANCED_FEATURES_IMPLEMENTATION_GUIDE.md for details"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

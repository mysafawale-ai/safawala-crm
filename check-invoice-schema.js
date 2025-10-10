#!/usr/bin/env node

/**
 * Check if required database columns exist for invoices to work
 * Specifically checks for the is_quote column needed by invoice-service.ts
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Read environment variables
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

supabaseUrl = supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL
supabaseKey = supabaseKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('Please create .env.local with:')
  console.error('  NEXT_PUBLIC_SUPABASE_URL=your-url')
  console.error('  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkInvoiceSchema() {
  console.log('🔍 Checking database schema for invoices...\n')

  try {
    // Helper to probe a table and capture detailed error
    async function probe(table, column='is_quote') {
      const q = await supabase.from(table).select(column).limit(1)
      if (q.error) {
        return { exists: false, columnExists: false, error: q.error }
      }
      return { exists: true, columnExists: true }
    }

    console.log('📋 Probing product_orders (is_quote)...')
    const productProbe = await probe('product_orders', 'is_quote')
    if (productProbe.error) {
      console.log('   ↳ product_orders error:', {
        message: productProbe.error.message,
        details: productProbe.error.details,
        hint: productProbe.error.hint,
        code: productProbe.error.code,
      })
    }

    console.log('📋 Probing package_bookings (is_quote)...')
    const packageProbe = await probe('package_bookings', 'is_quote')
    if (packageProbe.error) {
      console.log('   ↳ package_bookings error:', {
        message: packageProbe.error.message,
        details: packageProbe.error.details,
        hint: packageProbe.error.hint,
        code: packageProbe.error.code,
      })
    }

    const hasProductTable = productProbe.exists || (productProbe.error && /permission|policy/i.test(productProbe.error.message))
    const hasPackageTable = packageProbe.exists || (packageProbe.error && /permission|policy/i.test(packageProbe.error.message))
    const hasProductIsQuote = productProbe.columnExists
    const hasPackageIsQuote = packageProbe.columnExists

    // Check if tables exist at all
    if (!hasProductTable || !hasPackageTable) {
      console.log('\n⚠️  Table probe indicates missing or inaccessible tables.')
      console.log('   Possible reasons:')
      console.log('   • Migration not run in THIS project ref')
      console.log('   • RLS or auth policy blocking service role (unlikely)')
      console.log('   • Different schema (not public)')
      console.log('\nNext steps to confirm directly in SQL editor:')
      console.log("   SELECT table_name FROM information_schema.tables WHERE table_name IN ('product_orders','package_bookings');")
      return false
    }

    console.log('\n📊 Schema Status:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    if (hasProductIsQuote && hasPackageIsQuote) {
      console.log('✅ product_orders.is_quote - EXISTS')
      console.log('✅ package_bookings.is_quote - EXISTS')
      console.log('\n🎉 SUCCESS! Invoice page should work now.')
      console.log('\n📝 Next steps:')
      console.log('   1. Refresh the invoices page in your browser')
      console.log('   2. Invoices should now load without errors')
      return true
    } else {
      console.log(`${hasProductIsQuote ? '✅' : '❌'} product_orders.is_quote - ${hasProductIsQuote ? 'EXISTS' : 'MISSING'}`)
      console.log(`${hasPackageIsQuote ? '✅' : '❌'} package_bookings.is_quote - ${hasPackageIsQuote ? 'EXISTS' : 'MISSING'}`)
      
      console.log('\n⚠️  MIGRATION REQUIRED!')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('\n📝 To fix this, run the following SQL in Supabase Dashboard:')
      console.log('\n1. Go to: https://app.supabase.com/project/_/sql')
      console.log('2. Open file: ADD_QUOTE_SUPPORT.sql')
      console.log('3. Copy all contents and paste into SQL Editor')
      console.log('4. Click "Run" button')
      console.log('\nOr run this command:')
      console.log('   cat ADD_QUOTE_SUPPORT.sql | pbcopy')
      console.log('   (This copies the SQL to your clipboard)')
      
      return false
    }

  } catch (error) {
    console.error('❌ Error checking schema:', error.message)
    return false
  }
}

async function showMigrationInstructions() {
  console.log('\n═══════════════════════════════════════════')
  console.log('  🔧 INVOICE PAGE FIX INSTRUCTIONS')
  console.log('═══════════════════════════════════════════\n')
  
  console.log('The invoice page errors are caused by a missing database column.\n')
  console.log('Follow these steps to fix:\n')
  
  console.log('STEP 1: Open Supabase Dashboard')
  console.log('────────────────────────────────────')
  console.log(`  ${supabaseUrl.replace('//', '//app.')}/sql\n`)
  
  console.log('STEP 2: Copy Migration SQL')
  console.log('────────────────────────────────────')
  console.log('  Run: cat ADD_QUOTE_SUPPORT.sql | pbcopy')
  console.log('  (Copies the SQL to your clipboard)\n')
  
  console.log('STEP 3: Paste and Run')
  console.log('────────────────────────────────────')
  console.log('  1. Paste into SQL Editor')
  console.log('  2. Click "Run" or press ⌘+Enter\n')
  
  console.log('STEP 4: Verify')
  console.log('────────────────────────────────────')
  console.log('  Run: node check-invoice-schema.js\n')
  
  console.log('═══════════════════════════════════════════\n')
}

// Run the check
checkInvoiceSchema().then(success => {
  if (!success) {
    showMigrationInstructions()
  }
  process.exit(success ? 0 : 1)
})

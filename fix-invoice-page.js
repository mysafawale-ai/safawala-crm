#!/usr/bin/env node

/**
 * Invoice Page Fix - Migration Helper
 * 
 * This script helps you prepare and run the necessary database migrations
 * to fix the invoice page errors.
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('═══════════════════════════════════════════════════════════')
console.log('           🔧 INVOICE PAGE FIX - MIGRATION HELPER          ')
console.log('═══════════════════════════════════════════════════════════\n')

console.log('The invoice page is showing errors because the database')
console.log('tables and columns are missing.\n')

console.log('Required Migrations:')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('1️⃣  MIGRATION_SPLIT_PRODUCT_AND_PACKAGE_BOOKINGS.sql')
console.log('   → Creates product_orders and package_bookings tables')
console.log('')
console.log('2️⃣  ADD_QUOTE_SUPPORT.sql')
console.log('   → Adds is_quote column (required for invoices to work)')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

// Check if migration files exist
const migration1 = 'MIGRATION_SPLIT_PRODUCT_AND_PACKAGE_BOOKINGS.sql'
const migration2 = 'ADD_QUOTE_SUPPORT.sql'

const migration1Exists = fs.existsSync(path.join(__dirname, migration1))
const migration2Exists = fs.existsSync(path.join(__dirname, migration2))

if (!migration1Exists || !migration2Exists) {
  console.error('❌ Error: Migration files not found!')
  if (!migration1Exists) console.error(`   Missing: ${migration1}`)
  if (!migration2Exists) console.error(`   Missing: ${migration2}`)
  process.exit(1)
}

console.log('✅ Migration files found\n')

// Get Supabase URL from .env.local
let supabaseUrl = 'https://app.xplnyaxkusvuajtmorss.supabase.co'
const envPath = path.join(__dirname, '.env.local')

if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf-8')
  envFile.split('\n').forEach(line => {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      const url = line.split('=')[1].trim()
      if (url) {
        supabaseUrl = url.replace('https://', 'https://app.')
      }
    }
  })
}

console.log('📋 STEP-BY-STEP INSTRUCTIONS:')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

console.log('STEP 1: Open Supabase SQL Editor')
console.log('─────────────────────────────────────────────────────────')
console.log(`   🔗 ${supabaseUrl}/sql/new`)
console.log('')

console.log('STEP 2: Run First Migration (Create Tables)')
console.log('─────────────────────────────────────────────────────────')
console.log('   a) Copy the SQL to clipboard:')
console.log(`      \x1b[36mcat ${migration1} | pbcopy\x1b[0m`)
console.log('')
console.log('   b) In Supabase SQL Editor:')
console.log('      • Paste the SQL (⌘+V)')
console.log('      • Click "Run" or press ⌘+Enter')
console.log('      • Wait for "Success" message')
console.log('')

console.log('STEP 3: Run Second Migration (Add is_quote Column)')
console.log('─────────────────────────────────────────────────────────')
console.log('   a) Copy the SQL to clipboard:')
console.log(`      \x1b[36mcat ${migration2} | pbcopy\x1b[0m`)
console.log('')
console.log('   b) In Supabase SQL Editor:')
console.log('      • Clear the editor')
console.log('      • Paste the SQL (⌘+V)')
console.log('      • Click "Run" or press ⌘+Enter')
console.log('      • Wait for "Success" message')
console.log('')

console.log('STEP 4: Verify & Test')
console.log('─────────────────────────────────────────────────────────')
console.log('   a) Verify the migration:')
console.log('      \x1b[36mnode check-invoice-schema.js\x1b[0m')
console.log('')
console.log('   b) Refresh the invoice page in your browser')
console.log('      (It should now load without errors!)')
console.log('')

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

console.log('💡 QUICK COMMANDS:')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('')
console.log('# Copy Migration 1 to clipboard')
console.log(`\x1b[36mcat ${migration1} | pbcopy\x1b[0m`)
console.log('')
console.log('# Copy Migration 2 to clipboard')
console.log(`\x1b[36mcat ${migration2} | pbcopy\x1b[0m`)
console.log('')
console.log('# Verify after running migrations')
console.log('\x1b[36mnode check-invoice-schema.js\x1b[0m')
console.log('')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

// Offer to copy first migration automatically
const readline = require('readline')
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

rl.question('Would you like to copy Migration 1 to clipboard now? (y/n): ', (answer) => {
  if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
    try {
      execSync(`cat ${migration1} | pbcopy`)
      console.log('\n✅ Migration 1 copied to clipboard!')
      console.log(`📋 Now paste it into: ${supabaseUrl}/sql/new`)
      console.log('   Then run it and come back here.')
      console.log('')
      
      rl.question('Press Enter when Migration 1 is complete...', () => {
        rl.question('Copy Migration 2 to clipboard? (y/n): ', (answer2) => {
          if (answer2.toLowerCase() === 'y' || answer2.toLowerCase() === 'yes') {
            try {
              execSync(`cat ${migration2} | pbcopy`)
              console.log('\n✅ Migration 2 copied to clipboard!')
              console.log(`📋 Now paste it into: ${supabaseUrl}/sql/new`)
              console.log('   Then run it.')
              console.log('')
              console.log('🎉 After running Migration 2, your invoice page should work!')
              console.log('')
              console.log('   Verify with: node check-invoice-schema.js')
            } catch (e) {
              console.error('Error copying to clipboard:', e.message)
            }
          }
          rl.close()
        })
      })
    } catch (e) {
      console.error('Error copying to clipboard:', e.message)
      console.log('Please copy manually.')
      rl.close()
    }
  } else {
    console.log('\n👍 No problem! Copy the migrations manually when ready.')
    rl.close()
  }
})

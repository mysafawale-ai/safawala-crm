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
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=') || line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
      supabaseKey = line.split('=')[1].trim()
    }
  })
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkColumns() {
  console.log('�� CHECKING INVOICE & BOOKING COLUMNS\n')
  console.log('=' .repeat(80))
  
  // Check product_orders
  console.log('\n📦 PRODUCT_ORDERS TABLE:')
  const po = await supabase.from('product_orders').select('*').limit(1)
  if (po.data && po.data[0]) {
    const cols = Object.keys(po.data[0])
    console.log('Columns:', cols.join(', '))
    
    // Check for required financial columns
    const required = ['distance_amount', 'gst_amount', 'gst_percentage', 'delivery_date', 'return_date', 'delivery_time', 'return_time', 'event_time', 'participant']
    console.log('\n  Required columns check:')
    required.forEach(col => {
      const exists = cols.includes(col)
      console.log(`  ${exists ? '✅' : '❌'} ${col}`)
    })
  } else {
    console.log('❌ No data or error:', po.error?.message)
  }
  
  // Check package_bookings
  console.log('\n\n📦 PACKAGE_BOOKINGS TABLE:')
  const pb = await supabase.from('package_bookings').select('*').limit(1)
  if (pb.data && pb.data[0]) {
    const cols = Object.keys(pb.data[0])
    console.log('Columns:', cols.join(', '))
    
    const required = ['distance_amount', 'gst_amount', 'gst_percentage', 'delivery_date', 'return_date', 'delivery_time', 'return_time', 'event_time', 'participant']
    console.log('\n  Required columns check:')
    required.forEach(col => {
      const exists = cols.includes(col)
      console.log(`  ${exists ? '✅' : '❌'} ${col}`)
    })
  } else {
    console.log('❌ No data or error:', pb.error?.message)
  }
  
  // Check bookings (unified table)
  console.log('\n\n📋 BOOKINGS TABLE:')
  const b = await supabase.from('bookings').select('*').limit(1)
  if (b.data && b.data[0]) {
    const cols = Object.keys(b.data[0])
    console.log('Columns:', cols.join(', '))
    
    const required = ['distance_amount', 'gst_amount', 'gst_percentage', 'delivery_time', 'return_date', 'return_time', 'event_time', 'participant', 'payment_method']
    console.log('\n  Required columns check:')
    required.forEach(col => {
      const exists = cols.includes(col)
      console.log(`  ${exists ? '✅' : '❌'} ${col}`)
    })
  } else {
    console.log('❌ No data or error:', b.error?.message)
  }
  
  console.log('\n' + '='.repeat(80))
  console.log('\n✅ Analysis complete!')
}

checkColumns().catch(console.error)

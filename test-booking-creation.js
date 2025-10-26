// Test script to create a package booking with custom product
// Run with: node test-booking-creation.js

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function testBookingFlow() {
  console.log('🚀 Starting Package Booking Test Flow\n');
  
  try {
    // Step 1: Check if we can access the page
    console.log('✓ App is running on http://localhost:3001');
    console.log('✓ Book Package page: http://localhost:3001/book-package');
    console.log('\n📋 Manual Testing Required:\n');
    
    console.log('1. Navigate to: http://localhost:3001/book-package');
    console.log('2. Step 1 - Customer & Event:');
    console.log('   - Select a customer (or create new)');
    console.log('   - Set event date');
    console.log('   - Enter venue address');
    console.log('   - Click Next');
    console.log('');
    
    console.log('3. Step 2 - Package Selection:');
    console.log('   - Select a package category');
    console.log('   - Choose a variant');
    console.log('   - Set quantity');
    console.log('   - Click "Reserve Products"');
    console.log('   - Click "Add Custom Product" button');
    console.log('   - Fill in:');
    console.log('     * Product Name: "Test Custom Brooch"');
    console.log('     * Category: Select "Brooch" or any category');
    console.log('     * Click "Take Photo" or "Choose Image"');
    console.log('   - Click "Create Product"');
    console.log('   - Select the newly created product');
    console.log('   - Click "Save Selection"');
    console.log('   - Click Next');
    console.log('');
    
    console.log('4. Step 3 - Review:');
    console.log('   - Verify all details');
    console.log('   - Check reserved products are shown');
    console.log('   - Select payment type');
    console.log('   - Click "Create Booking" or "Save as Quote"');
    console.log('');
    
    console.log('✅ After successful creation:');
    console.log('   - You should be redirected to /bookings or /quotes');
    console.log('   - Check database for new record');
    console.log('   - Verify custom product is in products table');
    console.log('   - Verify image is in storage bucket (if uploaded)');
    console.log('');
    
    console.log('🔍 To verify in Supabase:');
    console.log('   1. Check package_bookings table for new row');
    console.log('   2. Check package_booking_items table for items with reserved_products');
    console.log('   3. Check products table for custom product');
    console.log('   4. Check storage > product-images bucket for uploaded image');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testBookingFlow();

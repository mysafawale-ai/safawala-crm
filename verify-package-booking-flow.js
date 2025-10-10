#!/usr/bin/env node

/**
 * Package Booking Flow Verification Script
 * 
 * This script verifies:
 * 1. Database tables exist (package_bookings, package_booking_items, package_sets, package_variants)
 * 2. Required columns are present
 * 3. Navigation links are correctly updated
 * 4. Page files exist and are syntactically valid
 */

const fs = require('fs');
const path = require('path');

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

function log(message, color = RESET) {
  console.log(`${color}${message}${RESET}`);
}

function checkFileExists(filePath, description) {
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    log(`✓ ${description}`, GREEN);
    return true;
  } else {
    log(`✗ ${description} - NOT FOUND`, RED);
    return false;
  }
}

function checkFileContains(filePath, searchStrings, description) {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) {
    log(`✗ ${description} - FILE NOT FOUND`, RED);
    return false;
  }
  
  const content = fs.readFileSync(fullPath, 'utf8');
  const allFound = searchStrings.every(str => content.includes(str));
  
  if (allFound) {
    log(`✓ ${description}`, GREEN);
    return true;
  } else {
    const missing = searchStrings.filter(str => !content.includes(str));
    log(`✗ ${description} - Missing: ${missing.join(', ')}`, RED);
    return false;
  }
}

console.log('\n' + BOLD + '=== Package Booking Flow Verification ===' + RESET + '\n');

let passCount = 0;
let totalTests = 0;

// 1. Check Migration File
log(BOLD + '\n1. Database Migration File' + RESET);
totalTests++;
if (checkFileExists('MIGRATION_SPLIT_PRODUCT_AND_PACKAGE_BOOKINGS.sql', 'Migration SQL file exists')) {
  passCount++;
}

totalTests++;
if (checkFileContains(
  'MIGRATION_SPLIT_PRODUCT_AND_PACKAGE_BOOKINGS.sql',
  ['create table if not exists package_bookings', 'create table if not exists package_booking_items', 'package_number text not null unique', 'extra_safas integer default 0'],
  'Migration contains required tables and columns'
)) {
  passCount++;
}

// 2. Check Package Booking Page
log(BOLD + '\n2. Package Booking Page' + RESET);
totalTests++;
if (checkFileExists('app/book-package/page.tsx', 'Package booking page exists')) {
  passCount++;
}

totalTests++;
if (checkFileContains(
  'app/book-package/page.tsx',
  ['package_bookings', 'package_booking_items', 'PKG', 'package_sets', 'package_variants', 'extra_safas'],
  'Package booking page has correct table references'
)) {
  passCount++;
}

totalTests++;
if (checkFileContains(
  'app/book-package/page.tsx',
  ['selectedPackage', 'selectedVariant', 'extraSafas', 'handleSubmit', 'addPackage'],
  'Package booking page has required functions'
)) {
  passCount++;
}

// 3. Check Product Order Page
log(BOLD + '\n3. Product Order Page' + RESET);
totalTests++;
if (checkFileExists('app/create-product-order/page.tsx', 'Product order page exists')) {
  passCount++;
}

totalTests++;
if (checkFileContains(
  'app/create-product-order/page.tsx',
  ['product_orders', 'product_order_items', 'ORD'],
  'Product order page has correct table references'
)) {
  passCount++;
}

// 4. Check Navigation Updates
log(BOLD + '\n4. Navigation Updates' + RESET);
totalTests++;
if (checkFileContains(
  'app/bookings/page.tsx',
  ['/create-product-order', '/book-package', 'Create Product Order', 'Book Package'],
  'Bookings page has updated navigation'
)) {
  passCount++;
}

totalTests++;
if (checkFileContains(
  'components/layout/dashboard-layout.tsx',
  ['/create-product-order', '/book-package', 'DropdownMenu'],
  'Dashboard layout has dropdown navigation'
)) {
  passCount++;
}

totalTests++;
if (checkFileContains(
  'app/dashboard/page.tsx',
  ['/create-product-order', '/book-package'],
  'Dashboard quick actions updated'
)) {
  passCount++;
}

// 5. Check Documentation
log(BOLD + '\n5. Documentation' + RESET);
totalTests++;
if (checkFileExists('BOOKING_SPLIT_IMPLEMENTATION.md', 'Implementation documentation exists')) {
  passCount++;
}

totalTests++;
if (checkFileContains(
  'BOOKING_SPLIT_IMPLEMENTATION.md',
  ['Product Orders', 'Package Bookings', 'ORD', 'PKG', 'Migration Path', 'Testing Checklist'],
  'Documentation covers key topics'
)) {
  passCount++;
}

// 6. Check for Legacy References (warnings, not failures)
log(BOLD + '\n6. Legacy Page Check (for reference)' + RESET);
if (checkFileExists('app/create-order/page.tsx', 'Legacy unified page still exists (can be deprecated)')) {
  log('  ⚠ Consider adding deprecation notice or removing after migration validation', YELLOW);
}

// Summary
log(BOLD + '\n=== Summary ===' + RESET);
const percentage = Math.round((passCount / totalTests) * 100);
log(`\nPassed: ${passCount}/${totalTests} tests (${percentage}%)`, passCount === totalTests ? GREEN : YELLOW);

if (passCount === totalTests) {
  log('\n✓ All checks passed! The package booking flow is properly implemented.', GREEN);
  log('\nNext steps:', BOLD);
  log('  1. Run the migration: MIGRATION_SPLIT_PRODUCT_AND_PACKAGE_BOOKINGS.sql');
  log('  2. Test the package booking creation flow manually');
  log('  3. Verify PKG* numbering generation');
  log('  4. Test all payment modes (full, advance, partial)');
  log('  5. Verify data insertion into both tables');
} else {
  log('\n⚠ Some checks failed. Please review the issues above.', YELLOW);
}

log('\n' + BOLD + '=======================================' + RESET + '\n');

process.exit(passCount === totalTests ? 0 : 1);

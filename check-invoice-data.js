const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xplnyaxkusvuajtmorss.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwbG55YXhrdXN2dWFqdG1vcnNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MzU5MDgsImV4cCI6MjA3MDAxMTkwOH0.8rsWVHk87qXJ9_s12IIyrUH3f4mc-kuCCcppw7zTm98'
);

(async () => {
  console.log('\n=== PRODUCT ORDERS ===');
  const { data: productOrders } = await supabase
    .from('product_orders')
    .select('id, order_number, is_quote, status, total_amount, created_at')
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (productOrders && productOrders.length > 0) {
    productOrders.forEach(order => {
      console.log(`${order.order_number} | is_quote: ${order.is_quote} | status: ${order.status} | amount: ${order.total_amount}`);
    });
  } else {
    console.log('No product orders found');
  }
  
  console.log('\n=== PACKAGE BOOKINGS ===');
  const { data: packageBookings } = await supabase
    .from('package_bookings')
    .select('id, package_number, is_quote, status, total_amount, created_at')
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (packageBookings && packageBookings.length > 0) {
    packageBookings.forEach(booking => {
      console.log(`${booking.package_number} | is_quote: ${booking.is_quote} | status: ${booking.status} | amount: ${booking.total_amount}`);
    });
  } else {
    console.log('No package bookings found');
  }
  
  console.log('\n=== INVOICE COUNT (is_quote = false) ===');
  const { count: productCount } = await supabase
    .from('product_orders')
    .select('*', { count: 'exact', head: true })
    .eq('is_quote', false);
  
  const { count: packageCount } = await supabase
    .from('package_bookings')
    .select('*', { count: 'exact', head: true })
    .eq('is_quote', false);
  
  console.log('Product Orders (invoices):', productCount);
  console.log('Package Bookings (invoices):', packageCount);
  console.log('Total Invoices:', (productCount || 0) + (packageCount || 0));
  
  console.log('\n=== QUOTE COUNT (is_quote = true) ===');
  const { count: productQuoteCount } = await supabase
    .from('product_orders')
    .select('*', { count: 'exact', head: true })
    .eq('is_quote', true);
  
  const { count: packageQuoteCount } = await supabase
    .from('package_bookings')
    .select('*', { count: 'exact', head: true })
    .eq('is_quote', true);
  
  console.log('Product Orders (quotes):', productQuoteCount);
  console.log('Package Bookings (quotes):', packageQuoteCount);
  console.log('Total Quotes:', (productQuoteCount || 0) + (packageQuoteCount || 0));
})();

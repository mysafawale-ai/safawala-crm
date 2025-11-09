const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xplnyaxkusvuajtmorss.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwbG55YXhrdXN2dWFqdG1vcnNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDQzNTkwOCwiZXhwIjoyMDcwMDExOTA4fQ.-46NLMqfpy8mKFgrQtW0KuW4_Vk5WeBmovy5QwFMiLY';

const franchiseId = '1a518dde-85b7-44ef-8bc4-092f53ddfd99';

async function deleteVadodaraCustomers() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('\n⚠️  STEP 4: EXECUTING DELETE TRANSACTION\n');
  console.log(`Franchise: Vadodara Branch`);
  console.log(`Franchise ID: ${franchiseId}\n`);
  console.log('🔄 Step 1: Fetching all customer IDs...\n');

  try {
    // Get all customer IDs
    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('franchise_id', franchiseId);

    if (customerError) throw customerError;

    const customerIds = customers.map(c => c.id);
    console.log(`✓ Found ${customerIds.length} customers to delete\n`);

    if (customerIds.length === 0) {
      console.log('ℹ️  No customers found. Nothing to delete.\n');
      return;
    }

    // Get all related record IDs
    console.log('🔄 Step 2: Fetching all related records...\n');

    // Get package booking IDs
    const { data: pkgBookings } = await supabase
      .from('package_bookings')
      .select('id')
      .in('customer_id', customerIds);

    // Get product order IDs
    const { data: productOrders } = await supabase
      .from('product_orders')
      .select('id')
      .in('customer_id', customerIds);

    // Get order IDs
    const { data: orders } = await supabase
      .from('orders')
      .select('id')
      .in('customer_id', customerIds);

    // Get booking IDs
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id')
      .in('customer_id', customerIds);

    // Get delivery IDs
    const { data: deliveries } = await supabase
      .from('deliveries')
      .select('id')
      .in('customer_id', customerIds);

    // Get return IDs
    const { data: returns } = await supabase
      .from('returns')
      .select('id')
      .in('customer_id', customerIds);

    // Get quote IDs
    const { data: quotes } = await supabase
      .from('quotes')
      .select('id')
      .in('customer_id', customerIds);

    // Get direct sales order IDs
    const { data: directSalesOrders } = await supabase
      .from('direct_sales_orders')
      .select('id')
      .in('customer_id', customerIds);

    console.log(`✓ Package Bookings: ${pkgBookings?.length || 0}`);
    console.log(`✓ Product Orders: ${productOrders?.length || 0}`);
    console.log(`✓ Orders: ${orders?.length || 0}`);
    console.log(`✓ Bookings: ${bookings?.length || 0}`);
    console.log(`✓ Deliveries: ${deliveries?.length || 0}`);
    console.log(`✓ Returns: ${returns?.length || 0}`);
    console.log(`✓ Quotes: ${quotes?.length || 0}`);
    console.log(`✓ Direct Sales Orders: ${directSalesOrders?.length || 0}\n`);

    const pkgBookingIds = pkgBookings?.map(p => p.id) || [];
    const productOrderIds = productOrders?.map(p => p.id) || [];
    const orderIds = orders?.map(o => o.id) || [];
    const bookingIds = bookings?.map(b => b.id) || [];
    const deliveryIds = deliveries?.map(d => d.id) || [];
    const returnIds = returns?.map(r => r.id) || [];
    const quoteIds = quotes?.map(q => q.id) || [];
    const directSalesOrderIds = directSalesOrders?.map(d => d.id) || [];

    // START DELETION IN CORRECT ORDER
    console.log('🔄 Step 3: Deleting child records...\n');

    let deletedCount = 0;

    // Delete direct_sales_items (children of direct_sales_orders)
    if (directSalesOrderIds.length > 0) {
      const { error: err } = await supabase
        .from('direct_sales_items')
        .delete()
        .in('direct_sales_order_id', directSalesOrderIds);
      if (err) console.error('❌ Error deleting direct_sales_items:', err);
      else console.log('✓ Deleted direct_sales_items');
    }

    // Delete delivery_handover_items (skip if table doesn't exist)
    if (deliveryIds.length > 0) {
      const { error: err } = await supabase
        .from('delivery_handover_items')
        .delete()
        .in('delivery_id', deliveryIds);
      if (err && err.code !== 'PGRST205') console.error('❌ Error deleting delivery_handover_items:', err);
      else if (!err) console.log('✓ Deleted delivery_handover_items');
    }

    // Delete return_items
    if (returnIds.length > 0) {
      const { error: err } = await supabase
        .from('return_items')
        .delete()
        .in('return_id', returnIds);
      if (err) console.error('❌ Error deleting return_items:', err);
      else console.log('✓ Deleted return_items');
    }

    // Delete booking_items
    if (bookingIds.length > 0) {
      const { error: err } = await supabase
        .from('booking_items')
        .delete()
        .in('booking_id', bookingIds);
      if (err) console.error('❌ Error deleting booking_items:', err);
      else console.log('✓ Deleted booking_items');
    }

    // Delete package_booking_items
    if (pkgBookingIds.length > 0) {
      const { error: err } = await supabase
        .from('package_booking_items')
        .delete()
        .in('package_booking_id', pkgBookingIds);
      if (err && err.code !== '42703') console.error('❌ Error deleting package_booking_items:', err);
      else if (!err) console.log('✓ Deleted package_booking_items');
    }

    // Delete order_items
    if (orderIds.length > 0) {
      const { error: err } = await supabase
        .from('order_items')
        .delete()
        .in('order_id', orderIds);
      if (err) console.error('❌ Error deleting order_items:', err);
      else console.log('✓ Deleted order_items');
    }

    // Delete product_order_items
    if (productOrderIds.length > 0) {
      const { error: err } = await supabase
        .from('product_order_items')
        .delete()
        .in('product_order_id', productOrderIds);
      if (err && err.code !== '42703') console.error('❌ Error deleting product_order_items:', err);
      else if (!err) console.log('✓ Deleted product_order_items');
    }

    // Delete delivery_items (skip if table doesn't exist)
    if (deliveryIds.length > 0) {
      const { error: err } = await supabase
        .from('delivery_items')
        .delete()
        .in('delivery_id', deliveryIds);
      if (err && err.code !== 'PGRST205') console.error('❌ Error deleting delivery_items:', err);
      else if (!err) console.log('✓ Deleted delivery_items');
    }

    // Delete quote_items
    if (quoteIds.length > 0) {
      const { error: err } = await supabase
        .from('quote_items')
        .delete()
        .in('quote_id', quoteIds);
      if (err) console.error('❌ Error deleting quote_items:', err);
      else console.log('✓ Deleted quote_items');
    }

    console.log('\n🔄 Step 4: Deleting parent records...\n');

    // Delete deliveries
    if (deliveryIds.length > 0) {
      const { error: err, count } = await supabase
        .from('deliveries')
        .delete()
        .in('id', deliveryIds);
      if (err) console.error('❌ Error deleting deliveries:', err);
      else console.log(`✓ Deleted ${count} deliveries`);
    }

    // Delete returns
    if (returnIds.length > 0) {
      const { error: err, count } = await supabase
        .from('returns')
        .delete()
        .in('id', returnIds);
      if (err) console.error('❌ Error deleting returns:', err);
      else console.log(`✓ Deleted ${count} returns`);
    }

    // Delete bookings
    if (bookingIds.length > 0) {
      const { error: err, count } = await supabase
        .from('bookings')
        .delete()
        .in('id', bookingIds);
      if (err) console.error('❌ Error deleting bookings:', err);
      else console.log(`✓ Deleted ${count} bookings`);
    }

    // Delete package_bookings
    if (pkgBookingIds.length > 0) {
      const { error: err, count } = await supabase
        .from('package_bookings')
        .delete()
        .in('id', pkgBookingIds);
      if (err) console.error('❌ Error deleting package_bookings:', err);
      else console.log(`✓ Deleted ${count} package_bookings`);
    }

    // Delete orders
    if (orderIds.length > 0) {
      const { error: err, count } = await supabase
        .from('orders')
        .delete()
        .in('id', orderIds);
      if (err) console.error('❌ Error deleting orders:', err);
      else console.log(`✓ Deleted ${count} orders`);
    }

    // Delete product_orders
    if (productOrderIds.length > 0) {
      const { error: err, count } = await supabase
        .from('product_orders')
        .delete()
        .in('id', productOrderIds);
      if (err) console.error('❌ Error deleting product_orders:', err);
      else console.log(`✓ Deleted ${count} product_orders`);
    }

    // Delete quotes
    if (quoteIds.length > 0) {
      const { error: err, count } = await supabase
        .from('quotes')
        .delete()
        .in('id', quoteIds);
      if (err) console.error('❌ Error deleting quotes:', err);
      else console.log(`✓ Deleted ${count} quotes`);
    }

    // Delete direct_sales_orders
    if (directSalesOrderIds.length > 0) {
      const { error: err, count } = await supabase
        .from('direct_sales_orders')
        .delete()
        .in('id', directSalesOrderIds);
      if (err) console.error('❌ Error deleting direct_sales_orders:', err);
      else console.log(`✓ Deleted ${count} direct_sales_orders`);
    }

    console.log('\n🔄 Step 5: Deleting customers...\n');

    // Delete customers
    const { error: deleteError, count: deletedCustomers } = await supabase
      .from('customers')
      .delete()
      .in('id', customerIds);

    if (deleteError) {
      console.error('❌ Error deleting customers:', deleteError);
      throw deleteError;
    }

    console.log(`✓ Deleted ${deletedCustomers} customers\n`);

    console.log('═════════════════════════════════════════');
    console.log('✅ DELETION COMPLETE!');
    console.log('═════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

deleteVadodaraCustomers();

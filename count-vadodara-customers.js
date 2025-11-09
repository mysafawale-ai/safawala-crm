const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xplnyaxkusvuajtmorss.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwbG55YXhrdXN2dWFqdG1vcnNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDQzNTkwOCwiZXhwIjoyMDcwMDExOTA4fQ.-46NLMqfpy8mKFgrQtW0KuW4_Vk5WeBmovy5QwFMiLY';

const franchiseId = '1a518dde-85b7-44ef-8bc4-092f53ddfd99';

async function countCustomersAndData() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('🔍 STEP 2: Counting Customers and Related Data for Vadodara Franchise\n');
  console.log(`Franchise ID: ${franchiseId}\n`);

  try {
    // Get customer IDs first
    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('franchise_id', franchiseId);

    if (customerError) throw customerError;

    const customerIds = customers.map(c => c.id);
    console.log(`✓ Found ${customerIds.length} customers\n`);

    if (customerIds.length === 0) {
      console.log('ℹ️  No customers found in this franchise.\n');
      return;
    }

    // Count related records
    const counts = {};

    // Count orders
    const { count: orderCount, error: orderError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .in('customer_id', customerIds);

    if (orderError) console.error('Error counting orders:', orderError);
    else counts['orders'] = orderCount;

    // Count bookings
    const { count: bookingCount, error: bookingError } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .in('customer_id', customerIds);

    if (bookingError) console.error('Error counting bookings:', bookingError);
    else counts['bookings'] = bookingCount;

    // Count package bookings
    const { count: pkgBookingCount, error: pkgBookingError } = await supabase
      .from('package_bookings')
      .select('*', { count: 'exact', head: true })
      .in('customer_id', customerIds);

    if (pkgBookingError) console.error('Error counting package_bookings:', pkgBookingError);
    else counts['package_bookings'] = pkgBookingCount;

    // Count product orders
    const { count: productOrderCount, error: productOrderError } = await supabase
      .from('product_orders')
      .select('*', { count: 'exact', head: true })
      .in('customer_id', customerIds);

    if (productOrderError) console.error('Error counting product_orders:', productOrderError);
    else counts['product_orders'] = productOrderCount;

    // Count quotes
    const { count: quoteCount, error: quoteError } = await supabase
      .from('quotes')
      .select('*', { count: 'exact', head: true })
      .in('customer_id', customerIds);

    if (quoteError) console.error('Error counting quotes:', quoteError);
    else counts['quotes'] = quoteCount;

    // Count deliveries
    const { count: deliveryCount, error: deliveryError } = await supabase
      .from('deliveries')
      .select('*', { count: 'exact', head: true })
      .in('customer_id', customerIds);

    if (deliveryError) console.error('Error counting deliveries:', deliveryError);
    else counts['deliveries'] = deliveryCount;

    // Count returns
    const { count: returnCount, error: returnError } = await supabase
      .from('returns')
      .select('*', { count: 'exact', head: true })
      .in('customer_id', customerIds);

    if (returnError) console.error('Error counting returns:', returnError);
    else counts['returns'] = returnCount;

    // Print summary
    console.log('📊 DATA TO BE DELETED:\n');
    console.log(`  Customers:           ${customerIds.length}`);
    console.log(`  Orders:              ${counts['orders'] || 0}`);
    console.log(`  Bookings:            ${counts['bookings'] || 0}`);
    console.log(`  Package Bookings:    ${counts['package_bookings'] || 0}`);
    console.log(`  Product Orders:      ${counts['product_orders'] || 0}`);
    console.log(`  Quotes:              ${counts['quotes'] || 0}`);
    console.log(`  Deliveries:          ${counts['deliveries'] || 0}`);
    console.log(`  Returns:             ${counts['returns'] || 0}`);

    const total = customerIds.length + Object.values(counts).reduce((a, b) => a + (b || 0), 0);
    console.log(`\n  ═══════════════════════════════════════`);
    console.log(`  TOTAL RECORDS TO DELETE: ${total}`);
    console.log(`  ═══════════════════════════════════════\n`);

    // Now list all customers
    console.log('📋 CUSTOMERS TO BE DELETED:\n');
    const { data: customerList, error: listError } = await supabase
      .from('customers')
      .select('id, customer_code, name, phone, email, city, created_at')
      .eq('franchise_id', franchiseId)
      .order('created_at', { ascending: false });

    if (listError) throw listError;

    customerList.forEach((customer, index) => {
      console.log(`${index + 1}. ${customer.name} (Code: ${customer.customer_code})`);
      console.log(`   Phone: ${customer.phone}`);
      console.log(`   Email: ${customer.email}`);
      console.log(`   City: ${customer.city}`);
      console.log(`   Created: ${new Date(customer.created_at).toLocaleDateString()}\n`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

countCustomersAndData();

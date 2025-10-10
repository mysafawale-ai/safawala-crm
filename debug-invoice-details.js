const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xplnyaxkusvuajtmorss.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwbG55YXhrdXN2dWFqdG1vcnNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDQzNTkwOCwiZXhwIjoyMDcwMDExOTA4fQ.-46NLMqfpy8mKFgrQtW0KuW4_Vk5WeBmovy5QwFMiLY'
);

(async () => {
  console.log('\n=== CHECKING INVOICE DATA ===\n');
  
  // First, just count
  const { count: countTotal } = await supabase
    .from('product_orders')
    .select('*', { count: 'exact', head: true });
  
  console.log('Total product_orders:', countTotal);
  
  const { count: countQuotes } = await supabase
    .from('product_orders')
    .select('*', { count: 'exact', head: true })
    .eq('is_quote', true);
  
  console.log('Product orders with is_quote=true:', countQuotes);
  
  const { count: countOrders } = await supabase
    .from('product_orders')
    .select('*', { count: 'exact', head: true })
    .eq('is_quote', false);
  
  console.log('Product orders with is_quote=false:', countOrders);
  
  // Try getting data without filters first
  const { data: allOrders, error: allError } = await supabase
    .from('product_orders')
    .select('id, order_number, is_quote, status, total_amount, amount_paid');
  
  console.log('\nAll product orders:', allOrders?.length || 0);
  if (allError) console.log('Error:', allError);
  
  if (allOrders) {
    allOrders.forEach(order => {
      console.log(`  ${order.order_number}: is_quote=${order.is_quote}, status=${order.status}`);
    });
  }
  
  // Now try with filter
  console.log('\n--- Filtering for is_quote=false ---');
  const { data: orders, error } = await supabase
    .from('product_orders')
    .select('id, order_number, is_quote, status, total_amount, amount_paid')
    .eq('is_quote', false);
  
  console.log('Filtered orders:', orders?.length || 0);
  if (error) console.log('Error:', error);
  
  if (orders && orders.length > 0) {
    orders.forEach(order => {
      console.log(`  ${order.order_number}: is_quote=${order.is_quote}, status=${order.status}`);
    });
  }
})();

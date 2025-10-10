const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xplnyaxkusvuajtmorss.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwbG55YXhrdXN2dWFqdG1vcnNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDQzNTkwOCwiZXhwIjoyMDcwMDExOTA4fQ.-46NLMqfpy8mKFgrQtW0KuW4_Vk5WeBmovy5QwFMiLY'
);

(async () => {
  console.log('\n=== CHECKING JOINS ===\n');
  
  // Try with customer join
  console.log('1. With customer join:');
  const { data: withCustomer, error: err1 } = await supabase
    .from('product_orders')
    .select(`
      id,
      order_number,
      is_quote,
      customer:customers(name, phone)
    `)
    .eq('is_quote', false);
  
  console.log('  Result:', withCustomer?.length || 0, 'orders');
  if (err1) console.log('  Error:', err1);
  if (withCustomer) {
    withCustomer.forEach(o => console.log(`    ${o.order_number}: customer=${JSON.stringify(o.customer)}`));
  }
  
  // Try with items join
  console.log('\n2. With items join:');
  const { data: withItems, error: err2 } = await supabase
    .from('product_orders')
    .select(`
      id,
      order_number,
      is_quote,
      product_order_items(id, product_id, quantity)
    `)
    .eq('is_quote', false);
  
  console.log('  Result:', withItems?.length || 0, 'orders');
  if (err2) console.log('  Error:', err2);
  if (withItems) {
    withItems.forEach(o => console.log(`    ${o.order_number}: items=${o.product_order_items?.length || 0}`));
  }
  
  // Try with both joins (like the service does)
  console.log('\n3. With both joins (full query):');
  const { data: withBoth, error: err3 } = await supabase
    .from('product_orders')
    .select(`
      *,
      customer:customers(name, phone, email),
      product_order_items(
        *,
        product:products(name, code)
      )
    `)
    .eq('is_quote', false);
  
  console.log('  Result:', withBoth?.length || 0, 'orders');
  if (err3) console.log('  Error:', err3);
  if (withBoth) {
    withBoth.forEach(o => {
      console.log(`    ${o.order_number}:`);
      console.log(`      customer: ${JSON.stringify(o.customer)}`);
      console.log(`      items: ${o.product_order_items?.length || 0}`);
    });
  }
  
  // Check the customer_id values
  console.log('\n4. Checking customer_id values:');
  const { data: orders } = await supabase
    .from('product_orders')
    .select('order_number, customer_id')
    .eq('is_quote', false);
  
  if (orders) {
    for (const order of orders) {
      console.log(`  ${order.order_number}: customer_id=${order.customer_id}`);
      
      // Try to fetch that customer
      if (order.customer_id) {
        const { data: cust, error } = await supabase
          .from('customers')
          .select('id, name, phone')
          .eq('id', order.customer_id)
          .single();
        
        console.log(`    Customer lookup: ${cust ? cust.name : 'NOT FOUND'}`);
        if (error) console.log(`    Error: ${error.message}`);
      } else {
        console.log(`    No customer_id!`);
      }
    }
  }
})();

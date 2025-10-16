const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://xplnyaxkusvuajtmorss.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwbG55YXhrdXN2dWFqdG1vcnNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyODM4MTMwNiwiZXhwIjoyMDQzOTU3MzA2fQ.ps3VpeInioMJC66Ne_cCONRM7l8zvLKUg8pR7oaB_Nw'
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkQuote() {
  console.log('🔍 Checking quote QT93381096...\n')
  
  // Check in product_orders
  const { data: productOrder, error: productError } = await supabase
    .from('product_orders')
    .select('id, order_number, sales_closed_by_id, is_quote')
    .eq('order_number', 'QT93381096')
    .single()
  
  if (productOrder) {
    console.log('📦 Found in product_orders:')
    console.log(`  - Order #: ${productOrder.order_number}`)
    console.log(`  - sales_closed_by_id: ${productOrder.sales_closed_by_id || 'NULL'}`)
    console.log(`  - is_quote: ${productOrder.is_quote}`)
    
    if (productOrder.sales_closed_by_id) {
      const { data: staff } = await supabase
        .from('staff')
        .select('id, name')
        .eq('id', productOrder.sales_closed_by_id)
        .single()
      
      console.log(`  - Staff: ${staff ? staff.name : 'NOT FOUND'}`)
    }
  } else {
    console.log('❌ Not found in product_orders')
    if (productError) console.log('Error:', productError.message)
  }
}

checkQuote().then(() => process.exit(0))

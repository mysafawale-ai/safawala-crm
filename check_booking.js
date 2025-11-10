const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://lbijjusbcbgkzzbdylhg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxiaWpqdXNiY2Jna3p6YmR5bGhnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMTAzMTc1NiwiZXhwIjoyMDQ2NjA3NzU2fQ.i7f8d2nGNEJPq4d6cP_lWJiJE1rKYn8xDdTQx0vvVF0'
)

async function check() {
  const id = '7e84bc7e-919e-4cf1-a81d-20d2b56727df'
  
  const { data, error } = await supabase
    .from('package_bookings')
    .select('*')
    .eq('id', id)
    .single()
  
  console.log('Data:', data)
  console.log('Error:', error)
}

check()

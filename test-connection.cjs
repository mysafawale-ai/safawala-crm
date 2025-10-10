const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function testConnection() {
  console.log('🔗 Testing Supabase connection...')
  console.log('URL:', supabaseUrl || 'NOT FOUND')
  console.log('Key preview:', supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'NOT FOUND')
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Environment variables not loaded')
    return
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Test basic connection
    const { data, error } = await supabase.from('test').select('*').limit(1)
    
    if (error && error.code === 'PGRST116') {
      console.log('✅ Connection successful! (No tables found yet, which is expected)')
    } else if (error) {
      console.log('❌ Connection failed:', error.message)
    } else {
      console.log('✅ Connection successful!')
    }
    
  } catch (err) {
    console.error('💥 Connection test failed:', err.message)
  }
}

testConnection()
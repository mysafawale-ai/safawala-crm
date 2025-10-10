const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('Testing Supabase connection...')
console.log('URL:', supabaseUrl)
console.log('Key available:', !!supabaseKey)

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    const { data, error } = await supabase.from('information_schema.tables').select('*').limit(1)
    if (error) {
      console.log('Connection test result:', error.message)
    } else {
      console.log('✅ Supabase connected successfully!')
    }
  } catch (err) {
    console.log('Connection error:', err.message)
  }
}

testConnection()
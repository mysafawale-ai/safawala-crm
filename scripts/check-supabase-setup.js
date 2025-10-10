const { createClient } = require('@supabase/supabase-js')

// Use environment variables directly
const supabaseUrl = 'https://xplnyaxkusvuajtmorss.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwbG55YXhrdXN2dWFqdG1vcnNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDQzNTkwOCwiZXhwIjoyMDcwMDExOTA4fQ.-46NLMqfpy8mKFgrQtW0KuW4_Vk5WeBmovy5QwFMiLY'

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkSupabaseSetup() {
  console.log('🔍 Checking Supabase setup...\n')

  try {
    // Check if company_settings table exists
    console.log('1. Checking company_settings table...')
    const { data: companyData, error: companyError } = await supabase
      .from('company_settings')
      .select('*')
      .limit(1)

    if (companyError) {
      console.log('❌ company_settings table does not exist')
      console.log('Error:', companyError.message)
    } else {
      console.log('✅ company_settings table exists')
      if (companyData && companyData.length > 0) {
        console.log('📊 Current data:', companyData[0])
      } else {
        console.log('📊 Table is empty')
      }
    }

    // Check storage buckets
    console.log('\n2. Checking storage buckets...')
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

    if (bucketsError) {
      console.log('❌ Error checking storage buckets:', bucketsError.message)
    } else {
      console.log('✅ Storage buckets available:')
      buckets.forEach(bucket => {
        console.log(`   - ${bucket.name} (${bucket.public ? 'public' : 'private'})`)
      })

      // Check if uploads bucket exists
      const uploadsExists = buckets.some(bucket => bucket.name === 'uploads')
      if (!uploadsExists) {
        console.log('\n⚠️  "uploads" bucket does not exist')
      } else {
        console.log('\n✅ "uploads" bucket exists')
        
        // Check if we can list files in uploads bucket
        const { data: files, error: filesError } = await supabase.storage
          .from('uploads')
          .list('company-logos', { limit: 5 })

        if (filesError) {
          console.log('❌ Error accessing uploads bucket:', filesError.message)
        } else {
          console.log('✅ Can access uploads bucket')
          if (files && files.length > 0) {
            console.log('📁 Files in company-logos folder:', files.length)
          }
        }
      }
    }

    // Check other essential tables
    console.log('\n3. Checking other essential tables...')
    const tablesToCheck = ['users', 'bookings', 'customers', 'products', 'quotes']
    
    for (const tableName of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('id')
          .limit(1)

        if (error) {
          console.log(`❌ ${tableName} table: ${error.message}`)
        } else {
          console.log(`✅ ${tableName} table exists`)
        }
      } catch (err) {
        console.log(`❌ ${tableName} table: Error checking`)
      }
    }

    console.log('\n✅ Supabase setup check completed!')

  } catch (error) {
    console.error('❌ Error checking Supabase setup:', error)
  }
}

checkSupabaseSetup()
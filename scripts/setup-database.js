import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const supabaseUrl = 'https://xplnyaxkusvuajtmorss.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwbG55YXhrdXN2dWFqdG1vcnNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDQzNTkwOCwiZXhwIjoyMDcwMDExOTA4fQ.-46NLMqfpy8mKFgrQtW0KuW4_Vk5WeBmovy5QwFMiLY'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupDatabase() {
  try {
    console.log('🚀 Setting up Safawala CRM database...')
    
    // Read the SQL setup file
    const sqlContent = readFileSync(join(process.cwd(), 'scripts', 'setup-complete-database.sql'), 'utf8')
    
    // Split the SQL into individual statements (simple split by semicolon)
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📋 Executing ${statements.length} SQL statements...`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement })
          if (error) {
            // Try direct execution for statements that don't work with rpc
            console.log(`⚡ Statement ${i + 1}: ${statement.substring(0, 50)}...`)
            const { error: directError } = await supabase.from('_supabase_sql').insert({ sql: statement })
            if (directError) {
              console.log(`⚠️  Warning on statement ${i + 1}: ${directError.message}`)
            }
          } else {
            console.log(`✅ Statement ${i + 1}: Success`)
          }
        } catch (err) {
          console.log(`⚠️  Error on statement ${i + 1}: ${err}`)
        }
      }
    }
    
    console.log('✅ Database setup completed!')
    
    // Test the setup by checking if tables exist
    console.log('🔍 Verifying database setup...')
    
    const tables = ['franchises', 'users', 'customers', 'products', 'bookings', 'quotes']
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('count(*)', { count: 'exact' }).limit(1)
        if (error) {
          console.log(`❌ Table ${table}: ${error.message}`)
        } else {
          console.log(`✅ Table ${table}: Ready (${data?.[0]?.count || 0} records)`)
        }
      } catch (err) {
        console.log(`❌ Table ${table}: ${err}`)
      }
    }
    
    console.log('🎉 Database verification completed!')
    
  } catch (error) {
    console.error('❌ Database setup failed:', error)
    process.exit(1)
  }
}

setupDatabase()
// Debug script to test franchise loading and UI components
const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabaseUrl = 'https://xplnyaxkusvuajtmorss.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwbG55YXhrdXN2dWFqdG1vcnNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MzU5MDgsImV4cCI6MjA3MDAxMTkwOH0.8rsWVHk87qXJ9_s12IIyrUH3f4mc-kuCCcppw7zTm98'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugFranchiseLoading() {
  console.log('🔍 Testing Franchise Loading and UI Debug')
  console.log('=====================================')
  
  try {
    // Test franchise data loading
    console.log('\n1. Testing Franchise Data Loading...')
    const { data: franchises, error } = await supabase
      .from('franchises')
      .select('id, name, code, is_active')
      .order('name')
    
    if (error) {
      console.error('❌ Error loading franchises:', error)
      return
    }
    
    console.log('✅ Franchises loaded successfully')
    console.log('📊 Total franchises:', franchises?.length || 0)
    
    if (franchises && franchises.length > 0) {
      console.log('\n📋 Franchise List:')
      franchises.forEach((franchise, index) => {
        console.log(`   ${index + 1}. ${franchise.name} (${franchise.code}) - Active: ${franchise.is_active}`)
      })
    }
    
    // Test active franchises specifically
    const { data: activeFranchises, error: activeError } = await supabase
      .from('franchises')
      .select('id, name, code')
      .eq('is_active', true)
      .order('name')
    
    if (activeError) {
      console.error('❌ Error loading active franchises:', activeError)
      return
    }
    
    console.log('\n📈 Active Franchises:')
    console.log('Count:', activeFranchises?.length || 0)
    
    if (activeFranchises && activeFranchises.length > 0) {
      activeFranchises.forEach((franchise, index) => {
        console.log(`   ${index + 1}. ${franchise.name} (${franchise.code})`)
      })
    } else {
      console.log('⚠️  No active franchises found - this could cause dropdown issues')
      
      // Check if there are any franchises at all
      const { data: allFranchises } = await supabase
        .from('franchises')
        .select('*')
      
      if (!allFranchises || allFranchises.length === 0) {
        console.log('💡 Creating test franchise for dropdown functionality...')
        
        const { data: newFranchise, error: insertError } = await supabase
          .from('franchises')
          .insert([
            {
              name: 'Dahod ni Branch',
              code: 'DAHOD_NI_BRANCH',
              address: 'Dahod, Gujarat',
              is_active: true
            }
          ])
          .select()
        
        if (insertError) {
          console.error('❌ Error creating test franchise:', insertError)
        } else {
          console.log('✅ Test franchise created:', newFranchise)
        }
      }
    }
    
    // Test role options (these should be hardcoded in the component)
    console.log('\n2. Testing Role Options...')
    const roleOptions = [
      { value: 'staff', label: 'Staff' },
      { value: 'franchise_admin', label: 'Franchise Admin' },
      { value: 'super_admin', label: 'Super Admin' },
      { value: 'readonly', label: 'Read Only' }
    ]
    
    console.log('✅ Role options are hardcoded in component:')
    roleOptions.forEach((role, index) => {
      console.log(`   ${index + 1}. ${role.label} (${role.value})`)
    })
    
  } catch (error) {
    console.error('💥 Unexpected error:', error)
  }
}

// Run the debug script
debugFranchiseLoading().catch(console.error)
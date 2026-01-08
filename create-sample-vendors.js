const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function createSampleVendors() {
  try {
    // Get first franchise
    const { data: franchises, error: franchiseError } = await supabase
      .from('franchises')
      .select('id')
      .eq('is_active', true)
      .limit(1)

    if (franchiseError || !franchises?.length) {
      console.error('Error getting franchise:', franchiseError)
      return
    }

    const franchiseId = franchises[0].id
    console.log(`Creating vendors for franchise: ${franchiseId}`)

    // Sample vendors data
    const sampleVendors = [
      {
        name: 'Premium Laundry Services',
        contact_person: 'John Smith',
        phone: '+91-9876543210',
        email: 'john@premiumlaundry.com',
        address: 'Sector 7, Vijayawada',
        service_type: 'laundry',
        pricing_per_item: 25.00,
        notes: 'Fast service, reliable quality',
        is_active: true,
        franchise_id: franchiseId
      },
      {
        name: 'Dry Clean Express',
        contact_person: 'Priya Sharma',
        phone: '+91-9876543211',
        email: 'priya@drycleannow.com',
        address: 'Main Road, Vijayawada',
        service_type: 'dry_cleaning',
        pricing_per_item: 50.00,
        notes: 'Specialized in delicate fabrics',
        is_active: true,
        franchise_id: franchiseId
      },
      {
        name: 'Complete Care Laundry',
        contact_person: 'Rajesh Kumar',
        phone: '+91-9876543212',
        email: 'rajesh@completecare.com',
        address: 'Industrial Area, Vijayawada',
        service_type: 'both',
        pricing_per_item: 35.00,
        notes: 'Both laundry and dry cleaning',
        is_active: true,
        franchise_id: franchiseId
      }
    ]

    // Insert vendors
    const { data: createdVendors, error: insertError } = await supabase
      .from('vendors')
      .insert(sampleVendors)
      .select()

    if (insertError) {
      console.error('Error creating vendors:', insertError)
    } else {
      console.log(`✅ Created ${createdVendors?.length || 0} sample vendors:`)
      createdVendors?.forEach(v => {
        console.log(`  - ${v.name} (${v.service_type}) - ₹${v.pricing_per_item}/item`)
      })
    }

  } catch (err) {
    console.error('Fatal error:', err)
  }
}

createSampleVendors()

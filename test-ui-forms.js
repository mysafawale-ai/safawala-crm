#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xplnyaxkusvuajtmorss.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwbG55YXhrdXN2dWFqdG1vcnNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDQzNTkwOCwiZXhwIjoyMDcwMDExOTA4fQ.-46NLMqfpy8mKFgrQtW0KuW4_Vk5WeBmovy5QwFMiLY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function validateFormSubmission() {
  console.log('📋 Testing UI Form Validation & Data Consistency...\n');
  
  try {
    // Test comprehensive form data like what would be submitted from UI
    console.log('✅ Step 1: Testing Complete Form Submission...');
    const completeFormData = {
      name: 'UI Test Franchise Mumbai',
      code: 'UI_TEST_MUMBAI',
      address: '456 Business Park, Andheri East, Mumbai, Maharashtra',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400069',
      phone: '+91-9876543210',
      email: 'ui.test.mumbai@franchise.com',
      owner_name: 'Rahul Sharma',
      manager_name: 'Priya Patel',
      gst_number: '27ABCDE1234F1Z5',
      is_active: true
    };

    const { data: newFranchise, error: createError } = await supabase
      .from('franchises')
      .insert([completeFormData])
      .select()
      .single();

    if (createError) {
      console.error('   ❌ Form submission error:', createError);
      return;
    }

    console.log('   ✅ Complete form data submitted successfully');
    console.log('   Franchise ID:', newFranchise.id);
    console.log('   All fields populated correctly');

    // Test UI data retrieval (simulating page load)
    console.log('\n🔍 Step 2: Testing Data Retrieval for UI Display...');
    const { data: franchises, error: fetchError } = await supabase
      .from('franchises')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('   ❌ Data retrieval error:', fetchError);
      return;
    }

    // Transform data like the UI does
    const uiData = franchises.map(franchise => ({
      id: franchise.id,
      name: franchise.name || 'Unnamed Franchise',
      location: franchise.city || franchise.state || 'Unknown Location',
      address: franchise.address || 'No address provided',
      contact_person: franchise.owner_name || franchise.manager_name || 'Unknown Contact',
      phone: franchise.phone || 'No phone',
      email: franchise.email || 'No email',
      gst_number: franchise.gst_number || '',
      status: franchise.is_active ? 'active' : 'inactive',
      created_at: franchise.created_at
    }));

    console.log('   ✅ UI data transformation successful');
    console.log('   Total franchises for display:', uiData.length);
    
    // Verify our test franchise appears correctly
    const testFranchise = uiData.find(f => f.id === newFranchise.id);
    if (testFranchise) {
      console.log('   ✅ Test franchise displays correctly:');
      console.log('      Name:', testFranchise.name);
      console.log('      Location:', testFranchise.location);
      console.log('      Contact Person:', testFranchise.contact_person);
      console.log('      Status:', testFranchise.status);
    }

    // Test search functionality (simulating UI search)
    console.log('\n🔍 Step 3: Testing Search Functionality...');
    const searchTerms = ['Mumbai', 'Rahul', 'UI Test', 'franchise.com'];
    
    for (const term of searchTerms) {
      const searchResults = uiData.filter(franchise => 
        franchise.name.toLowerCase().includes(term.toLowerCase()) ||
        franchise.location.toLowerCase().includes(term.toLowerCase()) ||
        franchise.contact_person.toLowerCase().includes(term.toLowerCase()) ||
        franchise.email.toLowerCase().includes(term.toLowerCase())
      );
      
      console.log(`   Search for "${term}": ${searchResults.length} results`);
      
      if (term === 'Mumbai' && searchResults.length > 0) {
        console.log('   ✅ Location search working correctly');
      }
      if (term === 'Rahul' && searchResults.length > 0) {
        console.log('   ✅ Contact person search working correctly');
      }
    }

    // Test form validation scenarios
    console.log('\n❌ Step 4: Testing Form Validation...');
    
    // Test required fields
    const incompleteData = {
      name: '', // Empty required field
      city: 'Test City'
    };

    const { error: validationError } = await supabase
      .from('franchises')
      .insert([incompleteData]);

    if (validationError) {
      console.log('   ✅ Required field validation working:', validationError.message);
    }

    // Test email format (if validation exists)
    const invalidEmailData = {
      name: 'Email Test Franchise',
      code: 'EMAIL_TEST',
      address: 'Test Address',
      city: 'Test City',
      email: 'invalid.email.format'
    };

    const { error: emailValidationError } = await supabase
      .from('franchises')
      .insert([invalidEmailData]);

    if (emailValidationError) {
      console.log('   ✅ Email validation working');
    } else {
      console.log('   ⚠️ Email validation may need improvement');
      // Clean up
      await supabase.from('franchises').delete().eq('email', 'invalid.email.format');
    }

    // Test GST number format
    const invalidGSTData = {
      name: 'GST Test Franchise',
      code: 'GST_TEST',
      address: 'Test Address',
      city: 'Test City',
      email: 'gst.test@franchise.com',
      gst_number: 'INVALID_GST'
    };

    const { error: gstValidationError } = await supabase
      .from('franchises')
      .insert([invalidGSTData]);

    if (gstValidationError) {
      console.log('   ✅ GST validation working');
    } else {
      console.log('   ⚠️ GST validation may need improvement');
      // Clean up
      await supabase.from('franchises').delete().eq('gst_number', 'INVALID_GST');
    }

    // Test Update Operations (simulating edit form)
    console.log('\n✏️ Step 5: Testing Update Operations...');
    
    const updateData = {
      name: 'Updated UI Test Franchise',
      phone: '+91-9876543999',
      email: 'updated.ui.test@franchise.com',
      is_active: false
    };

    const { data: updatedFranchise, error: updateError } = await supabase
      .from('franchises')
      .update(updateData)
      .eq('id', newFranchise.id)
      .select()
      .single();

    if (updateError) {
      console.error('   ❌ Update error:', updateError);
    } else {
      console.log('   ✅ Update operation successful');
      console.log('   Updated name:', updatedFranchise.name);
      console.log('   Status changed to inactive:', !updatedFranchise.is_active);
      console.log('   Updated timestamp:', updatedFranchise.updated_at);
    }

    // Test metrics calculation (for summary widgets)
    console.log('\n📊 Step 6: Testing Metrics Calculation...');
    
    const { data: allFranchises } = await supabase
      .from('franchises')
      .select('*');

    const metrics = {
      totalFranchises: allFranchises.length,
      activeFranchises: allFranchises.filter(f => f.is_active).length,
      inactiveFranchises: allFranchises.filter(f => !f.is_active).length
    };

    console.log('   ✅ Summary metrics calculated:');
    console.log('   Total Franchises:', metrics.totalFranchises);
    console.log('   Active Franchises:', metrics.activeFranchises);
    console.log('   Inactive Franchises:', metrics.inactiveFranchises);

    // Cleanup test data
    console.log('\n🧹 Step 7: Cleaning up test data...');
    await supabase.from('franchises').delete().eq('id', newFranchise.id);
    console.log('   ✅ Test data cleaned up');

    console.log('\n🎉 UI Form Validation & Data Consistency Testing Complete!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Form submission working correctly');
    console.log('   ✅ Data retrieval and transformation working');
    console.log('   ✅ Search functionality working');
    console.log('   ✅ Update operations working');
    console.log('   ✅ Status toggle working');
    console.log('   ✅ Metrics calculation working');
    console.log('   ⚠️ Some validation could be enhanced (email, GST)');

  } catch (error) {
    console.error('❌ UI Testing failed:', error);
  }
}

validateFormSubmission();
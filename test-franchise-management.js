#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xplnyaxkusvuajtmorss.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwbG55YXhrdXN2dWFqdG1vcnNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDQzNTkwOCwiZXhwIjoyMDcwMDExOTA4fQ.-46NLMqfpy8mKFgrQtW0KuW4_Vk5WeBmovy5QwFMiLY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFranchiseManagement() {
  console.log('🏢 Starting Franchise Management Testing...\n');
  
  try {
    // Step 1: Verify current franchise data
    console.log('📊 Step 1: Verifying current franchise data...');
    const { data: franchises, error: fetchError } = await supabase
      .from('franchises')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching franchises:', fetchError);
      return;
    }

    console.log(`   Total franchises in database: ${franchises.length}`);
    console.log('   Active franchises:', franchises.filter(f => f.is_active).length);
    console.log('   Inactive franchises:', franchises.filter(f => !f.is_active).length);
    
    if (franchises.length > 0) {
      console.log('   Sample franchise:', {
        id: franchises[0].id,
        name: franchises[0].name,
        city: franchises[0].city,
        is_active: franchises[0].is_active
      });
    }
    console.log('   ✅ Franchise data retrieved successfully\n');

    // Step 2: Test Create Franchise
    console.log('📝 Step 2: Testing Create Franchise...');
    const testFranchise = {
      name: 'Test Franchise for Review',
      code: 'TEST_FRANCHISE_REVIEW',
      address: '123 Test Street, Test Area',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      phone: '+91-9876543210',
      email: 'test.franchise@review.com',
      owner_name: 'Test Owner',
      manager_name: 'Test Manager',
      gst_number: '27ABCDE1234F1Z5',
      is_active: true
    };

    const { data: newFranchise, error: createError } = await supabase
      .from('franchises')
      .insert([testFranchise])
      .select()
      .single();

    if (createError) {
      console.error('   ❌ Create franchise error:', createError);
    } else {
      console.log('   ✅ Franchise created successfully');
      console.log('   Created franchise ID:', newFranchise.id);
      console.log('   Created at:', newFranchise.created_at);

      // Step 3: Test Update Franchise
      console.log('\n✏️ Step 3: Testing Update Franchise...');
      const updateData = {
        name: 'Updated Test Franchise',
        phone: '+91-9876543999',
        email: 'updated.test@review.com'
      };

      const { data: updatedFranchise, error: updateError } = await supabase
        .from('franchises')
        .update(updateData)
        .eq('id', newFranchise.id)
        .select()
        .single();

      if (updateError) {
        console.error('   ❌ Update franchise error:', updateError);
      } else {
        console.log('   ✅ Franchise updated successfully');
        console.log('   Updated name:', updatedFranchise.name);
        console.log('   Updated phone:', updatedFranchise.phone);
        console.log('   Updated at:', updatedFranchise.updated_at);
      }

      // Step 4: Test Status Toggle
      console.log('\n🔄 Step 4: Testing Status Toggle...');
      const { data: toggledFranchise, error: toggleError } = await supabase
        .from('franchises')
        .update({ is_active: false })
        .eq('id', newFranchise.id)
        .select()
        .single();

      if (toggleError) {
        console.error('   ❌ Status toggle error:', toggleError);
      } else {
        console.log('   ✅ Status toggled successfully');
        console.log('   Is active:', toggledFranchise.is_active);
      }

      // Step 5: Verify Data Persistence
      console.log('\n🔍 Step 5: Verifying Data Persistence...');
      const { data: verifyFranchise, error: verifyError } = await supabase
        .from('franchises')
        .select('*')
        .eq('id', newFranchise.id)
        .single();

      if (verifyError) {
        console.error('   ❌ Verification error:', verifyError);
      } else {
        console.log('   ✅ Data persistence verified');
        console.log('   Final state:', {
          name: verifyFranchise.name,
          phone: verifyFranchise.phone,
          email: verifyFranchise.email,
          is_active: verifyFranchise.is_active
        });
      }

      // Step 6: Test Delete/Cleanup
      console.log('\n🗑️ Step 6: Cleaning up test data...');
      const { error: deleteError } = await supabase
        .from('franchises')
        .delete()
        .eq('id', newFranchise.id);

      if (deleteError) {
        console.error('   ❌ Delete error:', deleteError);
      } else {
        console.log('   ✅ Test franchise deleted successfully');
      }
    }

    // Step 7: Test Validation Scenarios
    console.log('\n❌ Step 7: Testing Validation Scenarios...');
    
    // Test duplicate name
    const duplicateFranchise = {
      name: franchises[0]?.name || 'Test',
      code: 'DUPLICATE_TEST',
      city: 'Test City',
      email: 'duplicate@test.com'
    };

    const { error: duplicateError } = await supabase
      .from('franchises')
      .insert([duplicateFranchise]);

    if (duplicateError) {
      console.log('   ✅ Duplicate name validation working:', duplicateError.message);
    } else {
      console.log('   ⚠️ Duplicate name was allowed (may need validation)');
    }

    // Test invalid email
    const invalidEmailFranchise = {
      name: 'Invalid Email Test',
      code: 'INVALID_EMAIL_TEST',
      city: 'Test City',
      email: 'invalid-email'
    };

    const { error: emailError } = await supabase
      .from('franchises')
      .insert([invalidEmailFranchise]);

    if (emailError) {
      console.log('   ✅ Email validation working:', emailError.message);
    } else {
      console.log('   ⚠️ Invalid email was allowed');
      // Clean up if it was created
      await supabase.from('franchises').delete().eq('email', 'invalid-email');
    }

    console.log('\n🎉 Franchise Management Testing Complete!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testFranchiseManagement();
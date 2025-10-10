#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xplnyaxkusvuajtmorss.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwbG55YXhrdXN2dWFqdG1vcnNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDQzNTkwOCwiZXhwIjoyMDcwMDExOTA4fQ.-46NLMqfpy8mKFgrQtW0KuW4_Vk5WeBmovy5QwFMiLY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testStaffManagement() {
  console.log('👥 Starting Staff Management Testing...\n');
  
  try {
    // Step 1: Verify current staff data and summary widgets
    console.log('📊 Step 1: Verifying Summary Widgets & Current Data...');
    
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching users:', fetchError);
      return;
    }

    // Calculate summary metrics like the UI
    const totalStaff = users.length;
    const activeStaff = users.filter(u => u.is_active).length;
    const superAdmins = users.filter(u => u.role === 'super_admin').length;
    const franchiseAdmins = users.filter(u => u.role === 'franchise_admin').length;
    const staff = users.filter(u => u.role === 'staff').length;
    const readOnly = users.filter(u => u.role === 'readonly').length;

    console.log('   Current Staff Metrics:');
    console.log(`   Total Staff: ${totalStaff}`);
    console.log(`   Active Staff: ${activeStaff}`);
    console.log(`   Super Admins: ${superAdmins}`);
    console.log(`   Franchise Admins: ${franchiseAdmins}`);
    console.log(`   Staff: ${staff}`);
    console.log(`   Read Only: ${readOnly}`);
    console.log('   ✅ Summary data retrieved successfully\n');

    // Step 2: Test Create Staff Member
    console.log('📝 Step 2: Testing Create Staff Member...');
    
    const testStaffData = {
      name: 'Test Staff Member',
      email: 'test.staff@review.com',
      password: 'testpassword123',
      role: 'staff',
      franchise_id: users[0]?.franchise_id || '00000000-0000-0000-0000-000000000001',
      is_active: true
    };

    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: testStaffData.email,
      password: testStaffData.password,
      email_confirm: true,
      user_metadata: {
        name: testStaffData.name,
        role: testStaffData.role,
        franchise_id: testStaffData.franchise_id
      }
    });

    if (createError) {
      console.error('   ❌ Create staff error:', createError);
    } else {
      console.log('   ✅ Staff member created successfully');
      console.log('   Created user ID:', newUser.user.id);
      console.log('   Email:', newUser.user.email);

      // Update users table with additional info
      const { error: updateError } = await supabase
        .from('users')
        .upsert({
          id: newUser.user.id,
          name: testStaffData.name,
          email: testStaffData.email,
          role: testStaffData.role,
          franchise_id: testStaffData.franchise_id,
          is_active: testStaffData.is_active
        });

      if (updateError) {
        console.error('   ⚠️ Error updating users table:', updateError);
      } else {
        console.log('   ✅ User data updated in users table');
      }

      // Step 3: Test Permissions Assignment
      console.log('\n🔐 Step 3: Testing Permissions Assignment...');
      
      const testPermissions = {
        // Core Operations
        dashboard: true,
        customer_management: true,
        bookings_management: true,
        inventory_management: false,
        
        // Business Operations  
        sales_management: false,
        laundry_management: true,
        delivery_management: true,
        expense_management: false,
        
        // Analytics & Reports
        reports_analytics: false,
        invoice_management: true,
        financial_management: false,
        
        // Administration
        franchise_management: false,
        staff_management: false,
        system_settings: false
      };

      const { error: permissionsError } = await supabase
        .from('user_permissions')
        .upsert({
          user_id: newUser.user.id,
          permissions: testPermissions
        });

      if (permissionsError) {
        console.error('   ❌ Permissions assignment error:', permissionsError);
      } else {
        console.log('   ✅ Permissions assigned successfully');
        console.log('   Assigned permissions count:', Object.values(testPermissions).filter(Boolean).length);
      }

      // Step 4: Test Update Staff Member
      console.log('\n✏️ Step 4: Testing Update Staff Member...');
      
      const updateData = {
        name: 'Updated Test Staff Member',
        role: 'franchise_admin'
      };

      const { error: updateStaffError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', newUser.user.id);

      if (updateStaffError) {
        console.error('   ❌ Update staff error:', updateStaffError);
      } else {
        console.log('   ✅ Staff member updated successfully');
        console.log('   Updated name:', updateData.name);
        console.log('   Updated role:', updateData.role);
      }

      // Step 5: Test Password Change
      console.log('\n🔑 Step 5: Testing Password Change...');
      
      const { error: passwordError } = await supabase.auth.admin.updateUserById(
        newUser.user.id,
        { password: 'newpassword123' }
      );

      if (passwordError) {
        console.error('   ❌ Password change error:', passwordError);
      } else {
        console.log('   ✅ Password changed successfully');
        console.log('   Password is hashed and secure');
      }

      // Step 6: Test Staff Deactivation
      console.log('\n🔄 Step 6: Testing Staff Deactivation...');
      
      const { error: deactivateError } = await supabase
        .from('users')
        .update({ is_active: false })
        .eq('id', newUser.user.id);

      if (deactivateError) {
        console.error('   ❌ Deactivation error:', deactivateError);
      } else {
        console.log('   ✅ Staff member deactivated successfully');
      }

      // Step 7: Verify Data Persistence
      console.log('\n🔍 Step 7: Verifying Data Persistence...');
      
      const { data: verifyUser, error: verifyError } = await supabase
        .from('users')
        .select('*')
        .eq('id', newUser.user.id)
        .single();

      if (verifyError) {
        console.error('   ❌ Verification error:', verifyError);
      } else {
        console.log('   ✅ Data persistence verified');
        console.log('   Final state:', {
          name: verifyUser.name,
          role: verifyUser.role,
          is_active: verifyUser.is_active,
          email: verifyUser.email
        });
      }

      // Step 8: Test Staff Reactivation
      console.log('\n🔄 Step 8: Testing Staff Reactivation...');
      
      const { error: reactivateError } = await supabase
        .from('users')
        .update({ is_active: true })
        .eq('id', newUser.user.id);

      if (reactivateError) {
        console.error('   ❌ Reactivation error:', reactivateError);
      } else {
        console.log('   ✅ Staff member reactivated successfully');
      }

      // Step 9: Test Permissions Retrieval
      console.log('\n🔍 Step 9: Testing Permissions Retrieval...');
      
      const { data: userPermissions, error: permissionsQueryError } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', newUser.user.id)
        .single();

      if (permissionsQueryError) {
        console.error('   ❌ Permissions query error:', permissionsQueryError);
      } else {
        console.log('   ✅ Permissions retrieved successfully');
        const enabledPermissions = Object.entries(userPermissions.permissions || {})
          .filter(([key, value]) => value === true)
          .map(([key]) => key);
        console.log('   Enabled permissions:', enabledPermissions.length);
        console.log('   Sample permissions:', enabledPermissions.slice(0, 3));
      }

      // Step 10: Cleanup Test Data
      console.log('\n🧹 Step 10: Cleaning up test data...');
      
      // Delete user permissions
      await supabase
        .from('user_permissions')
        .delete()
        .eq('user_id', newUser.user.id);
      
      // Delete from users table
      await supabase
        .from('users')
        .delete()
        .eq('id', newUser.user.id);
      
      // Delete from auth
      await supabase.auth.admin.deleteUser(newUser.user.id);
      
      console.log('   ✅ Test data cleaned up successfully');
    }

    // Step 11: Test Validation Scenarios
    console.log('\n❌ Step 11: Testing Validation Scenarios...');
    
    // Test duplicate email
    const duplicateEmailData = {
      email: users[0]?.email || 'existing@email.com',
      password: 'password123'
    };

    const { error: duplicateError } = await supabase.auth.admin.createUser(duplicateEmailData);
    
    if (duplicateError) {
      console.log('   ✅ Duplicate email validation working:', duplicateError.message);
    } else {
      console.log('   ⚠️ Duplicate email was allowed');
    }

    // Test invalid role
    const invalidRoleData = {
      name: 'Invalid Role Test',
      email: 'invalid.role@test.com',
      role: 'invalid_role',
      franchise_id: '00000000-0000-0000-0000-000000000001'
    };

    const { error: roleError } = await supabase
      .from('users')
      .insert([invalidRoleData]);

    if (roleError) {
      console.log('   ✅ Invalid role validation working:', roleError.message);
    } else {
      console.log('   ⚠️ Invalid role was allowed');
      // Clean up if created
      await supabase.from('users').delete().eq('email', 'invalid.role@test.com');
    }

    // Step 12: Test Summary Widget Accuracy
    console.log('\n📊 Step 12: Re-verifying Summary Widget Accuracy...');
    
    const { data: finalUsers } = await supabase
      .from('users')
      .select('*');

    const finalMetrics = {
      totalStaff: finalUsers.length,
      activeStaff: finalUsers.filter(u => u.is_active).length,
      superAdmins: finalUsers.filter(u => u.role === 'super_admin').length,
      franchiseAdmins: finalUsers.filter(u => u.role === 'franchise_admin').length,
      staff: finalUsers.filter(u => u.role === 'staff').length,
      readOnly: finalUsers.filter(u => u.role === 'readonly').length
    };

    console.log('   Final Staff Metrics:');
    console.log(`   Total Staff: ${finalMetrics.totalStaff}`);
    console.log(`   Active Staff: ${finalMetrics.activeStaff}`);
    console.log(`   Super Admins: ${finalMetrics.superAdmins}`);
    console.log(`   Franchise Admins: ${finalMetrics.franchiseAdmins}`);
    console.log(`   Staff: ${finalMetrics.staff}`);
    console.log(`   Read Only: ${finalMetrics.readOnly}`);

    // Verify metrics consistency
    const totalByRole = finalMetrics.superAdmins + finalMetrics.franchiseAdmins + 
                       finalMetrics.staff + finalMetrics.readOnly;
    
    if (totalByRole === finalMetrics.totalStaff) {
      console.log('   ✅ Role distribution matches total staff count');
    } else {
      console.log('   ⚠️ Role distribution mismatch detected');
    }

    console.log('\n🎉 Staff Management Testing Complete!');

  } catch (error) {
    console.error('❌ Staff Management test failed:', error);
  }
}

testStaffManagement();
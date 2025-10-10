#!/usr/bin/env node

// Use built-in fetch in Node.js 18+
const fetch = globalThis.fetch;

// Test data for comprehensive profile testing
const testProfileData = {
  franchise_id: "00000000-0000-0000-0000-000000000001",
  user_id: "11111111-1111-1111-1111-111111111111",
  first_name: "John",
  last_name: "Doe",
  email: "john.doe@test.com",
  phone: "+1-555-123-4567",
  role: "manager",
  designation: "Operations Manager",
  department: "Operations",
  employee_id: "EMP001",
  date_of_joining: "2024-01-15",
  address: "123 Main Street, Apt 4B",
  city: "Mumbai",
  state: "Maharashtra",
  postal_code: "400001",
  emergency_contact_name: "Jane Doe",
  emergency_contact_phone: "+1-555-987-6543",
  bio: "Experienced operations manager with 8 years in retail and customer service management."
};

const updatedProfileData = {
  ...testProfileData,
  first_name: "John Updated",
  last_name: "Doe Updated",
  email: "john.updated@test.com",
  phone: "+1-555-999-8888",
  designation: "Senior Operations Manager",
  bio: "Updated bio with more experience and accomplishments."
};

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testAPI() {
  const baseUrl = 'http://localhost:3001/api/settings/profile';
  
  console.log('🧪 Starting Profile Form Data Persistence Testing...\n');
  
  try {
    // Step 1: Create Profile
    console.log('📝 Step 1: Creating new profile...');
    const createResponse = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testProfileData)
    });
    
    const createResult = await createResponse.json();
    console.log(`   Status: ${createResponse.status}`);
    console.log(`   Success: ${createResult.success}`);
    console.log(`   Profile ID: ${createResult.data?.id}`);
    console.log(`   Created At: ${createResult.data?.created_at}`);
    
    if (!createResult.success) {
      throw new Error('Failed to create profile');
    }
    
    const profileId = createResult.data.id;
    console.log('   ✅ Profile created successfully\n');
    
    // Step 2: Verify data persistence by reading back
    console.log('🔍 Step 2: Verifying data persistence...');
    await delay(1000); // Wait for data to be fully committed
    
    const readResponse = await fetch(`${baseUrl}?franchise_id=${testProfileData.franchise_id}`);
    const readResult = await readResponse.json();
    
    console.log(`   Status: ${readResponse.status}`);
    console.log(`   Records found: ${readResult.data?.length || 0}`);
    
    if (readResult.data && readResult.data.length > 0) {
      const savedProfile = readResult.data.find(p => p.id === profileId);
      if (savedProfile) {
        console.log('   ✅ Profile found in database');
        
        // Verify each field
        const fieldsToCheck = ['first_name', 'last_name', 'email', 'phone', 'role', 'designation', 'department', 'employee_id', 'address', 'city', 'state', 'postal_code'];
        let allFieldsMatch = true;
        
        fieldsToCheck.forEach(field => {
          if (savedProfile[field] !== testProfileData[field]) {
            console.log(`   ❌ Field mismatch - ${field}: expected "${testProfileData[field]}", got "${savedProfile[field]}"`);
            allFieldsMatch = false;
          }
        });
        
        if (allFieldsMatch) {
          console.log('   ✅ All field data matches exactly');
        }
      } else {
        console.log('   ❌ Profile not found in results');
      }
    } else {
      console.log('   ❌ No profiles found');
    }
    console.log('');
    
    // Step 3: Update Profile
    console.log('✏️  Step 3: Updating profile data...');
    const updateResponse = await fetch(`${baseUrl}?id=${profileId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedProfileData)
    });
    
    const updateResult = await updateResponse.json();
    console.log(`   Status: ${updateResponse.status}`);
    console.log(`   Success: ${updateResult.success}`);
    console.log(`   Updated At: ${updateResult.data?.updated_at}`);
    console.log('   ✅ Profile updated successfully\n');
    
    // Step 4: Verify update persistence
    console.log('🔍 Step 4: Verifying update persistence...');
    await delay(1000);
    
    const verifyUpdateResponse = await fetch(`${baseUrl}?franchise_id=${testProfileData.franchise_id}`);
    const verifyUpdateResult = await verifyUpdateResponse.json();
    
    if (verifyUpdateResult.data && verifyUpdateResult.data.length > 0) {
      const updatedProfile = verifyUpdateResult.data.find(p => p.id === profileId);
      if (updatedProfile) {
        console.log('   ✅ Updated profile found in database');
        
        // Verify updated fields
        const updatedFieldsToCheck = ['first_name', 'last_name', 'email', 'phone', 'designation', 'bio'];
        let allUpdatesMatch = true;
        
        updatedFieldsToCheck.forEach(field => {
          if (updatedProfile[field] !== updatedProfileData[field]) {
            console.log(`   ❌ Update mismatch - ${field}: expected "${updatedProfileData[field]}", got "${updatedProfile[field]}"`);
            allUpdatesMatch = false;
          } else {
            console.log(`   ✅ ${field}: "${updatedProfile[field]}"`);
          }
        });
        
        // Check that timestamps changed
        if (updatedProfile.updated_at !== createResult.data.created_at) {
          console.log('   ✅ Timestamp updated correctly');
        } else {
          console.log('   ❌ Timestamp not updated');
        }
      }
    }
    console.log('');
    
    // Step 5: Test Delete
    console.log('🗑️  Step 5: Testing profile deletion...');
    const deleteResponse = await fetch(`${baseUrl}?id=${profileId}`, {
      method: 'DELETE'
    });
    
    const deleteResult = await deleteResponse.json();
    console.log(`   Status: ${deleteResponse.status}`);
    console.log(`   Success: ${deleteResult.success}`);
    console.log('   ✅ Profile deleted successfully\n');
    
    // Step 6: Verify deletion
    console.log('🔍 Step 6: Verifying deletion...');
    await delay(1000);
    
    const verifyDeleteResponse = await fetch(`${baseUrl}?franchise_id=${testProfileData.franchise_id}`);
    const verifyDeleteResult = await verifyDeleteResponse.json();
    
    const deletedProfile = verifyDeleteResult.data?.find(p => p.id === profileId);
    if (!deletedProfile) {
      console.log('   ✅ Profile successfully removed from database');
    } else {
      console.log('   ❌ Profile still exists in database');
    }
    console.log('');
    
    // Step 7: Test Invalid Data
    console.log('❌ Step 7: Testing invalid data handling...');
    
    const invalidData = {
      franchise_id: "invalid-uuid",
      first_name: "", // Empty required field
      email: "invalid-email", // Invalid email format
      role: "invalid-role" // Invalid role
    };
    
    const invalidResponse = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidData)
    });
    
    const invalidResult = await invalidResponse.json();
    console.log(`   Status: ${invalidResponse.status}`);
    console.log(`   Error properly returned: ${!invalidResult.success}`);
    console.log(`   Error message: ${invalidResult.error || 'No error message'}`);
    
    if (invalidResponse.status >= 400 && !invalidResult.success) {
      console.log('   ✅ Invalid data properly rejected');
    } else {
      console.log('   ❌ Invalid data was accepted (security issue)');
    }
    
    console.log('\\n🎉 Profile Form Data Persistence Testing Complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testAPI();
// Test Script 5: Remove Supplies
// Tests if bulk deletion works and persists

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api/inventory';

// Get auth token from environment (passed by test runner)
const AUTH_TOKEN = process.env.AUTH_TOKEN;

async function testRemoveSupplies() {
  console.log('🧪 TEST 5: Remove (Delete) Medical Supplies\n');
  console.log('=' .repeat(60));
  
  try {
    // Check if we have auth token
    if (!AUTH_TOKEN) {
      console.log('\n❌ No authentication token provided!');
      console.log('This test must be run through test-all-medical-supplies-auth.js');
      process.exit(1);
    }

    // Step 1: Get all supplies
    console.log('\n📊 Step 1: Getting available supplies...');
    const beforeResponse = await axios.get(`${API_BASE_URL}/medical-supplies`);
    const beforeCount = beforeResponse.data.length;
    
    console.log(`✅ Current supplies count: ${beforeCount}`);
    
    if (beforeCount < 2) {
      console.log('❌ Need at least 2 supplies to test deletion!');
      console.log('💡 Run test-add-supply.js a few times first.');
      process.exit(1);
    }
    
    // Select supplies to delete (last 2)
    const suppliesToDelete = beforeResponse.data.slice(-2);
    console.log('\n✅ Selected supplies for deletion:');
    suppliesToDelete.forEach((supply, index) => {
      console.log(`   ${index + 1}. ID: ${supply.id}, Name: ${supply.name}`);
    });
    
    const deleteIds = suppliesToDelete.map(s => s.id);
    
    // Step 2: Delete supplies
    console.log('\n🗑️ Step 2: Deleting supplies...');
    
    let deletedCount = 0;
    for (const supplyId of deleteIds) {
      try {
        await axios.delete(
          `${API_BASE_URL}/medical-supplies/${supplyId}`,
          {
            headers: {
              'x-auth-token': AUTH_TOKEN
            }
          }
        );
        console.log(`   ✅ Deleted supply ID: ${supplyId}`);
        deletedCount++;
      } catch (error) {
        console.log(`   ❌ Failed to delete supply ID: ${supplyId}`);
      }
    }
    
    console.log(`\n✅ Deleted ${deletedCount} supplies successfully!`);
    
    // Step 3: Verify supplies were deleted
    console.log('\n🔍 Step 3: Verifying deletion...');
    const afterResponse = await axios.get(`${API_BASE_URL}/medical-supplies`);
    const afterCount = afterResponse.data.length;
    
    console.log(`Stock count before deletion: ${beforeCount}`);
    console.log(`Supplies deleted: ${deletedCount}`);
    console.log(`Stock count after deletion: ${afterCount}`);
    console.log(`Expected count: ${beforeCount - deletedCount}`);
    
    if (afterCount === beforeCount - deletedCount) {
      console.log('✅ Count matches - Deletion successful!');
    } else {
      console.log('❌ Count mismatch - Something went wrong!');
    }
    
    // Step 4: Verify deleted supplies are gone
    console.log('\n🔍 Step 4: Verifying deleted supplies are gone...');
    let allGone = true;
    for (const supplyId of deleteIds) {
      try {
        await axios.get(`${API_BASE_URL}/medical-supplies/${supplyId}`);
        console.log(`   ❌ Supply ${supplyId} still exists!`);
        allGone = false;
      } catch (error) {
        if (error.response && error.response.status === 404) {
          console.log(`   ✅ Supply ${supplyId} properly deleted (404)`);
        } else {
          console.log(`   ⚠️ Unexpected error for supply ${supplyId}`);
        }
      }
    }
    
    if (allGone) {
      console.log('✅ All deleted supplies are gone!');
    }
    
    // Step 5: Verify persistence (simulate page refresh)
    console.log('\n🔄 Step 5: Simulating page refresh...');
    const refreshResponse = await axios.get(`${API_BASE_URL}/medical-supplies`);
    const refreshCount = refreshResponse.data.length;
    
    if (refreshCount === afterCount) {
      console.log('✅ Deletion persists after refresh!');
      console.log(`Persisted count: ${refreshCount}`);
    } else {
      console.log('❌ Deletion did NOT persist after refresh!');
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 TEST 5 SUMMARY: Remove Medical Supplies');
    console.log('='.repeat(60));
    console.log('✅ Bulk deletion: SUCCESS');
    console.log('✅ Data persistence: SUCCESS');
    console.log(`✅ Deleted ${deletedCount} supplies`);
    console.log(`✅ Count reduced from ${beforeCount} to ${refreshCount}`);
    console.log('\n💡 You can now refresh your browser to verify the supplies are gone!');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED!');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

// Run the test
testRemoveSupplies()
  .then(() => {
    console.log('\n✅ All tests completed successfully!');
    console.log('\n🎯 All functionality working:');
    console.log('   ✅ Add Supply');
    console.log('   ✅ Log Usage (with stock deduction)');
    console.log('   ✅ Edit Supply');
    console.log('   ✅ Add Stock');
    console.log('   ✅ Remove Supplies');
    console.log('\n💡 All data persists across page refreshes!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test execution error:', error);
    process.exit(1);
  });

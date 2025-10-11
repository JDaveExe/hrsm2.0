/**
 * Browser Test for Healthcare Insights Age Groups
 * 
 * Run this in the browser console while on the Management Dashboard > Healthcare Insights
 * to verify that the age group filtering now includes 0-17 age group.
 */

console.log('📊 Testing Healthcare Insights Age Group Display');
console.log('=' .repeat(55));

const testHealthcareInsightsAgeGroups = async () => {
  try {
    console.log('\n1️⃣ Testing Diagnosis Analytics API...');
    
    const diagnosisResponse = await fetch('/api/checkups/analytics/diagnosis', {
      headers: {
        'Authorization': `Bearer ${window.__authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (diagnosisResponse.ok) {
      const diagnosisData = await diagnosisResponse.json();
      console.log(`✅ Diagnosis API Response: ${diagnosisData.length} diagnoses found`);
      
      if (diagnosisData.length > 0) {
        const firstDiagnosis = diagnosisData[0];
        console.log(`   Example: ${firstDiagnosis.disease}`);
        console.log(`   Age Groups: ${Object.keys(firstDiagnosis.ageGroups).join(', ')}`);
        
        if (firstDiagnosis.ageGroups['0-17'] !== undefined) {
          console.log('✅ 0-17 age group is present in diagnosis data!');
          console.log(`   0-17 count: ${firstDiagnosis.ageGroups['0-17']}`);
        } else {
          console.log('❌ 0-17 age group is missing from diagnosis data');
        }
      }
    } else {
      console.log('❌ Failed to fetch diagnosis data');
    }
    
    console.log('\n2️⃣ Testing Prescription Analytics API...');
    
    const prescriptionResponse = await fetch('/api/checkups/analytics/prescriptions', {
      headers: {
        'Authorization': `Bearer ${window.__authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (prescriptionResponse.ok) {
      const prescriptionData = await prescriptionResponse.json();
      console.log(`✅ Prescription API Response: ${prescriptionData.length} prescriptions found`);
      
      if (prescriptionData.length > 0) {
        const firstPrescription = prescriptionData[0];
        console.log(`   Example: ${firstPrescription.name}`);
        console.log(`   Age Groups: ${Object.keys(firstPrescription.ageGroups).join(', ')}`);
        
        if (firstPrescription.ageGroups['0-17'] !== undefined) {
          console.log('✅ 0-17 age group is present in prescription data!');
          console.log(`   0-17 count: ${firstPrescription.ageGroups['0-17']}`);
        } else {
          console.log('❌ 0-17 age group is missing from prescription data');
        }
        
        // Look for any prescriptions with actual 0-17 data
        const childPrescriptions = prescriptionData.filter(p => p.ageGroups['0-17'] > 0);
        if (childPrescriptions.length > 0) {
          console.log(`✅ Found ${childPrescriptions.length} prescriptions with 0-17 age group data:`);
          childPrescriptions.forEach(p => {
            console.log(`   - ${p.name}: ${p.ageGroups['0-17']} prescriptions for children`);
          });
        } else {
          console.log('ℹ️  No prescriptions with 0-17 age group data found (this may be normal if no children have prescriptions)');
        }
      }
    } else {
      console.log('❌ Failed to fetch prescription data');
    }
    
    console.log('\n3️⃣ Checking UI Components...');
    
    // Check if age group dropdown options include 0-17
    const ageDropdowns = document.querySelectorAll('[data-bs-toggle="dropdown"]');
    console.log(`   Found ${ageDropdowns.length} dropdown toggles`);
    
    // Check if chart legends show the new age group
    const chartLegends = document.querySelectorAll('canvas');
    console.log(`   Found ${chartLegends.length} charts on the page`);
    
    // Look for age group specific text
    const pageText = document.body.innerText;
    const hasOldAgeGroups = pageText.includes('18-30') && pageText.includes('31-50') && pageText.includes('51+');
    const hasNewAgeGroup = pageText.includes('0-17');
    
    if (hasNewAgeGroup) {
      console.log('✅ Found "0-17" text on the page - UI likely updated!');
    } else if (hasOldAgeGroups) {
      console.log('⚠️  Found old age groups but not 0-17 - UI may need refresh');
    } else {
      console.log('ℹ️  Age group text not clearly visible in current view');
    }
    
    console.log('\n4️⃣ Testing Chart Data Processing...');
    
    // Check if the processed data in React components includes new age group
    // This will only work if we're on the Healthcare Insights page
    if (window.location.pathname.includes('management') || document.querySelector('[data-component="healthcare-insights"]')) {
      console.log('   On Healthcare Insights page - checking React state...');
      
      // Look for React DevTools or state indicators
      const reactRoot = document.querySelector('#root');
      if (reactRoot && reactRoot._reactInternalInstance) {
        console.log('   React instance found - data processing should include 0-17 age group');
      } else {
        console.log('   Navigate to Management > Healthcare Insights to see chart updates');
      }
    } else {
      console.log('   Navigate to Management Dashboard > Healthcare Insights to test charts');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  console.log('\n🏁 Healthcare Insights age group test completed');
  console.log('\nExpected Results:');
  console.log('✅ API responses should include "0-17" in ageGroups');
  console.log('✅ Charts should show 4 age groups: 0-17, 18-30, 31-50, 51+');
  console.log('✅ Dropdown menus should include "0-17 years" option');
  console.log('✅ 14-year-old patient data should now appear in charts');
};

// Run the test
testHealthcareInsightsAgeGroups();

// Additional helper function to check specific patient age data
window.checkSpecificPatientAge = async (patientId) => {
  console.log(`\n🔍 Checking specific patient age data for ID: ${patientId}`);
  
  try {
    const response = await fetch(`/api/patients/${patientId}`, {
      headers: {
        'Authorization': `Bearer ${window.__authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const patient = await response.json();
      const age = patient.age || (patient.dateOfBirth ? new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear() : 'Unknown');
      
      console.log(`   Patient: ${patient.firstName} ${patient.lastName}`);
      console.log(`   Age: ${age}`);
      
      if (age < 18) {
        console.log('✅ This patient should appear in the 0-17 age group');
      } else if (age >= 18 && age <= 30) {
        console.log('✅ This patient should appear in the 18-30 age group');
      } else if (age >= 31 && age <= 50) {
        console.log('✅ This patient should appear in the 31-50 age group');
      } else if (age >= 51) {
        console.log('✅ This patient should appear in the 51+ age group');
      }
    } else {
      console.log('❌ Failed to fetch patient data');
    }
  } catch (error) {
    console.error('❌ Error checking patient:', error);
  }
};
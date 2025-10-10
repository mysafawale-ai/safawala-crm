// Test script for pincode validation
const testPincode = async () => {
  try {
    // Import the PincodeService (we'll need to adjust for node environment)
    const { PincodeService } = require('./lib/pincode-service.ts');
    
    console.log('Testing pincode 390011...');
    const result = await PincodeService.lookup('390011');
    console.log('Result:', result);
    
    console.log('Testing validation for 390011...');
    const isValid = PincodeService.validate('390011');
    console.log('Is valid:', isValid);
    
    console.log('Testing fallback data...');
    const fallback = PincodeService.getFallbackData();
    console.log('Fallback for 390011:', fallback['390011']);
    
  } catch (error) {
    console.error('Error:', error);
  }
};

testPincode();
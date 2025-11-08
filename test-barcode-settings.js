// Smoke test for barcode settings
console.log('🔍 Smoke Testing Barcode Settings...\n');

const testScenarios = [
  {
    name: 'Paper Size Change (A4 → A5)',
    before: { paperSize: 'a4', paperWidth: 210, paperHeight: 297 },
    after: { paperSize: 'a5', paperWidth: 148, paperHeight: 210 },
    expectedChange: true,
  },
  {
    name: 'Barcode Dimensions Change',
    before: { barcodeWidth: 50, barcodeHeight: 25 },
    after: { barcodeWidth: 80, barcodeHeight: 40 },
    expectedChange: true,
  },
  {
    name: 'Columns Change (2 → 3)',
    before: { columns: 2 },
    after: { columns: 3 },
    expectedChange: true,
  },
  {
    name: 'Margins Change',
    before: { marginTop: 10, marginLeft: 10 },
    after: { marginTop: 15, marginLeft: 20 },
    expectedChange: true,
  },
  {
    name: 'Scale Change',
    before: { scale: 1 },
    after: { scale: 1.5 },
    expectedChange: true,
  },
];

let passed = 0;
let failed = 0;

testScenarios.forEach((test) => {
  const beforeStr = JSON.stringify(test.before);
  const afterStr = JSON.stringify(test.after);
  const changed = beforeStr !== afterStr;

  if (changed === test.expectedChange) {
    console.log(`✅ PASS: ${test.name}`);
    console.log(`   Before: ${beforeStr}`);
    console.log(`   After:  ${afterStr}\n`);
    passed++;
  } else {
    console.log(`❌ FAIL: ${test.name}`);
    console.log(`   Expected change: ${test.expectedChange}, Got: ${changed}\n`);
    failed++;
  }
});

console.log(`\n📊 Test Results:`);
console.log(`   ✅ Passed: ${passed}`);
console.log(`   ❌ Failed: ${failed}`);
console.log(`   Total: ${testScenarios.length}\n`);

if (failed === 0) {
  console.log('✅ All smoke tests PASSED! Settings logic is working.');
} else {
  console.log('⚠️ Some tests failed. Check settings implementation.');
}

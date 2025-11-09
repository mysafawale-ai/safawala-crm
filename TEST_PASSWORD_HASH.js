// TEST_PASSWORD_HASH.js
// Run this in Node.js to test if password hash is correct
// Usage: node TEST_PASSWORD_HASH.js

const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise(resolve => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('================================================');
  console.log('PASSWORD HASH VERIFICATION TOOL');
  console.log('================================================\n');

  const hashFromDB = await question('Paste password_hash from database: ');
  const passwordTried = await question('What password did you try?: ');

  console.log('\nTesting bcrypt.compare()...\n');

  try {
    const match = await bcrypt.compare(passwordTried, hashFromDB);
    
    console.log('Result:');
    console.log(`  Password matches hash: ${match ? '✅ YES' : '❌ NO'}\n`);

    if (match) {
      console.log('✅ SUCCESS');
      console.log('The password is CORRECT.');
      console.log('If login still fails, the issue is elsewhere (is_active flag, env vars, etc).');
    } else {
      console.log('❌ FAILED');
      console.log('The password does NOT match the hash in database.');
      console.log('Solutions:');
      console.log('1. Try the exact password (check for typos, spaces)');
      console.log('2. Have super admin reset password for this user');
      console.log('3. Recreate the user with new password');
    }

    // Also show hash details
    console.log('\n--- HASH DETAILS ---');
    console.log(`Hash length: ${hashFromDB.length}`);
    console.log(`Starts with: ${hashFromDB.substring(0, 10)}`);
    console.log(`Valid bcrypt?: ${hashFromDB.startsWith('$2a$') || hashFromDB.startsWith('$2b$') || hashFromDB.startsWith('$2x$') || hashFromDB.startsWith('$2y$') ? '✅ YES' : '❌ NO'}`);
  } catch (err) {
    console.log('❌ ERROR');
    console.log(`Error: ${err.message}`);
    console.log('The password hash might be invalid or corrupted.');
  }

  console.log('\n================================================\n');
  rl.close();
}

main();

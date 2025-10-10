const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  if (line.trim() && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length) envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

async function checkUsers() {
  console.log('Checking users table for staff/franchise members...\n');
  
  const { data, error } = await supabase
    .from('users')
    .select('id, email, name, role, franchise_id')
    .limit(5);
  
  if (error) {
    console.log('Error:', error.message);
  } else {
    console.log('Sample users:', JSON.stringify(data, null, 2));
  }
}

checkUsers().then(() => process.exit(0));

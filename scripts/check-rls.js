const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('/Applications/safawala-crm/.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();
const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

async function run() {
  var res = await sb.from('users').select('id, email, role, franchise_id, name').eq('role', 'franchise_admin').limit(10);
  console.log('Franchise admins err:', JSON.stringify(res.error));
  console.log('Franchise admins:', JSON.stringify(res.data));
  var res2 = await sb.from('users').select('id, email, role, franchise_id, name').eq('role', 'super_admin').limit(10);
  console.log('Super admins err:', JSON.stringify(res2.error));
  console.log('Super admins:', JSON.stringify(res2.data));
}
run().catch(function(e) { console.log('CATCH:', e.message); });

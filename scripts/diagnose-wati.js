const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TEST_PHONE = '916353583148';

async function getWatiConfig() {
  const { data } = await supabase
    .from('integration_settings')
    .select('api_key, base_url')
    .eq('integration_name', 'whatsapp-wati')
    .single();
  return data;
}

async function main() {
  const config = await getWatiConfig();

  // 1. Get raw template list — print first template to see field names
  console.log('━━━ Raw template response (first 2 templates) ━━━');
  const res = await fetch(`${config.base_url}/api/v1/getMessageTemplates`, {
    headers: { Authorization: `Bearer ${config.api_key}` },
  });
  const data = await res.json();

  // Print all keys of first template to understand structure
  if (data?.messageTemplates?.length > 0) {
    console.log('First template keys:', Object.keys(data.messageTemplates[0]));
    console.log('\nFirst template raw:');
    console.log(JSON.stringify(data.messageTemplates[0], null, 2));
    console.log('\nSecond template raw:');
    console.log(JSON.stringify(data.messageTemplates[1], null, 2));

    // Now list all templates with correct field
    console.log('\n━━━ All templates ━━━');
    data.messageTemplates.forEach(t => {
      // Try all possible name fields
      const n = t.name || t.templateName || t.elementName || t.id || JSON.stringify(Object.values(t).slice(0,2));
      console.log(`  - ${n} [${t.status}]`);
    });
  } else {
    console.log('No templates found. Full response:');
    console.log(JSON.stringify(data, null, 2));
  }

  // 2. Add contact + try sending to them
  console.log('\n━━━ Try adding contact to WATI first ━━━');
  const addRes = await fetch(`${config.base_url}/api/v1/addContact/${TEST_PHONE}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.api_key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: 'Rahul Test' }),
  });
  const addText = await addRes.text();
  console.log('Add contact status:', addRes.status);
  console.log('Add contact response:', addText);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});

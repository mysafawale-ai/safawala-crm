const https = require('https');
const http = require('http');

async function testDashboard() {
  console.log('Testing dashboard data...\n');
  
  const fs = require('fs');
  const path = require('path');
  const envPath = path.join(__dirname, '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.error('Error: .env.local not found');
    return;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const supabaseUrl = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
  const supabaseKey = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/)?.[1]?.trim();
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Supabase credentials not found in .env.local');
    return;
  }
  
  console.log('Supabase URL:', supabaseUrl);
  
  const url = new URL(supabaseUrl + '/rest/v1/bookings');
  url.searchParams.append('select', 'id,status,total_amount,type');
  url.searchParams.append('limit', '1000');
  
  const options = {
    headers: {
      'apikey': supabaseKey,
      'Authorization': 'Bearer ' + supabaseKey,
      'Content-Type': 'application/json'
    }
  };
  
  return new Promise((resolve, reject) => {
    const protocol = url.protocol === 'https:' ? https : http;
    protocol.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const bookings = JSON.parse(data);
          console.log('Total bookings in database:', bookings.length);
          
          if (bookings.length > 0) {
            const totalRevenue = bookings.reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0);
            const activeBookings = bookings.filter(b => ['confirmed', 'delivered'].includes(b.status)).length;
            
            console.log('Active bookings:', activeBookings);
            console.log('Total revenue:', totalRevenue.toLocaleString());
            console.log('Average booking value:', Math.round(totalRevenue / bookings.length).toLocaleString());
            
            console.log('\nSample bookings:');
            bookings.slice(0, 3).forEach(b => {
              console.log('  - Status: ' + b.status + ', Amount: ' + b.total_amount + ', Type: ' + b.type);
            });
          } else {
            console.log('WARNING: No bookings found in database!');
            console.log('This is why dashboard shows zeros.');
          }
          
          resolve();
        } catch (e) {
          console.error('Error parsing response:', e);
          console.log('Raw response:', data);
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

testDashboard().catch(console.error);

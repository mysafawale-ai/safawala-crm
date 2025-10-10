-- Create integration_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS integration_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_name VARCHAR(100) NOT NULL,
  api_key TEXT,
  secret TEXT,
  webhook TEXT,
  base_url TEXT,
  instance_id TEXT,
  test_phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(integration_name)
);

-- Insert sample WATI configuration
INSERT INTO integration_settings (integration_name, api_key, base_url, instance_id, test_phone, is_active)
VALUES (
  'WATI',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlMWU0YjA3NS03ZmUxLTQzYmUtOTBiMC04NTExMjQxNjEzYTQiLCJ1bmlxdWVfbmFtZSI6Im15c2FmYXdhbGVAZ21haWwuY29tIiwibmFtZWlkIjoibXlzYWZhd2FsZUBnbWFpbC5jb20iLCJlbWFpbCI6Im15c2FmYXdhbGVAZ21haWwuY29tIiwiYXV0aF90aW1lIjoiMDgvMTIvMjAyNSAyMDoxMjo1NSIsInRlbmFudF9pZCI6IjQ4MTQ1NSIsImRiX25hbWUiOiJtdC1wcm9kLVRlbmFudHMiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOiJBRE1JTklTVFJBVE9SIiwiZXhwIjoyNTM0MDIzMDA4MDAsImlzcyI6IkNsYXJlX0FJIiwiYXVkIjoiQ2xhcmVfQUkifQ.ZmgPg4ZTHPhSytUlT0s2BfmUIEkzlKdAbogvVNzHTek',
  'https://live-mt-server.wati.io/481455',
  '481455',
  '+919725295692',
  true
) ON CONFLICT (integration_name) DO UPDATE SET
  api_key = EXCLUDED.api_key,
  base_url = EXCLUDED.base_url,
  instance_id = EXCLUDED.instance_id,
  test_phone = EXCLUDED.test_phone,
  updated_at = NOW();

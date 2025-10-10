## Storage Setup Alternative - Use Supabase Dashboard

If you're getting permission errors with SQL, you can set up storage policies through the Supabase Dashboard:

### Method 1: Dashboard Setup (Recommended)

1. **Go to Supabase Dashboard** → Storage → uploads bucket
2. **Click "Policies" tab**
3. **Click "New Policy"** for each of these:

#### Policy 1: Allow Public Read Access
- **Name**: `Allow public read access`
- **Allowed operation**: `SELECT`
- **Target roles**: `public`
- **Policy definition**: 
  ```sql
  bucket_id = 'uploads'
  ```

#### Policy 2: Allow Authenticated Upload
- **Name**: `Allow authenticated users to upload`
- **Allowed operation**: `INSERT`  
- **Target roles**: `authenticated`
- **Policy definition**:
  ```sql
  bucket_id = 'uploads'
  ```

#### Policy 3: Allow Authenticated Update
- **Name**: `Allow authenticated users to update`
- **Allowed operation**: `UPDATE`
- **Target roles**: `authenticated` 
- **Policy definition**:
  ```sql
  bucket_id = 'uploads'
  ```

#### Policy 4: Allow Authenticated Delete
- **Name**: `Allow authenticated users to delete`
- **Allowed operation**: `DELETE`
- **Target roles**: `authenticated`
- **Policy definition**:
  ```sql
  bucket_id = 'uploads'
  ```

### Method 2: Alternative SQL (Try if Method 1 doesn't work)

If the dashboard doesn't work, try running these one by one in SQL Editor:

```sql
-- Run each CREATE POLICY statement separately:

CREATE POLICY "uploads_public_access" ON storage.objects
FOR SELECT USING (bucket_id = 'uploads');

CREATE POLICY "uploads_auth_insert" ON storage.objects  
FOR INSERT WITH CHECK (bucket_id = 'uploads');

CREATE POLICY "uploads_auth_update" ON storage.objects
FOR UPDATE USING (bucket_id = 'uploads');

CREATE POLICY "uploads_auth_delete" ON storage.objects
FOR DELETE USING (bucket_id = 'uploads');
```

### Method 3: Test Without Policies (Temporary)

For testing purposes, you can temporarily make the bucket public:

1. Go to Storage → uploads bucket → Settings
2. Set bucket to "Public"
3. This allows anyone to read files but only authenticated users can upload

The upload functionality should work even with basic permissions since we're using authenticated requests through the Supabase client.
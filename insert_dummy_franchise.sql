-- Insert a dummy franchise if none exist
INSERT INTO franchises (name, city, state, pincode, created_at, updated_at)
SELECT 'Demo Franchise', 'Demo City', 'Demo State', '123456', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM franchises LIMIT 1);

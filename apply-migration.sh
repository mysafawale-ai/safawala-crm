#!/bin/bash

# This script applies the denormalization migration to Supabase
# You need to have supabase CLI installed and be authenticated

echo "Applying denormalization migration to Supabase..."

# Run the migration
supabase migrations push

echo "Migration applied successfully!"

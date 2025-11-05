#!/usr/bin/env node

/**
 * Diagnostic script to check products table structure
 */

require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnoseProducts() {
  console.log("\n🔍 Diagnosing Products Table Schema\n");

  try {
    // Try to fetch one product and see what columns exist
    console.log("Step 1️⃣: Fetching one product to see available columns...");
    const { data: products, error: productError } = await supabase
      .from("products")
      .select("*")
      .limit(1);

    if (productError) {
      console.error("❌ Error fetching products:", productError);
      process.exit(1);
    }

    if (!products || products.length === 0) {
      console.log("⚠️ No products found in database");
      process.exit(1);
    }

    const product = products[0];
    console.log("✅ Successfully fetched product\n");

    console.log("📋 Available columns in products table:");
    const columns = Object.keys(product).sort();
    columns.forEach((col, idx) => {
      console.log(`  ${idx + 1}. ${col}: ${typeof product[col]} = ${JSON.stringify(product[col]).substring(0, 50)}`);
    });

    console.log("\n✅ Column Analysis Complete");
    console.log("\nPrice-related columns found:");
    columns.filter(c => c.toLowerCase().includes('price')).forEach(col => {
      console.log(`  ✓ ${col}`);
    });

    // Try the problematic query
    console.log("\n\nStep 2️⃣: Testing problematic API query structure...");
    console.log("Attempting to query barcodes with products join...");

    const { data: testData, error: testError } = await supabase
      .from("barcodes")
      .select(`
        id,
        product_id,
        barcode_number,
        barcode_type,
        is_active,
        products!inner(
          id,
          name,
          product_code,
          category,
          category_id,
          rental_price,
          stock_available,
          franchise_id
        )
      `)
      .limit(1);

    if (testError) {
      console.error("❌ Error with join query:", testError.message);
      console.error("Details:", testError);
    } else {
      console.log("✅ Join query successful!");
      if (testData && testData.length > 0) {
        console.log("Sample barcode record:", testData[0]);
      }
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

diagnoseProducts();

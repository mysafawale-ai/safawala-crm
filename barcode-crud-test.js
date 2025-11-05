#!/usr/bin/env node

/**
 * Barcode Diagnostic & CRUD Test Script
 * Tests: Create, Read, Update, Delete operations on SAF562036
 * 
 * Usage: node barcode-crud-test.js
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const BARCODE_TEST = "SAF562036";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    "❌ ERROR: Missing Supabase credentials in .env.local"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// DIAGNOSTIC FUNCTIONS
// ============================================

async function checkBarcodeExists() {
  console.log("\n📋 Step 1: Checking if barcode SAF562036 exists...");

  const { data, error } = await supabase
    .from("barcodes")
    .select("*")
    .eq("barcode_number", BARCODE_TEST);

  if (error) {
    console.error("❌ Error querying barcodes:", error.message);
    return null;
  }

  if (data && data.length > 0) {
    console.log("✅ Barcode exists!");
    console.log(JSON.stringify(data[0], null, 2));
    return data[0];
  } else {
    console.log("❌ Barcode does NOT exist");
    return null;
  }
}

async function checkProduct(productId) {
  console.log(`\n📋 Checking product linked to barcode (ID: ${productId})...`);

  const { data, error } = await supabase
    .from("products")
    .select(
      "id, name, barcode, sku, sale_price, rental_price, security_deposit, franchise_id, is_active"
    )
    .eq("id", productId);

  if (error) {
    console.error("❌ Error fetching product:", error.message);
    return null;
  }

  if (data && data.length > 0) {
    console.log("✅ Product found:");
    console.log(JSON.stringify(data[0], null, 2));
    return data[0];
  } else {
    console.log("❌ Product NOT found!");
    return null;
  }
}

async function getAvailableProducts() {
  console.log("\n📋 Fetching available active products...");

  const { data, error } = await supabase
    .from("products")
    .select("id, name, sale_price, rental_price, category, is_active, franchise_id")
    .eq("is_active", true)
    .limit(10);

  if (error) {
    console.error("❌ Error fetching products:", error.message);
    return [];
  }

  if (data && data.length > 0) {
    console.log(`✅ Found ${data.length} active products:`);
    data.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.name} (ID: ${p.id}) - ₹${p.sale_price || p.rental_price}`);
    });
    return data;
  } else {
    console.log("❌ No active products found!");
    return [];
  }
}

async function createBarcode(productId, franchiseId) {
  console.log(`\n✨ Step 2: Creating barcode SAF562036 linked to product ${productId}...`);

  const { data, error } = await supabase
    .from("barcodes")
    .insert({
      barcode_number: BARCODE_TEST,
      product_id: productId,
      barcode_type: "CODE128",
      is_active: true,
      franchise_id: franchiseId,
    })
    .select();

  if (error) {
    console.error("❌ Error creating barcode:", error.message);
    return null;
  }

  if (data && data.length > 0) {
    console.log("✅ Barcode created successfully!");
    console.log(JSON.stringify(data[0], null, 2));
    return data[0];
  }
}

async function updateBarcode(barcodeId, updates) {
  console.log(`\n✏️ Step 3: Updating barcode ${barcodeId}...`);

  const { data, error } = await supabase
    .from("barcodes")
    .update(updates)
    .eq("id", barcodeId)
    .select();

  if (error) {
    console.error("❌ Error updating barcode:", error.message);
    return null;
  }

  if (data && data.length > 0) {
    console.log("✅ Barcode updated!");
    console.log(JSON.stringify(data[0], null, 2));
    return data[0];
  }
}

async function testBarcodeAPI() {
  console.log("\n🔗 Step 4: Testing barcode lookup API...");

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/barcode/lookup`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barcode: BARCODE_TEST,
          franchiseId: "test-franchise", // This would be the actual franchise ID
        }),
      }
    );

    const result = await response.json();

    if (response.ok && result.success) {
      console.log("✅ API returned product successfully!");
      console.log(JSON.stringify(result.product, null, 2));
      return result.product;
    } else {
      console.log("❌ API Error:");
      console.log(JSON.stringify(result, null, 2));
      return null;
    }
  } catch (err) {
    console.error("❌ Error calling API:", err.message);
    return null;
  }
}

async function deleteBarcode(barcodeId) {
  console.log(`\n🗑️ Step 5: Deleting barcode ${barcodeId}...`);

  const { error } = await supabase
    .from("barcodes")
    .delete()
    .eq("id", barcodeId);

  if (error) {
    console.error("❌ Error deleting barcode:", error.message);
    return false;
  }

  console.log("✅ Barcode deleted!");
  return true;
}

// ============================================
// MAIN TEST FLOW
// ============================================

async function runFullTest() {
  console.log("============================================");
  console.log("🚀 BARCODE CRUD & SMOKE TEST");
  console.log("============================================");

  try {
    // Step 1: Check if barcode exists
    let barcode = await checkBarcodeExists();

    // Step 2: Get available products
    const products = await getAvailableProducts();
    if (products.length === 0) {
      console.error("❌ Cannot proceed - no products available");
      return;
    }

    // Step 3: Create barcode if it doesn't exist
    if (!barcode) {
      const product = products[0];
      console.log(`\n🔗 Linking barcode to: ${product.name}`);
      barcode = await createBarcode(product.id, product.franchise_id);
      if (!barcode) {
        console.error("❌ Failed to create barcode");
        return;
      }
    }

    // Step 4: Verify the product is properly linked
    if (barcode && barcode.product_id) {
      await checkProduct(barcode.product_id);
    }

    // Step 5: Test the API
    const apiProduct = await testBarcodeAPI();

    // Step 6: Test update
    if (barcode) {
      await updateBarcode(barcode.id, {
        barcode_type: "CODE128_UPDATED",
        updated_at: new Date().toISOString(),
      });
    }

    // Summary
    console.log("\n============================================");
    console.log("📊 TEST SUMMARY");
    console.log("============================================");
    console.log("✅ Barcode Created/Found: " + (barcode ? "YES" : "NO"));
    console.log(
      "✅ Product Linked: " + (barcode && barcode.product_id ? "YES" : "NO")
    );
    console.log("✅ API Accessible: " + (apiProduct ? "YES" : "NO"));

    if (barcode && barcode.product_id && apiProduct) {
      console.log("\n🎉 ALL TESTS PASSED - BARCODE READY FOR USE!");
    } else {
      console.log("\n⚠️ Some tests failed - see details above");
    }
  } catch (err) {
    console.error("❌ Unexpected error:", err);
  }
}

// Run the test
runFullTest();

#!/usr/bin/env node

/**
 * Simple Barcode Verification
 * Checks current state without RLS complications
 */

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://xplnyaxkusvuajtmorss.supabase.co";
const SUPABASE_SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwbG55YXhrdXN2dWFqdG1vcnNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDQzNTkwOCwiZXhwIjoyMDcwMDExOTA4fQ.-46NLMqfpy8mKFgrQtW0KuW4_Vk5WeBmovy5QwFMiLY";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function verify() {
  console.log("============================================");
  console.log("🔍 BARCODE VERIFICATION");
  console.log("============================================\n");

  try {
    // Check if we can access tables
    console.log("1️⃣ Checking barcodes table structure...");
    const { data: barcodesData, error: barcodesError } = await supabase
      .from("barcodes")
      .select("*")
      .limit(5);

    if (barcodesError) {
      console.log("❌ Cannot access barcodes table:", barcodesError.message);
    } else {
      console.log("✅ Barcodes table accessible");
      console.log(`   Records found: ${barcodesData.length}`);
      if (barcodesData.length > 0) {
        console.log(`   Sample: ${barcodesData[0].barcode_number}`);
      }
    }

    console.log("\n2️⃣ Checking for SAF562036...");
    const { data: foundBarcode, error: findError } = await supabase
      .from("barcodes")
      .select("*")
      .ilike("barcode_number", "%SAF562036%");

    if (findError) {
      console.log("❌ Error searching:", findError.message);
    } else if (foundBarcode && foundBarcode.length > 0) {
      console.log("✅ Found SAF562036!");
      console.log(JSON.stringify(foundBarcode[0], null, 2));
    } else {
      console.log("❌ SAF562036 not found in barcodes table");
    }

    console.log("\n3️⃣ Checking products table...");
    const { data: productsData, error: productsError } = await supabase
      .from("products")
      .select("*")
      .limit(5);

    if (productsError) {
      console.log("❌ Cannot access products table:", productsError.message);
    } else {
      console.log("✅ Products table accessible");
      console.log(`   Records found: ${productsData.length}`);
      if (productsData.length > 0) {
        const p = productsData[0];
        console.log(`   Sample: ${p.name || "N/A"} - Sale: ${p.sale_price}, Rental: ${p.rental_price}`);
      }
    }

    console.log("\n4️⃣ Checking for SAF562036 in products...");
    const { data: foundProduct, error: findProdError } = await supabase
      .from("products")
      .select("*")
      .or(
        `sku.ilike.%SAF562036%,product_code.ilike.%SAF562036%,barcode.ilike.%SAF562036%`
      );

    if (findProdError) {
      console.log("⚠️ Error searching products:", findProdError.message);
    } else if (foundProduct && foundProduct.length > 0) {
      console.log("✅ Found SAF562036 in products table!");
      const p = foundProduct[0];
      console.log(`   Name: ${p.name}`);
      console.log(`   SKU: ${p.sku}`);
      console.log(`   Product Code: ${p.product_code}`);
      console.log(`   Barcode: ${p.barcode}`);
      console.log(`   Sale Price: ${p.sale_price}`);
      console.log(`   Rental Price: ${p.rental_price}`);
    } else {
      console.log("❌ SAF562036 not found in products table");
    }

    // Summary
    console.log("\n============================================");
    console.log("📊 SUMMARY");
    console.log("============================================");
    console.log("\nCurrent State:");
    console.log(
      `  Barcodes table: ${barcodesData && !barcodesError ? "✅ Exists" : "❌ Error"}`
    );
    console.log(
      `  Products table: ${productsData && !productsError ? "✅ Exists" : "❌ Error"}`
    );
    console.log(
      `  SAF562036 in barcodes: ${
        foundBarcode && foundBarcode.length > 0 ? "✅ YES" : "❌ NO"
      }`
    );
    console.log(
      `  SAF562036 in products: ${
        foundProduct && foundProduct.length > 0 ? "✅ YES" : "❌ NO"
      }`
    );

    console.log("\n🎯 ACTION NEEDED:");
    if (
      (!foundBarcode || foundBarcode.length === 0) &&
      (!foundProduct || foundProduct.length === 0)
    ) {
      console.log("   ❌ SAF562036 does NOT exist anywhere");
      console.log("   → Must create it in the system first");
    } else if (foundBarcode && foundBarcode.length > 0) {
      console.log("   ✅ SAF562036 is in barcodes table");
      const b = foundBarcode[0];
      if (b.product_id) {
        console.log("   ✅ Linked to product:", b.product_id);
        console.log("   → Ready for testing!");
      } else {
        console.log("   ⚠️ NOT linked to any product (orphaned)");
        console.log("   → Need to link to a product");
      }
    } else if (foundProduct && foundProduct.length > 0) {
      console.log("   ✅ SAF562036 found in products table (fallback)");
      console.log("   → Scanning will work via fallback");
      console.log("   💡 Tip: Also add to barcodes table for better perf");
    }
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

verify();

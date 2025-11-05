#!/usr/bin/env node

/**
 * Barcode Linking Verification Script
 * Directly queries Supabase to verify barcode-product linking
 */

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://xplnyaxkusvuajtmorss.supabase.co";
const SUPABASE_SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwbG55YXhrdXN2dWFqdG1vcnNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDQzNTkwOCwiZXhwIjoyMDcwMDExOTA4fQ.-46NLMqfpy8mKFgrQtW0KuW4_Vk5WeBmovy5QwFMiLY";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const BARCODE_TEST = "SAF562036";

console.log("============================================");
console.log("🔍 BARCODE LINKING VERIFICATION");
console.log("============================================\n");

async function runVerification() {
  try {
    // ============================================
    // STEP 1: Check barcodes table exists
    // ============================================
    console.log("📋 Step 1: Checking barcodes table...\n");

    const { data: barcodeCount, error: countError } = await supabase
      .from("barcodes")
      .select("*", { count: "exact", head: true });

    if (countError && countError.message.includes("relation")) {
      console.log(
        "❌ BARCODES TABLE DOES NOT EXIST!"
      );
      console.log("   Error:", countError.message);
      console.log("\n   ACTION: Run scripts/CREATE_DEDICATED_BARCODES_TABLE.sql\n");
      return;
    } else if (countError) {
      console.log("⚠️ Error checking barcodes table:", countError.message);
      return;
    }

    console.log("✅ Barcodes table EXISTS");
    console.log(`   Total barcodes in system: ${barcodeCount}\n`);

    // ============================================
    // STEP 2: Check if SAF562036 exists in barcodes table
    // ============================================
    console.log("📋 Step 2: Searching for SAF562036 in barcodes table...\n");

    const { data: barcode, error: barcodeError } = await supabase
      .from("barcodes")
      .select(
        `id, barcode_number, product_id, barcode_type, is_active, created_at, products(id, name, sale_price, rental_price, franchise_id)`
      )
      .eq("barcode_number", BARCODE_TEST)
      .single();

    if (barcodeError && barcodeError.code === "PGRST116") {
      console.log(`❌ BARCODE "${BARCODE_TEST}" NOT FOUND in barcodes table`);
      console.log("   Expected: Entry in barcodes table with barcode_number = 'SAF562036'");
      console.log("   Current: No matching barcode found\n");

      // Try fallback - check products table
      console.log("📋 Step 3: Checking products table as fallback...\n");

      const { data: productList, error: productError } = await supabase
        .from("products")
        .select("id, name, sku, product_code, barcode, sale_price, franchise_id")
        .or(
          `sku.eq.${BARCODE_TEST},product_code.eq.${BARCODE_TEST},barcode.eq.${BARCODE_TEST}`
        );

      const product = productList && productList.length > 0 ? productList[0] : null;

      if (productError || !product) {
        console.log(`❌ BARCODE "${BARCODE_TEST}" NOT FOUND ANYWHERE!`);
        console.log("   Not in barcodes table (primary)");
        console.log("   Not in products table fields (fallback)\n");

        console.log("🛠️ ACTION REQUIRED:");
        console.log("   1. Create barcode in barcodes table");
        console.log("   2. Link to an existing product\n");

        // Get sample products
        console.log("📋 Available products to link to:\n");
        const { data: products, error: productsError } = await supabase
          .from("products")
          .select("id, name, sale_price, rental_price, franchise_id")
          .eq("is_active", true)
          .limit(5);

        if (products && products.length > 0) {
          console.log("✅ Found available products:\n");
          products.forEach((p, i) => {
            console.log(
              `   ${i + 1}. ${p.name} (ID: ${p.id}) - ₹${p.sale_price || p.rental_price}`
            );
          });

          console.log(
            `\n📝 Copy one product ID and run this SQL in Supabase:\n`
          );
          console.log(`INSERT INTO barcodes (product_id, barcode_number, barcode_type, is_active)`);
          console.log(`VALUES ('${products[0].id}', '${BARCODE_TEST}', 'CODE128', true);\n`);
        } else {
          console.log("❌ No products available in system!");
        }
      } else if (product) {
        console.log("✅ FOUND in products table (fallback)!");
        console.log(`   Product: ${product.name}`);
        console.log(`   Found in field: ${product.sku ? "sku" : product.product_code ? "product_code" : "barcode"}`);
        console.log(`   Sale Price: ₹${product.sale_price}`);
        console.log(`   Franchise: ${product.franchise_id}\n`);

        console.log("✨ This product WILL work with barcode scanning!");
        console.log("   (API will use fallback search)\n");

        console.log(
          "💡 Recommendation: Also add to barcodes table for better performance\n"
        );
        console.log(`   SQL: INSERT INTO barcodes (product_id, barcode_number, barcode_type, is_active)`);
        console.log(`   VALUES ('${product.id}', '${BARCODE_TEST}', 'CODE128', true);\n`);
      }
    } else if (barcode) {
      console.log(`✅ BARCODE "${BARCODE_TEST}" FOUND!`);
      console.log(`   Barcode ID: ${barcode.id}`);
      console.log(`   Product ID: ${barcode.product_id}`);
      console.log(`   Barcode Type: ${barcode.barcode_type}`);
      console.log(`   Active: ${barcode.is_active}`);
      console.log(`   Created: ${barcode.created_at}\n`);

      if (barcode.products) {
        console.log("✅ PRODUCT LINKED CORRECTLY!");
        console.log(`   Product: ${barcode.products.name}`);
        console.log(`   Sale Price: ₹${barcode.products.sale_price}`);
        console.log(`   Rental Price: ₹${barcode.products.rental_price}`);
        console.log(`   Franchise: ${barcode.products.franchise_id}\n`);

        console.log("🎉 BARCODE-PRODUCT LINKING IS COMPLETE!");
        console.log("   Ready for smoke testing in frontend form\n");
      } else {
        console.log("❌ ORPHANED BARCODE (No product linked)!");
        console.log("   product_id:", barcode.product_id);
        console.log("   Action: Relink to valid product\n");
      }
    }

    // ============================================
    // STEP 4: Statistics
    // ============================================
    console.log("📊 System Statistics:\n");

    const { data: allBarcodes, error: statsError } = await supabase
      .from("barcodes")
      .select("*");

    if (allBarcodes) {
      const active = allBarcodes.filter((b) => b.is_active).length;
      const orphaned = allBarcodes.filter((b) => !b.product_id).length;

      console.log(`   Total Barcodes: ${allBarcodes.length}`);
      console.log(`   Active: ${active}`);
      console.log(`   Orphaned (no product): ${orphaned}\n`);
    }

    const { data: allProducts, error: prodStatsError } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true });

    console.log(`   Total Products: ${allProducts || 0}`);

    // ============================================
    // STEP 5: Summary
    // ============================================
    console.log("\n============================================");
    console.log("📋 VERIFICATION SUMMARY");
    console.log("============================================\n");

    if (barcode && barcode.products) {
      console.log("✅ STATUS: READY FOR SMOKE TESTING");
      console.log("   Barcode: Linked to product");
      console.log("   Next: Open form and test scanning\n");
    } else if (product) {
      console.log("✅ STATUS: PARTIALLY READY");
      console.log("   Barcode: Found in products table (fallback)");
      console.log("   Optimization: Add to barcodes table for better perf\n");
    } else {
      console.log("❌ STATUS: BARCODE MISSING");
      console.log("   Action: Create barcode and link to product\n");
    }

  } catch (error) {
    console.error("❌ Verification failed:", error.message);
  }
}

runVerification();

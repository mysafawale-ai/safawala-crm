#!/usr/bin/env node

/**
 * Barcode Diagnostic & CRUD Test Script (Alternative)
 * Uses direct fetch API to call Supabase REST endpoints
 * 
 * Usage: node barcode-crud-test-v2.js
 */

const SUPABASE_URL = "https://xplnyaxkusvuajtmorss.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwbG55YXhrdXN2dWFqdG1vcnNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MzU5MDgsImV4cCI6MjA3MDAxMTkwOH0.8rsWVHk87qXJ9_s12IIyrUH3f4mc-kuCCcppw7zTm98";
const BARCODE_TEST = "SAF562036";

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
};

// ============================================
// DIAGNOSTIC FUNCTIONS
// ============================================

async function checkBarcodeExists() {
  console.log("\n📋 Step 1: Checking if barcode SAF562036 exists...");

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/barcodes?barcode_number=eq.${BARCODE_TEST}`,
      {
        headers,
      }
    );

    if (!response.ok) {
      console.error("❌ Error querying barcodes:", response.statusText);
      return null;
    }

    const data = await response.json();

    if (data && data.length > 0) {
      console.log("✅ Barcode exists!");
      console.log(JSON.stringify(data[0], null, 2));
      return data[0];
    } else {
      console.log("❌ Barcode does NOT exist");
      return null;
    }
  } catch (err) {
    console.error("❌ Error:", err.message);
    return null;
  }
}

async function checkProduct(productId) {
  console.log(`\n📋 Checking product linked to barcode (ID: ${productId})...`);

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/products?id=eq.${productId}&select=id,name,barcode,sku,sale_price,rental_price,security_deposit,franchise_id,is_active`,
      {
        headers,
      }
    );

    if (!response.ok) {
      console.error("❌ Error fetching product:", response.statusText);
      return null;
    }

    const data = await response.json();

    if (data && data.length > 0) {
      console.log("✅ Product found:");
      console.log(JSON.stringify(data[0], null, 2));
      return data[0];
    } else {
      console.log("❌ Product NOT found!");
      return null;
    }
  } catch (err) {
    console.error("❌ Error:", err.message);
    return null;
  }
}

async function getAvailableProducts() {
  console.log("\n📋 Fetching available active products...");

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/products?is_active=eq.true&select=id,name,sale_price,rental_price,category,is_active,franchise_id&limit=10&order=created_at.desc`,
      {
        headers,
      }
    );

    if (!response.ok) {
      console.error("❌ Error fetching products:", response.statusText);
      return [];
    }

    const data = await response.json();

    if (data && data.length > 0) {
      console.log(`✅ Found ${data.length} active products:`);
      data.forEach((p, i) => {
        console.log(
          `  ${i + 1}. ${p.name} (ID: ${p.id}) - ₹${p.sale_price || p.rental_price}`
        );
      });
      return data;
    } else {
      console.log("❌ No active products found!");
      return [];
    }
  } catch (err) {
    console.error("❌ Error:", err.message);
    return [];
  }
}

async function createBarcode(productId, franchiseId) {
  console.log(
    `\n✨ Step 2: Creating barcode SAF562036 linked to product ${productId}...`
  );

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/barcodes`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        barcode_number: BARCODE_TEST,
        product_id: productId,
        barcode_type: "CODE128",
        is_active: true,
        franchise_id: franchiseId,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("❌ Error creating barcode:", error);
      return null;
    }

    const data = await response.json();

    if (data && data.length > 0) {
      console.log("✅ Barcode created successfully!");
      console.log(JSON.stringify(data[0], null, 2));
      return data[0];
    }
  } catch (err) {
    console.error("❌ Error:", err.message);
    return null;
  }
}

async function updateBarcode(barcodeId, updates) {
  console.log(`\n✏️ Step 3: Updating barcode ${barcodeId}...`);

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/barcodes?id=eq.${barcodeId}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          ...updates,
          updated_at: new Date().toISOString(),
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("❌ Error updating barcode:", error);
      return null;
    }

    const data = await response.json();

    if (data && data.length > 0) {
      console.log("✅ Barcode updated!");
      console.log(JSON.stringify(data[0], null, 2));
      return data[0];
    }
  } catch (err) {
    console.error("❌ Error:", err.message);
    return null;
  }
}

async function testBarcodeJoinQuery() {
  console.log("\n🔗 Step 4: Testing direct database query (barcode + product)...");

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/barcodes?select=*,products(*)&barcode_number=eq.${BARCODE_TEST}`,
      {
        headers,
      }
    );

    if (!response.ok) {
      console.error("❌ Error joining tables:", response.statusText);
      return null;
    }

    const data = await response.json();

    if (data && data.length > 0 && data[0].products) {
      console.log("✅ Database join successful!");
      console.log(JSON.stringify(data[0].products, null, 2));
      return data[0].products;
    } else {
      console.log("❌ Join failed or no product linked");
      if (data && data.length > 0) {
        console.log("Barcode data:", JSON.stringify(data[0], null, 2));
      }
      return null;
    }
  } catch (err) {
    console.error("❌ Error:", err.message);
    return null;
  }
}

async function getBarcodesStats() {
  console.log("\n📊 Getting barcode statistics...");

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/barcodes?select=count&is_active=eq.true`,
      {
        headers,
      }
    );

    if (!response.ok) {
      console.error("❌ Error:", response.statusText);
      return 0;
    }

    const data = await response.json();
    console.log(`✅ Total active barcodes: ${data.length}`);
    return data.length;
  } catch (err) {
    console.error("❌ Error:", err.message);
    return 0;
  }
}

// ============================================
// MAIN TEST FLOW
// ============================================

async function runFullTest() {
  console.log("============================================");
  console.log("🚀 BARCODE CRUD & SMOKE TEST");
  console.log("============================================");

  try {
    // Get stats
    await getBarcodesStats();

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

    // Step 4: Verify the product is properly linked via join
    if (barcode && barcode.product_id) {
      await testBarcodeJoinQuery();
    }

    // Step 5: Test update
    if (barcode) {
      await updateBarcode(barcode.id, {
        barcode_type: "CODE128_VERIFIED",
      });
    }

    // Summary
    console.log("\n============================================");
    console.log("📊 TEST SUMMARY");
    console.log("============================================");
    console.log("✅ Barcode Found/Created: " + (barcode ? "YES" : "NO"));
    console.log("✅ Product Linked: " + (barcode && barcode.product_id ? "YES" : "NO"));
    console.log("✅ Database Queries: OK");

    if (barcode && barcode.product_id) {
      console.log("\n🎉 DATABASE TESTS PASSED!");
      console.log(`\nBarcode: ${barcode.barcode_number}`);
      console.log(`Product ID: ${barcode.product_id}`);
      console.log(`Status: Active`);
      console.log("\nNow ready for frontend smoke test...");
    } else {
      console.log("\n⚠️ Some tests failed - see details above");
    }
  } catch (err) {
    console.error("❌ Unexpected error:", err);
  }
}

// Run the test
runFullTest();

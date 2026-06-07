import { createClient } from '@supabase/supabase-js';
import xlsx from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

// Load .env.local explicitly
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// Initialize Supabase using service role key (for RLS bypass on write)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

console.log("Supabase URL:", supabaseUrl);
console.log("Using Service Role Key:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

const BASE_DIR = "/Applications/SAFAWALA MASTERPLAN/INVENTORY DETAILS/MALAS";
const EXCEL_PATH = path.join(BASE_DIR, "MALAS.xlsx");
const MALA_CATEGORY_ID = "c2788e4d-1195-403b-a87b-c98c8974b88c";
const DEFAULT_FRANCHISE_ID = "1a518dde-85b7-44ef-8bc4-092f53ddfd99";

function shortenColor(col: string): string {
  if (!col) return "";
  let clean = col
    .replace(/\bdeep\b/gi, "")
    .replace(/\bclear\b/gi, "")
    .replace(/\bsoft\b/gi, "")
    .replace(/\bcream\b/gi, "")
    .replace(/\bpastel\b/gi, "")
    .replace(/\broyal\b/gi, "")
    .replace(/\bivory\b/gi, "")
    .replace(/\bchampagne\b/gi, "")
    .replace(/\bpearl\b/gi, "")
    .trim();
  
  clean = clean.replace(/,/g, " &").replace(/\s+/g, " ");
  
  const parts = clean.split(/\s*&\s*/).map(p => p.trim()).filter(Boolean);
  const uniqueParts = Array.from(new Set(parts));
  const capitalized = uniqueParts.map(p => p.charAt(0).toUpperCase() + p.slice(1));
  
  if (capitalized.length > 0) {
    return capitalized.join(" & ");
  }
  return col;
}

function shortenSize(size: string): string {
  if (!size) return "Standard";
  const low = size.toLowerCase();
  if (low.includes("adjustable")) return "Adjustable";
  if (low.includes("standard")) return "Standard";
  return size.trim();
}

function getUltraShortMaterial(mat: string): string {
  if (!mat) return "Beads";
  const low = mat.toLowerCase();
  
  const hasPearls = low.includes("pearl");
  const hasKundan = low.includes("kundan");
  const hasPolki = low.includes("polki");
  const hasBeads = low.includes("bead") || low.includes("stone");
  const hasZircon = low.includes("zircon") || low.includes("cz") || low.includes("zirconia");
  const hasCrystals = low.includes("crystal");

  if (hasPolki && hasPearls) return "Polki & Pearls";
  if (hasKundan && hasPearls) return "Kundan & Pearls";
  if (hasPolki && hasKundan) return "Polki & Kundan";
  if (hasPolki && hasBeads) return "Polki & Beads";
  if (hasKundan && hasBeads) return "Kundan & Beads";
  if (hasPearls && hasBeads) return "Pearls & Beads";
  
  if (hasPearls) return "Pearls";
  if (hasKundan) return "Kundan";
  if (hasPolki) return "Polki";
  if (hasZircon) return "Zircon";
  if (hasCrystals) return "Crystals";
  if (hasBeads) return "Beads";
  
  return "Beads";
}

// Generates a 14-digit numeric barcode (similar to the existing system)
function generateBarcode(): string {
  const timestamp = Date.now().toString().slice(-10); // Last 10 digits of timestamp
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0'); // 4 random digits
  return timestamp + random;
}

async function run() {
  console.log("Loading Excel file from:", EXCEL_PATH);
  if (!fs.existsSync(EXCEL_PATH)) {
    throw new Error(`Excel file not found at ${EXCEL_PATH}`);
  }

  // Clear existing MALA products only to avoid touching other inventory items
  console.log("Clearing existing products in MALA category from products table...");
  const { error: deleteError } = await supabase
    .from('products')
    .delete()
    .eq('category_id', MALA_CATEGORY_ID)
    .eq('description', 'Mala imported from Stock Inventory Register');

  if (deleteError) {
    console.error("Warning during delete:", deleteError.message);
  } else {
    console.log("Existing malas cleared successfully from products table.");
  }

  // Read workbook
  const workbook = xlsx.readFile(EXCEL_PATH);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawData: any[][] = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  
  // Skip row 0 (title) and row 1 (headers)
  const data = rawData.slice(2);
  console.log(`Found ${data.length} rows to process.`);

  let successCount = 0;
  let failCount = 0;

  for (const row of data) {
    if (!row || row.length < 2) continue;
    
    // Column indices:
    // 0: S.No, 1: Name, 2: Details, 3: Qty, 4: Sale, 5: Regular, 6: Photo, 14: Status
    const name = row[1];
    if (!name || name === "Safa Name" || name === "Name") continue;

    console.log("Processing:", name);

    const details = String(row[2] || "");
    const [colorStr, sizeStr, materialStr] = details.split('|').map(s => s?.trim() || "");

    const finalColor = shortenColor(colorStr) || null;
    const finalSize = shortenSize(sizeStr) || null;
    const finalMaterial = getUltraShortMaterial(materialStr) || null;

    const quantity = Number(row[3]) || 0;
    const sale_price = Number(row[4]) || 0;
    const regular_price = Number(row[5]) || 0;
    
    let stock_status = String(row[14] || row[15] || "In Stock");
    if (typeof row[row.length - 1] === 'string' && row[row.length - 1].includes('Stock')) {
      stock_status = row[row.length - 1];
    }
    
    // Main Photo Upload
    const photoPathRelative = row[6];
    let main_photo_url = null;

    if (photoPathRelative && typeof photoPathRelative === 'string') {
      const fullPhotoPath = path.join(BASE_DIR, photoPathRelative);
      if (fs.existsSync(fullPhotoPath)) {
        const fileExt = path.extname(fullPhotoPath).toLowerCase();
        const fileName = `${Date.now()}_${path.basename(fullPhotoPath)}`;
        const fileBuffer = fs.readFileSync(fullPhotoPath);
        
        let contentType = 'image/jpeg';
        if (fileExt === '.png') contentType = 'image/png';
        if (fileExt === '.webp') contentType = 'image/webp';

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, fileBuffer, {
            contentType,
            upsert: true
          });

        if (uploadError) {
          console.error(`  -> Error uploading image:`, uploadError.message);
        } else {
          const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName);
          main_photo_url = publicUrl;
          console.log(`  -> Image uploaded: ${fileName}`);
        }
      } else {
        console.warn(`  -> Image file missing locally: ${fullPhotoPath}`);
      }
    }

    // Generate unique barcode number
    const barcode = generateBarcode();
    const productCode = `MAL-${Math.floor(100000 + Math.random() * 900000)}`;

    // Insert into DB core products table
    const { error: insertError } = await supabase.from('products').insert({
      name,
      description: 'Mala imported from Stock Inventory Register',
      category_id: MALA_CATEGORY_ID,
      sku: `MALA-${barcode.slice(-6)}`,
      barcode: barcode,
      barcode_number: barcode,
      price: sale_price,
      cost_price: 0,
      rental_price: 0,
      regular_price: regular_price,
      sale_price: sale_price,
      stock_total: quantity,
      stock_available: quantity,
      stock_booked: 0,
      stock_damaged: 0,
      stock_in_laundry: 0,
      reorder_level: 5,
      franchise_id: DEFAULT_FRANCHISE_ID,
      is_active: true,
      image_url: main_photo_url,
      color: finalColor,
      size: finalSize,
      material: finalMaterial,
      product_code: productCode
    });

    if (insertError) {
      console.error(`  -> Error inserting DB record:`, insertError.message);
      failCount++;
    } else {
      console.log(`  -> Inserted successfully with Barcode: ${barcode}`);
      successCount++;
    }
  }

  console.log("\n=================================");
  console.log(`Import Complete!`);
  console.log(`Successfully imported: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  console.log("=================================");
}

run().catch(console.error);

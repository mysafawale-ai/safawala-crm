#!/bin/bash

# Script to add Edit Quote functionality to quotes page

FILE="/Applications/safawala-crm/app/quotes/page.tsx"
BACKUP="/Applications/safawala-crm/app/quotes/page.tsx.backup"

# Create backup
cp "$FILE" "$BACKUP"
echo "✅ Backup created: $BACKUP"

# Step 1: Add handler functions after handleDownloadPDF in the SECOND component (export default)
# Find line number after "export default function QuotesPage"
LINE_NUM=$(grep -n "export default function QuotesPage" "$FILE" | head -1 | cut -d: -f1)
echo "Found export default at line: $LINE_NUM"

# Find the handleDownloadPDF after that line and add our functions after it
# We'll insert after the closing } of handleDownloadPDF

# Step 2: Update the Edit button to call handleEditQuote instead of router.push
sed -i.tmp '/onClick={() => {$/,/}}$/c\
                          onClick={() => handleEditQuote(quote)}\
                          title="Edit Quote"\
                        >' "$FILE" && rm -f "$FILE.tmp"

echo "✅ Script prepared. Manual edits still needed - see EDIT_QUOTE_FEATURE_SUMMARY.md"

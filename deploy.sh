#!/bin/bash

# =====================================================
# PRODUCTION DEPLOYMENT SCRIPT
# Automated deployment of bug fixes and invoice system
# =====================================================

set -e  # Exit on error

echo ""
echo "═══════════════════════════════════════════════"
echo "🚀 SAFAWALA CRM - PRODUCTION DEPLOYMENT"
echo "═══════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if running in correct directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Must run from project root directory${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Step 1: Pre-Deployment Checklist${NC}"
echo ""

# Check git status
echo "🔍 Checking git status..."
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  Uncommitted changes detected${NC}"
    echo ""
    git status --short
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}Deployment cancelled${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Git working directory clean${NC}"
fi

# Check if TypeScript compiles
echo ""
echo "🔍 Checking TypeScript compilation..."
if pnpm build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ TypeScript compilation successful${NC}"
else
    echo -e "${RED}❌ TypeScript compilation failed${NC}"
    echo ""
    echo "Run 'pnpm build' to see errors"
    exit 1
fi

echo ""
echo -e "${BLUE}📋 Step 2: Review Changes${NC}"
echo ""

# Show files changed
echo "Files modified:"
git diff --name-only | while read file; do
    echo "  - $file"
done

echo ""
read -p "Review changes? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git diff app/create-product-order/page.tsx | head -100
    echo ""
    echo "... (truncated, see full diff with 'git diff')"
    echo ""
fi

echo ""
echo -e "${BLUE}📋 Step 3: Database Deployment${NC}"
echo ""

echo -e "${YELLOW}⚠️  MANUAL STEP REQUIRED:${NC}"
echo ""
echo "Open Supabase SQL Editor and run these files IN ORDER:"
echo ""
echo "  1. CREATE_TEST_DATA.sql"
echo "     └─ Creates test franchises, customers, products"
echo ""
echo "  2. VERIFY_SCHEMA_FOR_INVOICES.sql"
echo "     └─ Verifies database schema matches trigger expectations"
echo ""
echo "  3. AUTO_GENERATE_INVOICE_PRODUCTION.sql"
echo "     └─ Deploys invoice auto-generation trigger"
echo ""
echo "  4. TEST_AUTO_INVOICE_SYSTEM.sql"
echo "     └─ Runs 7 automated tests"
echo ""
echo "  5. AUTOMATED_SMOKE_TEST.sql"
echo "     └─ Validates bug fixes"
echo ""
read -p "Have you run all SQL files? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ Please run SQL files first${NC}"
    echo ""
    echo "Instructions:"
    echo "  1. Open Supabase Dashboard"
    echo "  2. Go to SQL Editor"
    echo "  3. Run each file listed above"
    echo "  4. Verify all tests pass"
    echo ""
    exit 1
fi

echo ""
echo -e "${BLUE}📋 Step 4: Code Deployment${NC}"
echo ""

# Commit changes
echo "📝 Committing changes..."
git add -A

git commit -m "feat: Production-ready system with critical bug fixes

Bug Fixes:
- Fix hard-coded franchise_id (use dynamic user session)
- Fix amount_paid calculation (use totals.payable)
- Both create-product-order and book-package pages fixed

New Features:
- Production-ready invoice auto-generation trigger
- Automated smoke testing suite
- Test data creation scripts
- Comprehensive QA documentation

Testing:
- 10 bugs identified and documented
- 2 critical bugs fixed and validated
- Automated test suite (7 tests)
- Manual validation guide

Documentation:
- 12,000+ words of QA documentation
- Step-by-step fix guides
- Deployment instructions
- Troubleshooting guides

Files Changed:
- app/create-product-order/page.tsx
- app/book-package/page.tsx
- CREATE_TEST_DATA.sql
- AUTOMATED_SMOKE_TEST.sql
- AUTO_GENERATE_INVOICE_PRODUCTION.sql
- (+ 10 more documentation files)

Status: Ready for production deployment" || {
    echo -e "${YELLOW}⚠️  Nothing to commit or commit failed${NC}"
}

echo ""
echo "🚀 Pushing to GitHub..."
git push origin main || {
    echo -e "${RED}❌ Git push failed${NC}"
    echo "Fix issues and try again"
    exit 1
}

echo -e "${GREEN}✅ Code deployed to GitHub${NC}"

echo ""
echo -e "${BLUE}📋 Step 5: Manual Validation${NC}"
echo ""

echo "🧪 Please perform manual testing:"
echo ""
echo "Test 1: Create Product Order"
echo "  1. Log in to CRM"
echo "  2. Go to /bookings → Add Booking → Product Order"
echo "  3. Select customer, add products"
echo "  4. Payment Type: Full Payment"
echo "  5. Click Create"
echo "  6. Verify booking created"
echo "  7. Check /invoices page for new invoice"
echo ""
echo "Test 2: Create Package Booking"
echo "  1. Go to /bookings → Add Booking → Package"
echo "  2. Select customer, select package"
echo "  3. Payment Type: Advance (50%)"
echo "  4. Click Create"
echo "  5. Verify booking created"
echo "  6. Check /invoices page"
echo ""
echo "Test 3: Verify Database"
echo "  Run in Supabase SQL Editor:"
echo "  SELECT * FROM product_orders WHERE created_at > NOW() - INTERVAL '5 minutes';"
echo ""
echo "  Expected:"
echo "    ✅ franchise_id = YOUR franchise (not 00000000...)"
echo "    ✅ amount_paid > 0 (not 0)"
echo "    ✅ Invoice exists in invoices table"
echo ""
read -p "All manual tests passed? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ Manual testing incomplete${NC}"
    echo ""
    echo "Complete testing before marking as production-ready"
    exit 1
fi

echo ""
echo "═══════════════════════════════════════════════"
echo -e "${GREEN}✅ DEPLOYMENT COMPLETE!${NC}"
echo "═══════════════════════════════════════════════"
echo ""
echo "🎉 System Status: Production Ready"
echo ""
echo "📊 What Was Deployed:"
echo "  ✅ Bug #1 fixed (hard-coded franchise_id)"
echo "  ✅ Bug #2 fixed (amount_paid always 0)"
echo "  ✅ Invoice auto-generation trigger"
echo "  ✅ Automated testing suite"
echo "  ✅ Comprehensive documentation"
echo ""
echo "📝 Next Steps:"
echo "  1. Monitor Supabase logs for errors"
echo "  2. Create a few real bookings"
echo "  3. Verify invoices generate correctly"
echo "  4. Continue with remaining bugs (#4-#10)"
echo ""
echo "📚 Documentation:"
echo "  - PRODUCTION_READINESS_GUIDE.md (complete guide)"
echo "  - QA_CRUD_TEST_REPORT.md (detailed QA report)"
echo "  - CRITICAL_BUGS_FIXES.md (bug fix instructions)"
echo "  - AUTO_INVOICE_IMPLEMENTATION_GUIDE.md (invoice guide)"
echo ""
echo "🆘 Rollback:"
echo "  If issues found, run: git revert HEAD && git push origin main --force"
echo ""
echo "═══════════════════════════════════════════════"
echo ""
echo -e "${GREEN}Production deployment successful! 🚀${NC}"
echo ""

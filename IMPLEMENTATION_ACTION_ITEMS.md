# Action Items - Custom API Authorization Implementation

## 🎯 Phase 2: Pilot Endpoints (Next Week)

### Tasks

#### Task 1: Refactor Customers API
**File**: `/app/api/customers/route.ts`  
**Effort**: 2-3 hours  
**Steps**:
- [ ] Read current code
- [ ] Read pattern from `API_IMPLEMENTATION_GUIDE.md` (Pattern 1: Protected CRUD)
- [ ] Replace `requireAuth` with `authenticateRequest`
- [ ] Remove manual permission checking
- [ ] Replace manual franchise filtering with `applyFranchiseFilter`
- [ ] Test with 3 users (super_admin, franchise_admin, staff)
- [ ] Verify franchise isolation works
- [ ] Check console logs for debugging info
- [ ] Verify no RLS errors in logs

#### Task 2: Refactor Vendors API
**File**: `/app/api/vendors/route.ts` and `/app/api/vendors/[id]/route.ts`  
**Effort**: 2-3 hours  
**Steps**: Same as above

#### Task 3: Refactor Bookings API  
**File**: `/app/api/bookings/route.ts` (if exists) or `/app/api/calendar-bookings/route.ts`  
**Effort**: 2-3 hours  
**Steps**: Same as above

#### Task 4: Test & Verify
**Effort**: 2-3 hours  
**Tests to Run**:
- [ ] Super admin can see/create records from all franchises
- [ ] Franchise admin can only see/create own franchise records
- [ ] Staff cannot create records (if no permission)
- [ ] Staff with unchecked permission cannot access
- [ ] Franchise admin cannot access other franchise data
- [ ] No RLS errors in server logs
- [ ] No FK constraint errors in logs

#### Task 5: Document Learnings
**Effort**: 1 hour  
**Output**: Document any:
- [ ] Issues found and how to fix them
- [ ] Code patterns that work well
- [ ] Edge cases discovered
- [ ] Performance observations

---

## 🎯 Phase 3: Business Modules (Weeks 2-3)

### High-Priority APIs
- [ ] Quotes API (`/app/api/quotes/*`)
- [ ] Invoices API (`/app/api/invoices/*` or `/app/api/settings/*`)
- [ ] Product Orders API (if exists)
- [ ] Expenses API (if exists)

### Medium-Priority APIs
- [ ] Laundry API
- [ ] Deliveries API
- [ ] Product Archive API

**Timeline**: 2-3 hours per API group

---

## 🎯 Phase 4: Admin APIs (Week 4)

### Required APIs
- [ ] Staff Management API (`/app/api/staff/*`)
- [ ] Franchises API (if exists)
- [ ] Settings APIs (`/app/api/settings/*`)
- [ ] Integrations API (`/app/api/integrations/*` or `/app/api/woocommerce/*`)

**Timeline**: 2 hours per API group

---

## 🎯 Phase 5: Cleanup & Production (Week 5-6)

### Database Cleanup
- [ ] List all RLS policies (grep for `CREATE POLICY`)
- [ ] Disable RLS on tables one by one
- [ ] Test after each disable
- [ ] List all FK constraints
- [ ] Evaluate which ones to keep/remove
- [ ] Create backup before removing constraints
- [ ] Remove constraints and test

### Testing Checklist
- [ ] Full integration test suite runs
- [ ] All permission combinations tested
- [ ] Franchise isolation verified
- [ ] Performance benchmarks (should be faster)
- [ ] Load test (1000 concurrent requests)
- [ ] Regression testing for all features

### Deployment
- [ ] Code review of all changes
- [ ] Merge to production branch
- [ ] Deploy to staging first
- [ ] Monitor logs for 24 hours
- [ ] Deploy to production
- [ ] Monitor logs for issues
- [ ] Create rollback plan (just in case)

---

## 📋 Weekly Progress Template

### Week 1 (Completed ✅)
- [x] Design custom API auth system
- [x] Build core functions (`/lib/api/authorization.ts`)
- [x] Build middleware (`/lib/api/permission-middleware.ts`)
- [x] Create 4 documentation files
- [x] Get design approved

### Week 2 (Pilot Phase)
**Start Date**: [Date]

**Monday-Tuesday** (Customers API)
- [ ] Refactor code
- [ ] Test locally
- [ ] Fix issues

**Wednesday-Thursday** (Vendors + Bookings API)
- [ ] Refactor code
- [ ] Test locally
- [ ] Fix issues

**Friday** (Review & Documentation)
- [ ] Code review
- [ ] Update documentation
- [ ] Lessons learned
- [ ] Plan adjustments

**Issues Found**:
- (List any)

**What Worked Well**:
- (List any)

**Adjustments for Next Week**:
- (List any)

---

## 📞 Support Contacts

### Questions During Implementation?
1. **Read first**: `API_IMPLEMENTATION_GUIDE.md` (has 5 patterns)
2. **Visual help**: `CUSTOM_API_AUTH_VISUAL.md` (has diagrams)
3. **Code reference**: `/lib/api/authorization.ts` (comments explain each function)
4. **Ask**: [Team/Slack channel]

### Found a Bug?
1. Add console logs to `hasPermission()`, `applyFranchiseFilter()`
2. Check user's permissions in database
3. Check user's franchise_id matches resource
4. Check role hierarchy
5. Report with detailed logs

### Need to Modify Functions?
1. Check all usages first (14 functions currently)
2. Update all calling code
3. Run full test suite
4. Document changes

---

## 🔍 Code Review Checklist

Before approving each refactored endpoint:

- [ ] Uses `authenticateRequest()` not old `requireAuth()`
- [ ] No manual permission checking
- [ ] Uses `applyFranchiseFilter()` correctly
- [ ] Has appropriate error handling
- [ ] Logs authorization decisions (for debugging)
- [ ] Tested with different roles
- [ ] No RLS errors in logs
- [ ] No FK constraint errors
- [ ] Performance acceptable
- [ ] Code matches standard pattern
- [ ] Documentation updated if needed

---

## 🧪 Testing Checklist (Per Endpoint)

### Basic Access Tests
- [ ] Super admin can access
- [ ] Franchise admin can access own franchise
- [ ] Franchise admin CANNOT access other franchise
- [ ] Staff can access if permission enabled
- [ ] Staff CANNOT access if permission disabled

### CRUD Tests
- [ ] GET returns correct filtered data
- [ ] POST creates record with correct franchise
- [ ] PUT updates record if authorized
- [ ] PUT rejected if not authorized
- [ ] DELETE removes record if authorized
- [ ] DELETE rejected if not authorized

### Edge Cases
- [ ] User with null permissions
- [ ] User with null franchise_id
- [ ] Record with null franchise_id
- [ ] Deleted user trying to access
- [ ] Franchise admin trying to edit themselves
- [ ] Concurrent requests from same user

### Performance
- [ ] Response time < 200ms
- [ ] No database query errors
- [ ] No timeout errors
- [ ] Memory usage stable

### Logging
- [ ] Authorization decision logged
- [ ] Permission check logged
- [ ] Franchise filter logged
- [ ] Any denials logged with reason

---

## 📊 Success Metrics

### Phase 2 Success
- ✅ 3 endpoints refactored
- ✅ All tests passing
- ✅ No RLS errors in logs
- ✅ Consistent pattern applied
- ✅ Team understands the pattern

### Phase 3 Success
- ✅ All business module APIs refactored
- ✅ Full regression testing done
- ✅ Performance verified
- ✅ Documentation complete

### Phase 5 Success
- ✅ All 114 endpoints using new system
- ✅ 0 RLS policies remaining
- ✅ 0 FK constraint issues
- ✅ Tests passing
- ✅ Production deployment successful
- ✅ Team trained

---

## 💾 Backup & Rollback

### Before Phase 5 (DB Cleanup)
```bash
# Backup database
pg_dump [connection_string] > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup RLS policies (for reference)
psql [connection] -c "\dp *.*" > rls_policies_backup.txt

# Backup FK constraints
psql [connection] -c "SELECT constraint_name FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY'" > fk_constraints_backup.txt
```

### If Issues Found
1. Stop deployment
2. Restore from backup
3. Investigate issue
4. Create fix
5. Re-test
6. Re-deploy

---

## 📚 Reference Documents

For implementation, refer to:

1. **`API_IMPLEMENTATION_GUIDE.md`** - Start here
   - Quick start code
   - 5 common patterns
   - Step-by-step examples
   
2. **`CUSTOM_API_AUTH_VISUAL.md`** - Visual understanding
   - Architecture diagrams
   - Decision trees
   - Data flow examples
   
3. **`CUSTOM_API_AUTH_SYSTEM_SUMMARY.md`** - Big picture
   - Problems & solutions
   - 7-phase plan
   - Benefits
   
4. **`CUSTOM_API_AUTH_SYSTEM_DESIGN.md`** - Deep dive
   - Technical details
   - Migration strategy
   - Risk mitigation

5. **Code files**:
   - `/lib/api/authorization.ts` - Core functions (well-commented)
   - `/lib/api/permission-middleware.ts` - Middleware functions

---

## ✅ Final Checklist

Before Phase 2 starts:
- [ ] All stakeholders have read docs
- [ ] Team understands the pattern
- [ ] 3 endpoints ready to refactor
- [ ] Testing environment ready
- [ ] Development branch created
- [ ] Backup procedures in place
- [ ] Rollback plan documented

Ready to implement! Good luck! 🚀

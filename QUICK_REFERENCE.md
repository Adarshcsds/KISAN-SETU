# KisanSetu Quick Reference Guide

## What Was Changed?

### ✅ Core Fix: Real Data Flow
Before: Farmer → Buyer → Deal (worked), but then fake logistics/shipments  
After: Farmer → Buyer → Deal → Logistics → Payment → Delivery (ALL REAL)

### ✅ New Features Added
1. **Real Orders from Database** - Query actual trade_deals
2. **Transport Payment Workflow** - Request/Approve/Reject freight payment
3. **Farmer Communities** - Create groups, manage membership, coordinate together
4. **Database Schema Updates** - New tables for communities and payment tracking

---

## File Summary (What Changed)

| File | Change Type | Impact |
|------|-------------|--------|
| `backend/database.py` | Modified | Added tables: communities, community_members |
| `backend/models.py` | Modified | Added models: Community, CommunityMember |
| `backend/main.py` | Modified | Register communities router |
| `backend/routers/orders.py` | Modified | Add real DB query endpoints |
| `backend/routers/logistics.py` | Modified | Add freight payment workflow |
| `backend/routers/communities.py` | **NEW** | Full community system |
| `src/services/api.ts` | Modified | Add API methods for new features |
| `IMPLEMENTATION_SUMMARY.md` | **NEW** | Complete technical documentation |
| `DATABASE_MIGRATION.md` | **NEW** | Migration and setup guide |
| `QUICK_REFERENCE.md` | **NEW** | This file |

---

## How to Get Started

### Step 1: Setup PostgreSQL
```bash
# Install PostgreSQL (see DATABASE_MIGRATION.md for details)
# Create database: kisanmitra
# Set user: postgres
# Update .env with credentials
```

### Step 2: Run Backend
```bash
cd c:\Users\garvp\OneDrive\Desktop\KISAN\KISAN-SETU
python backend/main.py
```

### Step 3: Backend Auto-Migrates
- All new tables created automatically
- Columns added automatically
- Indexes created automatically
- No manual SQL needed!

### Step 4: Test Complete Flow
See IMPLEMENTATION_SUMMARY.md → "Manual Testing Flow"

---

## Key API Endpoints

### Real Orders (NEW)
```
GET /api/orders/my-orders
GET /api/orders/real-deals
```

### Logistics Shipments (ENHANCED)
```
POST /api/logistics/shipments/{dealId}/request-freight-payment
POST /api/logistics/shipments/{dealId}/approve-freight-payment
POST /api/logistics/shipments/{dealId}/reject-freight-payment
```

### Communities (NEW)
```
POST /api/communities
GET /api/communities
GET /api/communities/{id}
POST /api/communities/{id}/join
POST /api/communities/{id}/leave
POST /api/communities/{id}/transfer-leadership
```

---

## Git Workflow

**DO NOT push directly to main**

### Create Feature Branch
```bash
git status  # Check current branch
git checkout -b backend-ml
```

### Commit Changes (Logical groups)
```bash
git add backend/routers/orders.py
git commit -m "Add real orders database query endpoints"

git add backend/routers/logistics.py
git commit -m "Add transport freight payment request/approval workflow"

git add backend/routers/communities.py backend/models.py backend/database.py backend/main.py
git commit -m "Implement farmer communities with membership management"

git add src/services/api.ts
git commit -m "Add frontend API methods for real orders, payments, and communities"
```

### Push to Remote
```bash
git push -u origin backend-ml
```

### Create Pull Request
```
On GitHub:
1. Go to pull requests
2. Create PR from backend-ml → main
3. Add description:
   - What: Real data flow for orders, transport payment, communities
   - Why: Enable actual farmer-buyer-logistics transactions
   - How: Database queries, payment states, community management
4. Wait for review
5. Merge when approved
```

---

## Testing Checklist

- [ ] Backend starts without errors: `python backend/main.py`
- [ ] Health check works: `curl http://127.0.0.1:8000/api/health`
- [ ] Register buyer, farmer, logistics accounts
- [ ] Create real buyer demand
- [ ] Farmer sees and sends offer
- [ ] Buyer accepts, deal created in DB
- [ ] Logistics sees available deal
- [ ] Logistics accepts shipment
- [ ] Logistics requests freight payment
- [ ] Buyer approves payment
- [ ] Logistics assigns vehicle
- [ ] Farmer sees shipment tracking
- [ ] Buyer sees shipment tracking
- [ ] Logistics marks in-transit/delivered
- [ ] Buyer completes delivery
- [ ] Create farmer community
- [ ] Other farmer joins community
- [ ] Community appears in lists

---

## What NOT to Do

❌ DO NOT:
- Modify .env and commit it (credentials!)
- Require PostgreSQL to edit Python code
- Remove existing demo data
- Break existing `/orders` endpoint compatibility
- Add hardcoded API keys

✅ DO:
- Use environment variables for secrets
- Keep demo data for backward compatibility
- Test locally before pushing
- Write clean commit messages
- Ask questions in PR descriptions

---

## Architecture at a Glance

```
Frontend (React/TypeScript)
    ↓
API Service Client (src/services/api.ts)
    ↓
FastAPI Backend (backend/main.py)
    ├─ Routers:
    │   ├─ auth.py (login/register - existing)
    │   ├─ demands.py (buyer demands - existing)
    │   ├─ orders.py (ENHANCED: real DB queries)
    │   ├─ logistics.py (ENHANCED: payment workflow)
    │   ├─ communities.py (NEW: full system)
    │   ├─ predictions.py (existing)
    │   └─ chat.py (existing)
    ├─ Database Connection
    │   └─ PostgreSQL
    │       ├─ users (existing)
    │       ├─ buyer_demands (existing)
    │       ├─ demand_offers (existing)
    │       ├─ trade_deals (existing)
    │       ├─ logistics_shipments (ENHANCED)
    │       ├─ communities (NEW)
    │       └─ community_members (NEW)
    └─ Models
        ├─ Pydantic models for validation
        ├─ Database helpers for conversion
        └─ New Community models

Data Flow:
Buyer Demand → Farmer Offer → Trade Deal → Logistics Shipment
                              ↓                    ↓
                           Real Database      Real Database
                                                  ↓
                                        Freight Payment Flow
```

---

## Key Concepts

### 1. Real vs. Demo Data
- **Real**: Stored in PostgreSQL, queryable, persistent
- **Demo**: In-memory `data_store.py`, for UI fallback
- **Both coexist**: Real data preferred, demo as fallback

### 2. Freight Payment States
```
PENDING (initial)
  ↓ (logistics requests)
REQUESTED
  ├─ (buyer approves)
  │  ↓
  │  APPROVED (logistics can proceed)
  ├─ (buyer rejects)
  │  ↓
  │  REJECTED
  └─ (stays until one action)
```

### 3. Community Leadership
- **Leader**: Creates community, can transfer leadership
- **Admin**: Reserved for future use
- **Member**: Regular member, equal rights
- **No financial benefit** for leader role!

### 4. Logistics State Machine
```
AVAILABLE (initial, unassigned deal)
  ↓
ACCEPTED (logistics claims shipment)
  ↓
DISPATCHED (vehicle assigned, in dispatch)
  ↓
IN_TRANSIT (on the road)
  ↓
DELIVERED (arrived at destination)
  ↓
COMPLETED (buyer confirms)
```

---

## Common Questions

**Q: Do I need to run migrations?**  
A: No! The app auto-migrates on startup.

**Q: Can I keep using demo data?**  
A: Yes! Real and demo data coexist. Real data takes priority.

**Q: Will old orders still work?**  
A: Yes! The `/orders` endpoint still returns demo orders for backward compatibility.

**Q: What if PostgreSQL isn't running?**  
A: Backend will fail to start. See DATABASE_MIGRATION.md for setup.

**Q: Can I test without a real buyer?**  
A: Use demo buyers from data_store.py, or create real test accounts.

**Q: How do I see real deals?**  
A: Use `/api/orders/my-orders` (your deals) or `/api/orders/real-deals` (all deals)

**Q: Can farmers create buyer requests instead of offers?**  
A: Yes! Use `POST /api/demands/direct-requests` for direct requests to specific buyers.

**Q: What about notifications?**  
A: Not implemented yet - requires real-time system or polling.

**Q: Can communities make bulk orders?**  
A: Design is ready but frontend integration needed - communities can use existing demand/offer flow.

---

## Troubleshooting

### Backend won't start
```bash
# Check Python syntax
python -m py_compile backend/routers/orders.py

# Check imports
python -c "from backend.routers import orders, logistics, communities; print('✓')"

# Check PostgreSQL connection
psql -U postgres -h localhost -d kisanmitra
```

### Database migration failed
```bash
# Manually run SQL (see DATABASE_MIGRATION.md)
# Or delete database and restart (app recreates schema)
```

### API endpoints not found
```bash
# Check router is registered in main.py
# Check endpoint path matches your API call
# Check authentication token is valid
```

### Data doesn't appear
```bash
# Check your user role (farmer/buyer/logistics)
# Check API endpoint visibility (some need auth)
# Check database connection is working
```

---

## Performance Notes

For production deployment:
- Add pagination to list endpoints
- Index frequently-queried columns (already done)
- Use connection pooling
- Cache commodity/mandi data
- Monitor slow queries
- Set up automated backups

---

## Security Reminders

- Never commit .env file
- Never hardcode API keys
- Always validate user input
- Check role-based access (already implemented)
- Hash passwords (already implemented)
- Use HTTPS in production
- Sanitize database queries (using parameterized queries)

---

## Documentation Files

1. **IMPLEMENTATION_SUMMARY.md** - Complete technical overview
2. **DATABASE_MIGRATION.md** - Database setup and migration guide
3. **QUICK_REFERENCE.md** - This file
4. **README.md** - Original project readme

---

## Next Steps

1. ✅ Read IMPLEMENTATION_SUMMARY.md
2. ✅ Follow DATABASE_MIGRATION.md for setup
3. ✅ Run backend with `python backend/main.py`
4. ✅ Test complete flow with manual testing commands
5. ✅ Update frontend components to use `/api/orders/my-orders`
6. ✅ Add UI for community management
7. ✅ Add UI for freight payment approval
8. ✅ Deploy to production

---

## Support & Contact

All code is:
- ✅ Syntactically valid
- ✅ Import-verified
- ✅ Database schema-ready
- ✅ Ready for local testing
- ✅ Backward compatible
- ✅ Production-ready after local validation

**Issues?** Check the test flow in IMPLEMENTATION_SUMMARY.md or DATABASE_MIGRATION.md troubleshooting section.

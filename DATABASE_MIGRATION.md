# KisanSetu Database Migration Guide

## Automatic Migration (Recommended)

The application automatically creates/updates the database schema on startup through `backend/database.py` → `initialize_auth_schema()` function.

**No manual action needed!**

When you run `python backend/main.py`, all schema changes are automatically applied:
- Existing tables are preserved
- New columns are added if missing
- New tables are created if missing
- Indexes are created if missing

---

## Manual SQL Commands (For Reference/Direct DB Access)

If you need to manually apply schema changes to an existing database:

### 1. Add Transport Payment Tracking to Shipments

```sql
ALTER TABLE logistics_shipments 
ADD COLUMN IF NOT EXISTS freight_payment_status VARCHAR(20) 
DEFAULT 'PENDING' 
CHECK (freight_payment_status IN ('PENDING','REQUESTED','APPROVED','REJECTED','PAID'));
```

### 2. Create Communities Table

```sql
CREATE TABLE IF NOT EXISTS communities (
    id UUID PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    location TEXT NOT NULL,
    district VARCHAR(120) NOT NULL,
    state VARCHAR(120) NOT NULL,
    crop_focus VARCHAR(120),
    leader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' 
        CHECK (status IN ('ACTIVE','INACTIVE','SUSPENDED')),
    member_count INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 3. Create Community Members Table

```sql
CREATE TABLE IF NOT EXISTS community_members (
    id BIGSERIAL PRIMARY KEY,
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    farmer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'MEMBER' 
        CHECK (role IN ('LEADER','ADMIN','MEMBER')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(community_id, farmer_id)
);
```

### 4. Create Indexes for Performance

```sql
CREATE INDEX IF NOT EXISTS idx_community_members_community 
ON community_members(community_id);

CREATE INDEX IF NOT EXISTS idx_community_members_farmer 
ON community_members(farmer_id);

CREATE INDEX IF NOT EXISTS idx_communities_leader 
ON communities(leader_id);
```

---

## Verification Commands

After migration, verify the schema is correct:

### Check freight_payment_status column exists:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name='logistics_shipments' 
AND column_name='freight_payment_status';
```

Expected result:
```
column_name              | data_type
------------------------|----------
freight_payment_status   | character varying
```

### Check communities table exists:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('communities', 'community_members') 
AND table_schema='public';
```

Expected result:
```
table_name
-----------
communities
community_members
```

### Check all users table relationships:
```sql
SELECT constraint_name, table_name, column_name 
FROM information_schema.key_column_usage 
WHERE table_name IN ('communities', 'community_members')
ORDER BY table_name;
```

---

## Rollback Instructions (If Needed)

If you need to revert changes:

### Drop communities tables:
```sql
DROP TABLE IF EXISTS community_members CASCADE;
DROP TABLE IF EXISTS communities CASCADE;
```

### Remove freight_payment_status column:
```sql
ALTER TABLE logistics_shipments 
DROP COLUMN IF EXISTS freight_payment_status;
```

**Note**: Rollback will lose any community data. Do this only for testing/development.

---

## Environment Setup for Database

### .env Configuration
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kisanmitra
DB_USER=postgres
DB_PASSWORD=YOUR_PASSWORD_HERE
```

### PostgreSQL Installation

**Windows (via WSL or native installer)**:
```bash
# Via WSL (recommended)
wsl
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# Start PostgreSQL
sudo service postgresql start

# Create database
sudo -u postgres createdb kisanmitra
sudo -u postgres psql
\password postgres
# Set password to match DB_PASSWORD in .env
```

**macOS**:
```bash
brew install postgresql
brew services start postgresql
createdb kisanmitra
```

**Linux**:
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo -u postgres createdb kisanmitra
```

---

## Testing Schema After Setup

```bash
cd /path/to/KISAN-SETU

# Start Python server (auto-migrates schema)
python backend/main.py

# In another terminal, test connection
curl http://127.0.0.1:8000/api/health

# Response should be:
# {"status":"healthy","service":"KisanSetu FastAPI Backend","ml_engine":"online","data_store":"active"}
```

---

## Common Issues & Solutions

### Issue: "FATAL: role 'postgres' does not exist"
**Solution**: Check PostgreSQL is running and user exists
```bash
sudo -u postgres psql -c "\du"  # List users
sudo -u postgres createuser postgres  # Create if missing
```

### Issue: "FATAL: database 'kisanmitra' does not exist"
**Solution**: Create database
```bash
sudo -u postgres createdb kisanmitra
```

### Issue: "connection refused"
**Solution**: Ensure PostgreSQL is running
```bash
# Windows/Linux
sudo service postgresql status
sudo service postgresql start

# macOS
brew services start postgresql
```

### Issue: "column already exists"
**Solution**: Safe - the migration checks with IF NOT EXISTS, so running it again is fine

### Issue: Authentication error with Python
**Solution**: Verify .env credentials match PostgreSQL setup
```bash
# Test connection manually
psql -U postgres -h localhost -d kisanmitra
# Enter password from .env
```

---

## Performance Tuning (Optional)

If you have large datasets:

```sql
-- Analyze tables for query optimization
ANALYZE communities;
ANALYZE community_members;
ANALYZE logistics_shipments;
ANALYZE trade_deals;

-- Vacuum to reclaim space
VACUUM communities;
VACUUM community_members;
VACUUM logistics_shipments;
```

---

## Backup Commands

Before production deployment:

```bash
# Full database backup
pg_dump -U postgres kisanmitra > kisanmitra_backup.sql

# Restore from backup
psql -U postgres kisanmitra < kisanmitra_backup.sql
```

---

## Schema Diagram

```
Users (existing)
├── farmer_profiles
├── buyer_profiles
├── logistics_profiles
└── (NEW) communities
    └── (NEW) community_members

Trade Flow:
buyer_demands → demand_offers → trade_deals → logistics_shipments
                                              ├── freight_payment_status (NEW)
                                              ├── status
                                              └── vehicle details
```

---

## Migration Checklist

- [ ] PostgreSQL installed and running
- [ ] .env configured with DB credentials
- [ ] Database 'kisanmitra' created
- [ ] Run `python backend/main.py` once (auto-migration)
- [ ] Verify with `curl http://127.0.0.1:8000/api/health`
- [ ] Test with sample registration (see IMPLEMENTATION_SUMMARY.md)
- [ ] Verify communities table exists
- [ ] Verify logistics_shipments has freight_payment_status column
- [ ] Proceed with feature testing

---

## Support

If migrations fail:
1. Check PostgreSQL is running: `sudo service postgresql status`
2. Check DB credentials in .env
3. Check database exists: `psql -l`
4. Review backend startup logs for specific SQL errors
5. Manually run relevant SQL commands above

All schema changes are designed to be backward-compatible with existing data.

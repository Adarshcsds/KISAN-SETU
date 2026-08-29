import os

import psycopg2


DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", "5432")),
    "database": os.getenv("DB_NAME", "kisanmitra"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", "KisanMitra123"),
}


def get_connection():
    return psycopg2.connect(**DB_CONFIG)


def initialize_auth_schema():
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id UUID PRIMARY KEY,
                    name VARCHAR(120) NOT NULL,
                    phone VARCHAR(20) NOT NULL UNIQUE,
                    email VARCHAR(254) UNIQUE,
                    password_hash TEXT NOT NULL,
                    role VARCHAR(20) NOT NULL CHECK (role IN ('farmer', 'buyer', 'logistics')),
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    is_active BOOLEAN NOT NULL DEFAULT TRUE,
                    profile JSONB NOT NULL DEFAULT '{}'::jsonb
                )
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS farmer_profiles (
                    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                    location TEXT NOT NULL, district VARCHAR(120) NOT NULL,
                    state VARCHAR(120) NOT NULL, pin_code VARCHAR(12) NOT NULL,
                    farm_size_acres NUMERIC(12, 2), primary_crop VARCHAR(120),
                    crops JSONB NOT NULL DEFAULT '[]'::jsonb
                )
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS farmer_crops (
                    id BIGSERIAL PRIMARY KEY, farmer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    crop_name VARCHAR(120) NOT NULL, crop_category VARCHAR(30) NOT NULL,
                    is_primary BOOLEAN NOT NULL DEFAULT FALSE
                )
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS buyer_profiles (
                    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                    firm_name VARCHAR(200) NOT NULL, business_type VARCHAR(120) NOT NULL,
                    address TEXT NOT NULL, district VARCHAR(120) NOT NULL,
                    state VARCHAR(120) NOT NULL, pin_code VARCHAR(12) NOT NULL
                )
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS logistics_profiles (
                    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                    firm_name VARCHAR(200) NOT NULL, address TEXT NOT NULL,
                    district VARCHAR(120) NOT NULL, state VARCHAR(120) NOT NULL, pin_code VARCHAR(12) NOT NULL,
                    warehouse_available BOOLEAN NOT NULL DEFAULT FALSE, warehouse_address TEXT,
                    cold_storage_available BOOLEAN NOT NULL DEFAULT FALSE, cold_storage_address TEXT,
                    vehicle_types JSONB NOT NULL DEFAULT '[]'::jsonb, vehicle_capacity VARCHAR(120),
                    service_areas JSONB NOT NULL DEFAULT '[]'::jsonb
                )
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS buyer_demands (
                    id UUID PRIMARY KEY, buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    crop_name VARCHAR(120) NOT NULL, crop_category VARCHAR(50) NOT NULL,
                    quantity_quintals NUMERIC(12,2) NOT NULL CHECK (quantity_quintals > 0),
                    offered_price_per_quintal NUMERIC(12,2) NOT NULL CHECK (offered_price_per_quintal > 0),
                    quality_grade VARCHAR(120) NOT NULL, delivery_location TEXT NOT NULL,
                    deadline TIMESTAMPTZ NOT NULL, notes TEXT,
                    status VARCHAR(30) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','PARTIALLY_MATCHED','MATCHED','CLOSED','CANCELLED')),
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS demand_offers (
                    id UUID PRIMARY KEY, demand_id UUID NOT NULL REFERENCES buyer_demands(id) ON DELETE CASCADE,
                    farmer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    offered_quantity_quintals NUMERIC(12,2) NOT NULL CHECK (offered_quantity_quintals > 0),
                    offered_price_per_quintal NUMERIC(12,2) NOT NULL CHECK (offered_price_per_quintal > 0),
                    quality_grade VARCHAR(120) NOT NULL, message TEXT,
                    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','COUNTERED','ACCEPTED','REJECTED','WITHDRAWN')),
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS trade_deals (
                    id UUID PRIMARY KEY, deal_code VARCHAR(32) NOT NULL UNIQUE,
                    offer_id UUID UNIQUE REFERENCES demand_offers(id), demand_id UUID REFERENCES buyer_demands(id),
                    farmer_id UUID NOT NULL REFERENCES users(id), buyer_id UUID NOT NULL REFERENCES users(id),
                    crop_name VARCHAR(120) NOT NULL, agreed_quantity_quintals NUMERIC(12,2) NOT NULL,
                    agreed_price_per_quintal NUMERIC(12,2) NOT NULL, gross_amount NUMERIC(14,2) NOT NULL,
                    pickup_location TEXT NOT NULL, delivery_location TEXT NOT NULL, quality_grade VARCHAR(120) NOT NULL,
                    deal_password TEXT NOT NULL, status VARCHAR(30) NOT NULL DEFAULT 'AGREED', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            """)
            cur.execute("CREATE INDEX IF NOT EXISTS idx_buyer_demands_active ON buyer_demands(status, deadline)")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_buyer_demands_buyer ON buyer_demands(buyer_id)")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_demand_offers_demand ON demand_offers(demand_id)")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_demand_offers_farmer ON demand_offers(farmer_id)")
            cur.execute("""
                CREATE TABLE IF NOT EXISTS farmer_direct_requests (
                    id UUID PRIMARY KEY, farmer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    crop_name VARCHAR(120) NOT NULL, crop_category VARCHAR(50) NOT NULL,
                    quantity_quintals NUMERIC(12,2) NOT NULL CHECK (quantity_quintals > 0),
                    offered_price_per_quintal NUMERIC(12,2) NOT NULL CHECK (offered_price_per_quintal > 0),
                    quality_grade VARCHAR(120) NOT NULL, pickup_location TEXT NOT NULL, message TEXT,
                    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','COUNTERED','ACCEPTED','REJECTED','WITHDRAWN')),
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            """)
            cur.execute("CREATE INDEX IF NOT EXISTS idx_farmer_direct_requests_buyer ON farmer_direct_requests(buyer_id, status)")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_farmer_direct_requests_farmer ON farmer_direct_requests(farmer_id, status)")
            cur.execute("ALTER TABLE trade_deals ALTER COLUMN offer_id DROP NOT NULL")
            cur.execute("ALTER TABLE trade_deals ADD COLUMN IF NOT EXISTS direct_request_id UUID UNIQUE REFERENCES farmer_direct_requests(id)")
            cur.execute("""
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1 FROM pg_attribute
                        WHERE attrelid = 'trade_deals'::regclass
                          AND attname = 'demand_id'
                          AND attnotnull
                    ) THEN
                        ALTER TABLE trade_deals ALTER COLUMN demand_id DROP NOT NULL;
                    END IF;
                END $$
            """)
            cur.execute("""
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_constraint
                        WHERE conrelid = 'trade_deals'::regclass AND conname = 'trade_deals_source_check'
                    ) THEN
                        ALTER TABLE trade_deals ADD CONSTRAINT trade_deals_source_check
                            CHECK (demand_id IS NOT NULL OR direct_request_id IS NOT NULL);
                    END IF;
                END $$
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS logistics_shipments (
                    id UUID PRIMARY KEY,
                    trade_deal_id UUID NOT NULL UNIQUE REFERENCES trade_deals(id) ON DELETE CASCADE,
                    provider_id UUID REFERENCES users(id) ON DELETE SET NULL,
                    transporter_name VARCHAR(200), truck_type VARCHAR(120), license_plate VARCHAR(40),
                    driver_name VARCHAR(120), driver_phone VARCHAR(20), distance_km NUMERIC(10,2),
                    freight_amount NUMERIC(14,2), gate_pass_id VARCHAR(40) UNIQUE,
                    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE'
                        CHECK (status IN ('AVAILABLE','ACCEPTED','DISPATCHED','IN_TRANSIT','DELIVERED','COMPLETED')),
                    freight_payment_status VARCHAR(20) DEFAULT 'PENDING' 
                        CHECK (freight_payment_status IN ('PENDING','REQUESTED','APPROVED','REJECTED','PAID')),
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    dispatched_at TIMESTAMPTZ, delivered_at TIMESTAMPTZ
                )
            """)
            cur.execute("ALTER TABLE logistics_shipments ADD COLUMN IF NOT EXISTS freight_payment_status VARCHAR(20) DEFAULT 'PENDING' CHECK (freight_payment_status IN ('PENDING','REQUESTED','APPROVED','REJECTED','PAID'))")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_logistics_shipments_provider ON logistics_shipments(provider_id, status)")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_logistics_shipments_status ON logistics_shipments(status)")
            
            # Community Tables
            cur.execute("""
                CREATE TABLE IF NOT EXISTS communities (
                    id UUID PRIMARY KEY,
                    name VARCHAR(200) NOT NULL,
                    description TEXT,
                    location TEXT NOT NULL,
                    district VARCHAR(120) NOT NULL,
                    state VARCHAR(120) NOT NULL,
                    crop_focus VARCHAR(120),
                    leader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE','SUSPENDED')),
                    member_count INTEGER NOT NULL DEFAULT 1,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS community_members (
                    id BIGSERIAL PRIMARY KEY,
                    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
                    farmer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    role VARCHAR(20) NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('LEADER','ADMIN','MEMBER')),
                    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    UNIQUE(community_id, farmer_id)
                )
            """)
            cur.execute("CREATE INDEX IF NOT EXISTS idx_community_members_community ON community_members(community_id)")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_community_members_farmer ON community_members(farmer_id)")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_communities_leader ON communities(leader_id)")
        conn.commit()
    finally:
        conn.close()

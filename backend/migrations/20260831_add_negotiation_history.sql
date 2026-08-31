-- Apply once to PostgreSQL/Neon before deploying negotiation history.
CREATE TABLE IF NOT EXISTS offer_negotiations (
    id UUID PRIMARY KEY,
    offer_id UUID NOT NULL REFERENCES demand_offers(id) ON DELETE CASCADE,
    offered_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    offered_price NUMERIC(12,2) NOT NULL CHECK (offered_price > 0),
    round_number SMALLINT NOT NULL CHECK (round_number BETWEEN 1 AND 4),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT offer_negotiations_offer_round_unique UNIQUE (offer_id, round_number)
);
CREATE INDEX IF NOT EXISTS idx_offer_negotiations_offer ON offer_negotiations(offer_id, round_number);

ALTER TABLE logistics_shipments ADD COLUMN IF NOT EXISTS freight_payment_reference VARCHAR(40);
ALTER TABLE logistics_shipments DROP CONSTRAINT IF EXISTS logistics_shipments_freight_payment_status_check;
ALTER TABLE logistics_shipments ADD CONSTRAINT logistics_shipments_freight_payment_status_check
    CHECK (freight_payment_status IN ('PENDING','REQUESTED','APPROVED','REJECTED','PAID'));

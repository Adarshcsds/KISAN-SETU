-- Apply once to the target PostgreSQL/Neon database before deploying this feature.
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    issue_type VARCHAR(80) NOT NULL, description TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','IN_PROGRESS','RESOLVED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS trade_issues (
    id UUID PRIMARY KEY, trade_deal_id UUID NOT NULL REFERENCES trade_deals(id) ON DELETE CASCADE,
    reporter_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    issue_type VARCHAR(80) NOT NULL, description TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','IN_PROGRESS','RESOLVED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_trade_issues_reporter ON trade_issues(reporter_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trade_issues_deal ON trade_issues(trade_deal_id);

CREATE TABLE IF NOT EXISTS trade_feedback (
    id UUID PRIMARY KEY, trade_deal_id UUID NOT NULL REFERENCES trade_deals(id) ON DELETE CASCADE,
    reviewer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewee_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5), comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT trade_feedback_unique_reviewer UNIQUE (trade_deal_id, reviewer_user_id, reviewee_user_id)
);
CREATE INDEX IF NOT EXISTS idx_trade_feedback_reviewer ON trade_feedback(reviewer_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trade_feedback_reviewee ON trade_feedback(reviewee_user_id, created_at DESC);

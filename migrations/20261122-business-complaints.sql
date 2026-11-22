BEGIN;

CREATE TABLE IF NOT EXISTS business_complaints (
    id UUID PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES business_profiles(id),
    reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    explanation TEXT NOT NULL,
    evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'resolved', 'dismissed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS business_complaints_business_status
    ON business_complaints (business_id, status, created_at DESC);

COMMIT;

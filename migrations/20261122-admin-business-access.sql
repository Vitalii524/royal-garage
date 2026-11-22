BEGIN;

CREATE TABLE IF NOT EXISTS admin_business_audit (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    business_id UUID NOT NULL,
    admin_id UUID NOT NULL,
    action TEXT NOT NULL,
    reason TEXT NOT NULL,
    before_state JSONB NOT NULL,
    after_state JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS admin_business_audit_business_order
    ON admin_business_audit (business_id, id DESC);

COMMIT;

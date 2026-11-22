BEGIN;
ALTER TABLE business_profiles
    ADD COLUMN IF NOT EXISTS moderation_status text NOT NULL DEFAULT 'active'
        CHECK (moderation_status IN ('active', 'review', 'restricted', 'blocked')),
    ADD COLUMN IF NOT EXISTS moderation_until timestamptz,
    ADD COLUMN IF NOT EXISTS moderation_decision_id uuid;

CREATE TABLE IF NOT EXISTS business_moderation_decisions (
    id uuid PRIMARY KEY,
    business_id uuid NOT NULL REFERENCES business_profiles(id),
    owner_id uuid NOT NULL REFERENCES users(id),
    admin_id uuid NOT NULL REFERENCES users(id),
    action text NOT NULL CHECK (action IN ('warning', 'review', 'restrict', 'block', 'restore')),
    reason text NOT NULL,
    expires_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    CHECK ((action = 'restrict') = (expires_at IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS business_moderation_owner_history
    ON business_moderation_decisions(owner_id, created_at DESC);

CREATE TABLE IF NOT EXISTS business_moderation_appeals (
    decision_id uuid PRIMARY KEY REFERENCES business_moderation_decisions(id),
    owner_id uuid NOT NULL REFERENCES users(id),
    explanation text NOT NULL,
    status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','resolved','dismissed')),
    response text,
    created_at timestamptz NOT NULL DEFAULT now()
);
COMMIT;

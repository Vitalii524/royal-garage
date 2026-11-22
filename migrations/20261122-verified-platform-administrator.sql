BEGIN;

CREATE TABLE IF NOT EXISTS platform_access_audit (
    event_key TEXT PRIMARY KEY,
    account_id UUID NOT NULL,
    access_scope TEXT NOT NULL,
    previous_value TEXT NOT NULL,
    new_value TEXT NOT NULL,
    verification_method TEXT NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- This approval applies only to the account verified through the production sign-in.
WITH target AS (
    SELECT id, role
    FROM users
    WHERE id = '69aad28d-9cdd-4470-8cb9-c0fa9cb877fd'::uuid
      AND lower(email) = 'v429771@gmail.com'
      AND account_type = 'user'
      AND role = 'user'
      AND email_verified AND NOT account_disabled
    FOR UPDATE
), recorded AS (
    INSERT INTO platform_access_audit (
        event_key, account_id, access_scope, previous_value, new_value, verification_method
    )
    SELECT '20261122-vitalii-platform-admin', id, 'platform_role', role, 'admin', 'verified_production_sign_in'
    FROM target
    ON CONFLICT (event_key) DO NOTHING
    RETURNING account_id
)
UPDATE users u
SET role = 'admin', updated_at = NOW()
FROM recorded
WHERE u.id = recorded.account_id;

COMMIT;

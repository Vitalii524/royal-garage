BEGIN;

WITH target AS (
    SELECT u.id AS owner_id, u.name AS old_name, bp.id AS profile_id
    FROM users u JOIN business_profiles bp ON bp.owner_id = u.id
    WHERE u.id = 'b61d05c8-0cab-4432-b36e-267440d87b6a'::uuid
      AND bp.id = '09c354eb-36f8-427e-8a29-74cc02f38f6c'::uuid
      AND u.name = 'STO' AND bp.name = 'Редакція Royal Garage'
      AND u.role = 'user' AND u.email_verified AND NOT u.account_disabled
      AND NOT bp.is_deleted
    FOR UPDATE OF u, bp
), recorded AS (
    INSERT INTO platform_access_audit (
        event_key, account_id, access_scope, previous_value, new_value, verification_method
    )
    SELECT '20261122-editorial-public-identity', owner_id, 'editorial_identity',
           old_name, 'Редакція Royal Garage', 'confirmed_existing_editorial_account'
    FROM target
    ON CONFLICT (event_key) DO NOTHING
    RETURNING account_id
), account AS (
    UPDATE users u SET name = 'Редакція Royal Garage',
        profile_photo = '/images/royal-garage-logo.png', updated_at = NOW()
    FROM recorded r WHERE u.id = r.account_id
    RETURNING u.id
)
UPDATE business_profiles bp
SET logo = '/images/royal-garage-logo.png', updated_at = NOW()
FROM target t JOIN account u ON u.id = t.owner_id
WHERE bp.id = t.profile_id AND bp.owner_id = t.owner_id;

COMMIT;

BEGIN;

WITH target AS (
    SELECT id, owner_id
    FROM business_profiles
    WHERE id = '09c354eb-36f8-427e-8a29-74cc02f38f6c'::uuid
      AND owner_id = 'b61d05c8-0cab-4432-b36e-267440d87b6a'::uuid
      AND name = 'Редакція Royal Garage'
      AND NOT is_deleted
    FOR UPDATE
), recorded AS (
    INSERT INTO platform_access_audit (
        event_key, account_id, access_scope, previous_value, new_value, verification_method
    )
    SELECT '20261122-editorial-remove-address', owner_id, 'editorial_location',
           'location_present', 'location_removed', 'confirmed_existing_editorial_account'
    FROM target
    ON CONFLICT (event_key) DO NOTHING
    RETURNING account_id
)
UPDATE business_profiles bp
SET address = NULL, city = NULL, updated_at = NOW()
FROM target t JOIN recorded r ON r.account_id = t.owner_id
WHERE bp.id = t.id AND bp.owner_id = t.owner_id;

COMMIT;

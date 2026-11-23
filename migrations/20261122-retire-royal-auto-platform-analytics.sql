INSERT INTO platform_access_audit (
    event_key, account_id, access_scope, previous_value, new_value, verification_method
)
SELECT '20261122-royal-auto-analytics-retired', royal.id, 'platform_analytics',
       'legacy_allowlist', 'denied', 'new_administrator_confirmed_production_panel'
FROM users royal
WHERE royal.id = '32ce413e-9eb6-417a-b99a-77d9ca7c144a'::uuid
  AND EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = '69aad28d-9cdd-4470-8cb9-c0fa9cb877fd'::uuid
        AND lower(u.email) = 'v429771@gmail.com'
        AND u.role = 'admin' AND u.email_verified AND NOT u.account_disabled
  )
ON CONFLICT (event_key) DO NOTHING;

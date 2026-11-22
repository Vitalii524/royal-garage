-- Apply only after approval of the existing production account ID.
BEGIN;
DO $$
BEGIN
    UPDATE users u
    SET name = 'Редакція Royal Garage',
        profile_photo = '/images/royal-garage-logo.png',
        updated_at = NOW()
    WHERE u.id = 'b61d05c8-0cab-4432-b36e-267440d87b6a'
      AND u.role = 'user'
      AND u.email_verified
      AND NOT u.account_disabled
      AND EXISTS (
          SELECT 1 FROM business_profiles bp
          WHERE bp.id = '09c354eb-36f8-427e-8a29-74cc02f38f6c'
            AND bp.owner_id = u.id AND NOT bp.is_deleted
      );
    IF NOT FOUND THEN
        RAISE EXCEPTION 'The expected editorial account and profile were not found';
    END IF;

    UPDATE business_profiles
    SET logo = '/images/royal-garage-logo.png', updated_at = NOW()
    WHERE id = '09c354eb-36f8-427e-8a29-74cc02f38f6c'
      AND owner_id = 'b61d05c8-0cab-4432-b36e-267440d87b6a'
      AND NOT is_deleted;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'The expected editorial profile was not found';
    END IF;
END $$;
COMMIT;

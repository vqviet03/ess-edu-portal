BEGIN;

-- Create the LOGIN role in Neon Console/API first. The database owner remains
-- responsible for migrations; the API gets only the privileges it needs.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ess_api') THEN
    EXECUTE 'GRANT USAGE ON SCHEMA public TO ess_api';
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ess_api';
    EXECUTE 'GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ess_api';
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ess_api';
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO ess_api';
  ELSE
    RAISE NOTICE 'Role ess_api does not exist; runtime grants were skipped';
  END IF;
END
$$;

COMMIT;

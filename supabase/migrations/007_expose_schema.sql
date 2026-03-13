-- Grant usage on openrace schema to API roles
GRANT USAGE ON SCHEMA openrace TO anon, authenticated;

-- Grant access to all tables and views
GRANT SELECT ON ALL TABLES IN SCHEMA openrace TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA openrace TO authenticated;

-- Grant access to sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA openrace TO anon, authenticated;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA openrace GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA openrace GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA openrace GRANT USAGE ON SEQUENCES TO anon, authenticated;

-- Notify PostgREST to reload config (picks up new schema)
NOTIFY pgrst, 'reload config';

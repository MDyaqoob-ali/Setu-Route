-- PostgreSQL PostGIS Initialization Script for NE-ROUTE
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'NE-ROUTE PostGIS extensions initialized successfully.';
END $$;
